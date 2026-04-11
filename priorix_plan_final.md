# DeadlineOS — OODA Implementation Plan v3 (Final)

> **Constraint:** 12-hour build · 3 developers · Full product · Revenue is #1 scoring metric
> **Revenue Target:** 15+ paying users × ₹99 = ₹1,485+ within 24hrs post-launch
> **Stack:** Next.js 14 · Supabase · Upstash Redis · Claude AI · Razorpay · Railway
> **Deployment:** Railway ($5/month Hobby plan — cheapest reliable option, zero config, persistent container, no cold starts)

---

## Architectural Decisions

| # | Decision | Alternatives Considered | Rationale |
|---|----------|------------------------|-----------|
| 1 | **Supabase Auth** (not NextAuth) | NextAuth + Supabase adapter | NextAuth JWTs don't populate `auth.uid()` in Supabase — RLS silently breaks. Supabase Auth natively supports GitHub OAuth in ~10 lines and makes RLS work correctly with zero extra config. |
| 2 | **No `priority_score` in DB** | Store score, recompute on stale | Urgency decay is `e^(-hours_remaining/48)` — time-dependent by definition. A stored score is wrong the moment it's written. Compute at query time only. |
| 3 | **Supabase pooler URL from Hour 0** | Configure pooler in polish phase | Without pgbouncer (pooler URL port 6543), serverless-style invocations exhaust Postgres connections fast. Use pooler URL everywhere from day one. |
| 4 | 4 × 3hr OODA cycles | 6-8 micro-cycles, 2 large phases | Best balance of adaptability and focus; always has demoable state |
| 5 | Payments built FIRST (Cycle 1) | Payments last, payments middle | Revenue is #1 scoring metric — cannot risk it being incomplete |
| 6 | Razorpay live from Cycle 1 | Test mode → switch later | Switching modes risks breaking webhooks; verify live mode early |
| 7 | Claude Vision for timetable (not scraping) | College portal scraping | College variance too high; photo upload is universal |
| 8 | Polling/SSE over Pusher for real-time | Pusher WebSockets | Reduces setup time; real-time feed updates are nice-to-have |
| 9 | Tailwind CSS | Vanilla CSS, shadcn/ui | Speed of development; utility classes are fastest for 12hr build |
| 10 | Pro gate on assistant (not feed) | Gate the feed, gate profiles | Assistant is the highest-perceived-value feature; feed must be free to hook users |
| 11 | **Next Move card = `feed[0]` with reason** | Separate Life Logic Tree | Feed scoring already ranks everything correctly. A second parallel decision system creates divergence. Surface top-scored item with a human-readable reason string. |
| 12 | **Node.js runtime on all API routes** | Edge Runtime for feed/auth | Supabase client uses TCP — Edge Runtime doesn't support it. All routes use Node.js runtime. |
| 13 | **`username` column, explicit** | Reuse `github_username` as slug | T1 and T2 building profile independently — implicit field reuse causes divergence. |
| 14 | **Railway for deployment** | GCP Cloud Run, DigitalOcean, Vercel | GCP account creation failing. DO requires Student Pack approval time. Railway: persistent container (no cold starts), zero-config Next.js detection, deploy in 5 min, $5/month. Simplest path that works today. |

---

## Team Tracks

| Track | Owner | Responsibilities |
|-------|-------|-----------------|
| **T1 — Frontend** | Dev 1 | All UI/UX — pages, components, responsive, dark mode |
| **T2 — Backend+AI** | Dev 2 | API routes, LLM integrations, scoring engine, data models |
| **T3 — Infra+Payments** | Dev 3 | Razorpay, Supabase Auth, Railway deploy, Redis, QStash, webhooks |

---

## Inter-Track API Contract (Agree Before Hour 0)

> T2 and T3 both touch `subscriptions` and `users`. Lock this before the clock starts.

```ts
// users row (payment-relevant fields)
{ pro_status: boolean, pro_expires_at: string | null }  // ISO 8601

// subscriptions row
{
  user_id: string,
  razorpay_subscription_id: string,
  status: 'created' | 'authenticated' | 'active' | 'cancelled' | 'completed' | 'expired',
  current_period_end: string | null,
}

// POST /api/payments/subscribe — T2 builds
// Returns: { subscription_id: string, short_url: string }

// GET /api/user/status — T2 builds
// Returns: { pro_status: boolean, pro_expires_at: string | null, messages_today: number }
```

---

## Pre-Build Phase (Free Time — Before Clock Starts)

> [!IMPORTANT]
> Everything here is done BEFORE the 12-hour clock. This is your biggest competitive advantage.

### All 3 Devs — Account Setup (Parallel)

- [ ] **Supabase** — Create project, note URL + anon key + service role key. **Copy the pooler connection string (port 6543) — use this everywhere.**
- [ ] **Railway** — Create account at railway.app, create new project, connect GitHub repo. Upgrade to Hobby plan ($5). Confirm deployment works with a hello-world Next.js push.
- [ ] **Razorpay** — Create account, complete KYC for **live mode**, create ₹99/month subscription plan, note key_id + key_secret + plan_id + webhook_secret
- [ ] **Anthropic** — Get API key (Claude Sonnet + Haiku + Vision access)
- [ ] **Supabase GitHub OAuth** — Dashboard → Auth → Providers → GitHub. Register OAuth App at github.com/settings/developers. Set callback URL to: `https://<your-railway-domain>.up.railway.app/auth/callback`
- [ ] **Upstash** — Create Redis database + QStash account, note credentials. **Test both connections in a throwaway script before Hour 0.**
- [ ] **Domain (optional)** — Buy `deadlineos.com`, add custom domain in Railway dashboard → Settings → Networking → Custom Domain. Railway auto-provisions SSL.

### Railway Setup (T3 does this in pre-build)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link repo
railway login
railway init          # in your project root — select existing project
railway link          # links local repo to Railway project

# Set all env vars via CLI (faster than dashboard UI)
railway variables set NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
railway variables set SUPABASE_SERVICE_ROLE_KEY=xxx
railway variables set SUPABASE_DB_URL=postgresql://postgres:xxx@xxx.pooler.supabase.com:6543/postgres
railway variables set ANTHROPIC_API_KEY=xxx
railway variables set RAZORPAY_KEY_ID=xxx
railway variables set RAZORPAY_KEY_SECRET=xxx
railway variables set RAZORPAY_WEBHOOK_SECRET=xxx
railway variables set UPSTASH_REDIS_REST_URL=xxx
railway variables set UPSTASH_REDIS_REST_TOKEN=xxx
railway variables set UPSTASH_QSTASH_URL=xxx
railway variables set UPSTASH_QSTASH_TOKEN=xxx
railway variables set NEXTAUTH_SECRET=xxx   # run: openssl rand -base64 32

# Verify env vars are set
railway variables

# Test deploy
railway up
```

Railway auto-detects Next.js — no Dockerfile, no config file needed. It runs `npm run build` then `npm start`. The only required addition to `package.json`:

```json
"scripts": {
  "start": "next start -p $PORT"
}
```

Railway injects `$PORT` automatically. If you hardcode `3000`, health checks fail.

Auto-deploy on every push to `main`:
- Railway dashboard → your service → Settings → Source → enable "Auto Deploy" on branch `main`
- Every `git push origin main` triggers a rebuild. Takes ~2–3 minutes.

### T1 — Frontend Prep

- [ ] `npx create-next-app@14 deadlineos --app --ts --tailwind --eslint --src-dir`
- [ ] Install deps: `@supabase/supabase-js @supabase/ssr`
- [ ] Update `package.json` start script to use `$PORT`
- [ ] Set up folder structure:
  ```
  src/
  ├── app/
  │   ├── (auth)/login/page.tsx
  │   ├── (dashboard)/feed/page.tsx
  │   ├── (dashboard)/assistant/page.tsx
  │   ├── u/[username]/page.tsx
  │   ├── api/auth/callback/route.ts
  │   ├── api/feed/route.ts
  │   ├── api/assistant/route.ts
  │   ├── api/ingest/vision/route.ts
  │   ├── api/ingest/manual/route.ts
  │   ├── api/sync/github/route.ts
  │   ├── api/profile/[username]/route.ts
  │   ├── api/payments/subscribe/route.ts
  │   ├── api/user/status/route.ts
  │   ├── api/webhooks/razorpay/route.ts
  │   └── api/webhooks/github/route.ts
  ├── components/
  ├── lib/
  │   ├── supabase/
  │   │   ├── client.ts
  │   │   ├── server.ts
  │   │   └── middleware.ts
  │   ├── redis.ts
  │   ├── razorpay.ts
  │   ├── claude.ts
  │   └── scoring.ts        # shared formula — single source of truth
  └── types/
  ```
- [ ] Create `.env.local` from the same keys set in Railway variables
- [ ] Push to GitHub — Railway auto-deploys

### T2 — Backend Prep

- [ ] Write and run full Supabase SQL migration (schema below)
- [ ] Enable RLS on all tables (policies below)
- [ ] Write and unit-test `scoring.ts` locally

```ts
// lib/scoring.ts — single source of truth, used by both API and frontend
export function computePriorityScore(task: {
  type: 'exam' | 'assignment' | 'job' | 'github' | 'manual',
  due_at: string | null,
  weightage: number | null,
}): number {
  const BASE_WEIGHTS = { exam: 100, job: 80, assignment: 70, manual: 50, github: 40 };
  const base = BASE_WEIGHTS[task.type] ?? 50;
  if (!task.due_at) return base;
  const hoursRemaining = (new Date(task.due_at).getTime() - Date.now()) / 3_600_000;
  if (hoursRemaining < 0) return 0;
  const urgencyDecay = Math.exp(-hoursRemaining / 48);
  const consequence = task.weightage ? task.weightage * 0.5 : 0;
  return base * urgencyDecay + consequence;
}
```

### T3 — Infra Prep

- [ ] Complete Railway setup (above) — **do this first**
- [ ] Set up Razorpay subscription plan, configure webhook URL to Railway domain:
  `https://<your-app>.up.railway.app/api/webhooks/razorpay`
- [ ] Subscribe to Razorpay events: `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `subscription.completed`
- [ ] Test webhook in Razorpay test mode against Railway preview URL
- [ ] Write and test Redis + QStash helpers during pre-build:

```ts
// lib/redis.ts
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

export const redis = Redis.fromEnv();

export const assistantRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
});

export const visionRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 d'),
});

// Wrap every Redis call — Redis failure must never crash the product
export async function withFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); }
  catch { return fallback; }
}
```

### Database Schema

```sql
-- USERS
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  github_username TEXT UNIQUE,
  college TEXT,
  semester INT,
  subjects TEXT[],
  pro_status BOOLEAN DEFAULT false,
  pro_expires_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TASKS (no priority_score column — computed at query time)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('exam','assignment','job','github','manual')),
  title TEXT NOT NULL,
  subject TEXT,
  due_at TIMESTAMPTZ,
  weightage INT,
  source TEXT CHECK (source IN ('timetable','manual','vision','github')),
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- GITHUB CACHE
CREATE TABLE github_cache (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  repos JSONB DEFAULT '[]',
  languages JSONB DEFAULT '{}',
  last_commit_at TIMESTAMPTZ,
  streak_days INT DEFAULT 0,
  health_score FLOAT DEFAULT 0,
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- ASSISTANT MESSAGES
CREATE TABLE assistant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  razorpay_subscription_id TEXT UNIQUE,
  status TEXT DEFAULT 'created',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES
CREATE INDEX idx_tasks_user_due ON tasks(user_id, due_at);
CREATE INDEX idx_tasks_user_completed ON tasks(user_id, completed);
CREATE INDEX idx_messages_user ON assistant_messages(user_id, created_at);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_last_active ON users(last_active_at);
```

### Row Level Security

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users: own row" ON users USING (auth.uid() = id);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks: own rows" ON tasks USING (auth.uid() = user_id);

ALTER TABLE github_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "github_cache: own row" ON github_cache USING (auth.uid() = user_id);

ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages: own rows" ON assistant_messages USING (auth.uid() = user_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions: own rows" ON subscriptions USING (auth.uid() = user_id);
```

> [!CAUTION]
> `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS entirely. Only use it in webhook handlers (`/api/webhooks/*`) where there's no user session. All other routes use the anon key + session.

### Security Helpers (T3 writes in pre-build)

```ts
import crypto from 'crypto';

// Razorpay webhook HMAC
export function verifyRazorpaySignature(body: string, sig: string): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

// GitHub webhook HMAC
export function verifyGitHubSignature(body: string, sig: string): boolean {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET!)
    .update(body).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

// Server-side Pro gate — never trust client
export async function requirePro(userId: string, supabase: SupabaseClient) {
  const { data } = await supabase
    .from('users').select('pro_status, pro_expires_at')
    .eq('id', userId).single();
  if (!data?.pro_status) throw new Error('Pro required');
  if (data.pro_expires_at && new Date(data.pro_expires_at) < new Date()) throw new Error('Pro expired');
}

// Sanitize user-controlled strings before LLM context injection
export const sanitize = (s: string) => s.replace(/[<>{}[\]]/g, '').slice(0, 200);
```

### Pre-Build Checkpoint ✅

- [ ] `npm run dev` works locally for all 3 devs
- [ ] Supabase tables created, RLS enabled on all 5 tables
- [ ] Supabase Auth → GitHub OAuth tested end-to-end locally
- [ ] `.env.local` matches Railway variables exactly
- [ ] Railway: hello-world Next.js deploys and is live on `.up.railway.app` URL
- [ ] Railway: auto-deploy on push to `main` confirmed working
- [ ] Redis + QStash connections tested
- [ ] Razorpay webhook URL pointing to Railway domain
- [ ] `scoring.ts` tested with sample data
- [ ] `package.json` start script uses `$PORT`

---

## Security Checklist (Mapped to Build Timeline)

| Item | Owner | When |
|------|-------|------|
| Razorpay webhook HMAC signature | T3 | Cycle 1, Hour 0–1 |
| GitHub webhook `X-Hub-Signature-256` | T3 | Cycle 2, Hour 4 |
| Supabase RLS on all tables | T2 | Pre-Build |
| Server-side `requirePro()` | T3 | Cycle 1, Hour 1:30 |
| Public profile field whitelist | T2 | Cycle 3, Hour 8 |
| Rate limiting: assistant (10 req/min) | T3 | Cycle 3, Hour 6 |
| Rate limiting: vision (3/day free, 10/day pro) | T3 | Cycle 2, Hour 5 |
| Vision: MIME type + 5MB size check | T2 | Cycle 2, Hour 3 |
| Prompt injection sanitization | T2 | Cycle 3, Hour 7 |
| Secrets in Railway env vars only | T3 | Pre-Build |
| Supabase pooler URL (port 6543) everywhere | T3 | Pre-Build |

---

## OODA Cycle 1 — Hours 0–3: Auth + Payments + Shell

### 🔭 Observe
Scaffolding and accounts are ready. No working product. Revenue is #1 — if payments don't work, nothing else matters.

### 🧭 Orient
- Supabase Auth GitHub OAuth must work first
- Razorpay live payments verified end-to-end this cycle
- T3 is NOT setting up Railway or Redis during this cycle — that was done in pre-build

### 🎯 Decide
**A user can sign up via GitHub → see Pro upgrade CTA → pay ₹99 → Pro status stored → UI shows Pro badge.**

### 🚀 Act

#### T1 — Frontend (Hours 0–3)

| Time | Task |
|------|------|
| 0:00–0:30 | Login page — GitHub OAuth via Supabase Auth, branding, dark theme |
| 0:30–1:00 | App shell — sidebar nav (Feed, Assistant, Profile), top bar with user avatar |
| 1:00–1:30 | Dashboard layout — feed page skeleton with "Your feed is empty" state |
| 1:30–2:00 | Pro upgrade modal — Free vs Pro ₹99/mo pricing card, Razorpay checkout button |
| 2:00–2:30 | **Payment pending state** — poll `/api/user/status` every 2s for up to 15s after checkout redirect. Show "Activating Pro…" until `pro_status = true`. |
| 2:30–3:00 | Onboarding wizard shell — 5-step flow (GitHub ✓, Upload, Assignments, College, Done) |

#### T2 — Backend+AI (Hours 0–3)

| Time | Task |
|------|------|
| 0:00–0:45 | Supabase Auth callback — on first login: create user row, set `username` from `github_username`, fetch GitHub basics |
| 0:45–1:30 | Supabase client helpers (server + browser via `@supabase/ssr`) |
| 1:30–2:15 | `POST /api/payments/subscribe` — create Razorpay subscription, return `{ subscription_id, short_url }` |
| 2:15–3:00 | `GET /api/user/status` — return `{ pro_status, pro_expires_at, messages_today }` |

#### T3 — Infra+Payments (Hours 0–3)

| Time | Task |
|------|------|
| 0:00–1:00 | `POST /api/webhooks/razorpay` — HMAC verify → parse event → upsert subscription → set `pro_status = true` on users (use `service_role` key — no session in webhooks) |
| 1:00–1:30 | Idempotency: store processed webhook IDs in Redis with 24hr TTL, reject duplicates |
| 1:30–2:00 | `requirePro()` middleware — import and verify `scoring.ts` compiles |
| 2:00–2:30 | Next.js session middleware (`middleware.ts` using Supabase SSR helpers) |
| 2:30–3:00 | Push to `main` → verify Railway auto-deploys successfully. Confirm live URL works end-to-end. |

### Checkpoint 1 — Hour 3 (15 min sync)

> [!IMPORTANT]
> **Gate:** Can a real user sign up with GitHub → see Pro CTA → pay ₹99 → UI polls → Pro badge appears?

- [ ] Supabase Auth GitHub OAuth works on Railway URL
- [ ] User row created with `username` + `last_active_at` on first login
- [ ] Razorpay checkout opens with ₹99 plan
- [ ] Webhook fires → `pro_status = true` in DB
- [ ] UI shows "Activating Pro…" → Pro badge via polling
- [ ] Railway dashboard shows no errors, deployment is green

**If payments are broken:** T3 stays on payments. T1+T2 proceed to Cycle 2.

---

## OODA Cycle 2 — Hours 3–6: Core Product — Feed + Ingestion

### 🔭 Observe
Auth and payments work. But there's nothing worth paying FOR yet.

### 🧭 Orient
- Priority Feed is the core product
- Next Move Card is the "wow" moment — it's just `feed[0]` with a reason string
- All scoring goes through shared `scoring.ts` — no divergence

### 🎯 Decide
**Ingest → score → rank → display.**

### 🚀 Act

#### T1 — Frontend (Hours 3–6)

| Time | Task |
|------|------|
| 3:00–3:30 | Next Move Card — pinned at top, reads `feed[0]` + `reason` string |
| 3:30–4:00 | Feed card components — exam, assignment, github, manual cards |
| 4:00–4:30 | Urgency color coding (red <48h, amber <7d, green >7d) derived from `due_at` client-side |
| 4:30–5:00 | Timetable upload UI — drag-and-drop + camera capture, progress indicator |
| 5:00–5:30 | Manual input bar — always-visible plain English text field |
| 5:30–6:00 | Onboarding Steps 2+3 — timetable upload + quick-add assignments |

#### T2 — Backend+AI (Hours 3–6)

| Time | Task |
|------|------|
| 3:00–3:45 | `POST /api/ingest/vision` — auth check, MIME + size validation, Claude Vision, insert task rows |
| 3:45–4:15 | `POST /api/ingest/manual` — plain text → Claude Haiku → structured task → insert |
| 4:15–5:00 | `GET /api/feed` — query incomplete tasks, `computePriorityScore()` at query time, sort, attach Next Move |
| 5:00–5:30 | Next Move reason string: `if type=exam → "Exam coming up"`, `if type=job → "Application deadline"` etc. |
| 5:30–6:00 | `PATCH /api/tasks/:id/complete` — mark done, remove from feed |

```ts
// GET /api/feed
const { data: tasks } = await supabase
  .from('tasks').select('*')
  .eq('user_id', userId).eq('completed', false);

const scored = tasks
  .map(t => ({ ...t, score: computePriorityScore(t) }))
  .filter(t => t.score > 0)
  .sort((a, b) => b.score - a.score);

return { feed: scored, nextMove: scored[0]
  ? { task: scored[0], reason: getNextMoveReason(scored[0]) }
  : null };
```

#### T3 — Infra (Hours 3–6)

| Time | Task |
|------|------|
| 3:00–4:00 | `POST /api/sync/github` — GitHub GraphQL, repos/languages/commits/streak, upsert `github_cache`, update `last_active_at` |
| 4:00–4:30 | `POST /api/webhooks/github` — verify `X-Hub-Signature-256`, trigger cache refresh via QStash |
| 4:30–5:00 | Redis caching — GitHub API response (5min TTL), feed response (1min TTL) |
| 5:00–5:30 | QStash scheduled job — sync GitHub every 30min for `last_active_at > now() - interval '24 hours'` |
| 5:30–6:00 | Redis lock — one GitHub sync per user per 5min (`SET user:sync:{id} 1 EX 300 NX`) |

### Checkpoint 2 — Hour 6 (15 min sync)

- [ ] Timetable photo → Claude Vision → task rows in DB
- [ ] Manual input → Haiku → task row in DB
- [ ] Feed shows ranked cards with urgency colors
- [ ] Next Move card shows `feed[0]` with reason string
- [ ] GitHub sync populates `github_cache`
- [ ] "Mark Done" removes card from feed

**If vision is unreliable:** Fall back to manual input. Fix in Cycle 4.

---

## OODA Cycle 3 — Hours 6–9: AI Assistant + Profile + Conversion Funnel

### 🔭 Observe
Product works end-to-end. Now build what makes users STAY (assistant) and SPREAD (profile).

### 🎯 Decide
Context-aware assistant (Pro-gated) + public shareable profile + tight free→Pro funnel.

### 🚀 Act

#### T1 — Frontend (Hours 6–9)

| Time | Task |
|------|------|
| 6:00–6:45 | Assistant chat UI — bubbles, streaming display, input bar |
| 6:45–7:15 | Pro gate UX — 5-message counter for free users, upgrade CTA on limit |
| 7:15–7:45 | Message history — last 10 messages, auto-scroll |
| 7:45–8:30 | Shareable profile `/u/[username]` — GitHub graph, repos, languages, availability badge |
| 8:30–9:00 | Onboarding Steps 4+5 — college/semester/prefs form, "Feed is live!" completion |

#### T2 — Backend+AI (Hours 6–9)

| Time | Task |
|------|------|
| 6:00–7:00 | `POST /api/assistant` — sanitized context injection, stream Claude Sonnet |
| 7:00–7:30 | Pro gate: count today's messages, reject free user > 5. `requirePro()` for unlimited. |
| 7:30–8:00 | Message persistence — save to `assistant_messages`. Load with `LIMIT 10 ORDER BY created_at DESC`. |
| 8:00–8:30 | `GET /api/profile/[username]` — **whitelist only**: `name, avatar_url, github_username, college, semester`. Never expose `email`, `pro_status`, `pro_expires_at`. |
| 8:30–9:00 | LLM project bullet generation — Haiku writes "Built X using Y" per top repo |

```ts
// Context injection — sanitize all user-controlled strings
const context = `
Today: ${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
Semester: ${sanitize(user.semester?.toString())}
College: ${sanitize(user.college)}

Top priorities:
${feed.slice(0,5).map(t =>
  `- [${t.type.toUpperCase()}] ${sanitize(t.title)} — due ${t.due_at
    ? new Date(t.due_at).toLocaleDateString('en-IN') : 'no deadline'}`
).join('\n')}

GitHub health: ${github?.health_score ?? 'not connected'}
Last commit: ${github?.last_commit_at ?? 'unknown'}
Top languages: ${Object.keys(github?.languages ?? {}).slice(0,3).join(', ')}
`;
```

#### T3 — Infra (Hours 6–9)

| Time | Task |
|------|------|
| 6:00–6:30 | Rate limiting on `/api/assistant` (10 req/min) and `/api/ingest/vision` (3/day free) |
| 6:30–7:00 | Free message counter with **midnight IST TTL** (not rolling 24hr) |
| 7:00–7:30 | Profile page Redis cache (10min TTL) |
| 7:30–8:15 | Subscription cancel/reactivate — handle `subscription.cancelled` → `pro_status = false` |
| 8:15–9:00 | QStash: nightly LLM profile regen for `last_active_at > now() - interval '24 hours'` |

```ts
// Midnight IST TTL
function midnightISTttl(): number {
  const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const midnight = new Date(ist);
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight.getTime() - ist.getTime()) / 1000);
}
await redis.set(`msg_count:${userId}`, count, { ex: midnightISTttl() });
```

### Checkpoint 3 — Hour 9 (15 min sync)

- [ ] Assistant responds with context-aware answers, streaming works
- [ ] Free user blocked after 5 messages — counter resets at midnight IST
- [ ] Pro gate → Razorpay → Pro → unlimited messages
- [ ] `/u/username` renders publicly — no private fields in response
- [ ] Profile shows GitHub stats + project bullets

---

## OODA Cycle 4 — Hours 9–12: Polish + Deploy + Smoke Test

### 🔭 Observe
All features work. Judges use it on phones. Users hit edge cases. Railway is already live — this cycle is polish + verification only.

### 🎯 Decide
Full polish pass + exhaustive smoke test. No new features.

### 🚀 Act

#### T1 — Frontend (Hours 9–12)

| Time | Task |
|------|------|
| 9:00–9:45 | Mobile responsive — test at 375px, 390px, 414px |
| 9:45–10:15 | Dark mode — CSS variables, system preference, toggle in nav |
| 10:15–10:45 | Loading states — skeleton cards, assistant typing indicator, upload progress |
| 10:45–11:15 | Empty states — "No deadlines yet", "Connect GitHub", "Upgrade to Pro" hints |
| 11:15–11:45 | Micro-animations — card entrance, Next Move pulse, message slide-in |
| 11:45–12:00 | Final review — typography, spacing, favicon, meta tags, OG image for sharing |

#### T2 — Backend+AI (Hours 9–12)

| Time | Task |
|------|------|
| 9:00–9:30 | Error handling pass — all routes return proper codes. All Redis calls use `withFallback()`. |
| 9:30–10:00 | Edge cases — duplicate task prevention, expired exam auto-hide (`due_at < now()`), empty feed |
| 10:00–10:30 | Claude prompt tuning — test with real exam schedules, refine context format |
| 10:30–11:00 | Vision reliability — test with 5+ real timetable photos (VIT, Anna University, SRM, REC formats) |
| 11:00–11:30 | API response check — all routes < 2s. Add `export const runtime = 'nodejs'` explicitly to all Supabase routes. |
| 11:30–12:00 | Seed 2–3 demo accounts with realistic data for judging |

#### T3 — Infra+Deploy (Hours 9–12)

| Time | Task |
|------|------|
| 9:00–9:30 | **Railway final check** — verify all env vars in Railway dashboard match `.env.local`. Check deployment logs for any warnings. |
| 9:30–10:00 | **Custom domain** (if applicable) — Railway dashboard → Networking → Add domain → update DNS CNAME. Railway auto-provisions SSL (takes 5–10 min). |
| 10:00–10:30 | **Razorpay LIVE verification** — make a real ₹99 payment on the Railway URL. Verify webhook fires. Verify `pro_status = true`. Verify UI polling catches it. |
| 10:30–11:00 | **Supabase production check** — RLS verified on all 5 tables, pooler URL confirmed in env vars |
| 11:00–12:00 | Full E2E smoke test (all 3 devs) |

### Final Smoke Test — Hour 11–12

> [!CAUTION]
> Every item must pass. All hands fix failures immediately.

- [ ] Fresh GitHub signup on Railway production URL → user row created with `username`
- [ ] Onboarding completes — timetable upload + assignments + college info
- [ ] Feed shows ranked cards, urgency colors correct
- [ ] Next Move card shows `feed[0]` with reason string
- [ ] Manual input → task appears in feed with correct urgency
- [ ] Timetable photo parses correctly
- [ ] GitHub sync populates repos, languages, health score
- [ ] Free assistant: 5 messages work with context-aware responses
- [ ] Message 6 → Pro gate paywall
- [ ] **Real ₹99 Razorpay payment succeeds on production**
- [ ] **UI shows "Activating Pro…" → polls → Pro badge appears**
- [ ] Unlimited assistant messages work for Pro user
- [ ] `/u/username` renders — no `email` / `pro_status` in response
- [ ] Rate limit: 11th assistant request in 1 min returns 429
- [ ] Mobile test on physical phone — all pages usable
- [ ] Railway dashboard: no error logs, deployment green
- [ ] No console errors, no 500s

---

## Railway Deployment Reference

```bash
# One-time setup (done in pre-build)
npm install -g @railway/cli
railway login
railway init
railway link

# Set env vars
railway variables set KEY=value

# Manual deploy (if auto-deploy is off)
railway up

# Check logs
railway logs

# Open live app
railway open

# Check service status
railway status
```

**Railway dashboard URLs to bookmark:**
- Deployments: `railway.app/project/<id>/deployments`
- Logs: `railway.app/project/<id>/logs`
- Variables: `railway.app/project/<id>/variables`
- Networking: `railway.app/project/<id>/settings/networking` ← custom domain here

**If a deploy breaks during the build:**
```bash
# Roll back to previous deployment
# Railway dashboard → Deployments → click previous deploy → Redeploy
```
This is instant — previous container is still cached.

---

## Post-Launch Roadmap

| Timeline | Feature | Notes |
|----------|---------|-------|
| **Week 2** | **Internshala job feed via Apify** | See integration spec below — replaces Adzuna/Jooble entirely |
| Week 2 | Job tracker Kanban — Saved → Applied → Interview → Offer | Uses existing `tasks` table, new `stage` column |
| Week 3 | Browser extension — college portal timetable scraper | Fallback for users who don't want to photo-upload |
| Week 3 | Email forwarding parser — Internshala / college notices | Parse structured data from forwarded emails |
| Month 2 | Calendar view + Google Calendar export | Export `tasks` table as `.ics` |
| Month 2 | Resume PDF snapshot — one-click download | LLM-generated from GitHub + tasks data |
| Month 3 | College ambassador program — referral unlock | Referral code → unlock Pro features |
| Month 3 | Flutter mobile app | Port existing API layer, no backend changes |

### Week 2 — Internshala Integration (Apify)

Internshala is the right job source for this audience — stipend amounts, duration, and "apply by" deadlines are all structured and directly usable by the feed. No public API exists, so Apify is the integration path.

**Why Internshala over Adzuna/Jooble:**
- Adzuna has thin India internship coverage and no stipend data
- Jooble is a generic aggregator — noise-heavy for engineering students
- Internshala is where this exact audience (2nd/3rd year B.Tech) actually finds internships
- Structured data: stipend, duration, WFH flag, apply-by date — all feed directly into priority scoring

**Architecture:**

```
QStash daily job (per active user)
  → Apify Internshala actor
      input: { role, location } from users.subjects + onboarding prefs
  → parse results
  → Redis cache 6hr TTL (avoid hammering Apify quota)
  → upsert into tasks table as type='job'
  → appears in priority feed with urgency decay on apply-by date
```

**Apify integration:**

```ts
// lib/apify.ts
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

export async function fetchInternshalaJobs(role: string, location: string) {
  // Check Redis cache first
  const cacheKey = `internshala:${role}:${location}`;
  const cached = await withFallback(() => redis.get(cacheKey), null);
  if (cached) return cached;

  const run = await client.actor('apify/internshala-scraper').call({
    search: role,
    location,
    maxItems: 20,
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  // Cache 6 hours — Apify runs are async (30–60s), never call on-demand
  await withFallback(() => redis.set(cacheKey, JSON.stringify(items), { ex: 21600 }), null);

  return items;
}

// Map Internshala result → tasks row
export function mapToTask(job: InternshalaJob, userId: string) {
  return {
    user_id: userId,
    type: 'job' as const,
    title: `${job.role} — ${job.company}`,
    subject: null,
    due_at: job.applyBy ?? null,   // feeds directly into urgency decay
    weightage: null,
    source: 'internshala' as const,  // add 'internshala' to source CHECK constraint
    completed: false,
  };
}
```

**Schema update needed for Week 2:**

```sql
-- Add internshala as a valid source
ALTER TABLE tasks DROP CONSTRAINT tasks_source_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_source_check
  CHECK (source IN ('timetable','manual','vision','github','internshala'));

-- Add stage column for Kanban tracker
ALTER TABLE tasks ADD COLUMN stage TEXT
  CHECK (stage IN ('saved','applied','interview','offer'))
  DEFAULT 'saved';
```

**QStash job (runs daily per active user):**

```ts
// Triggered by QStash — not on user request
export async function POST(req: Request) {
  const { userId } = await req.json();

  const { data: user } = await supabase
    .from('users').select('college, semester, subjects').eq('id', userId).single();

  const jobs = await fetchInternshalaJobs(
    user.subjects?.[0] ?? 'software developer',
    'India'  // broad — Internshala handles filtering
  );

  // Upsert — don't duplicate jobs already in feed
  const tasks = jobs.map(j => mapToTask(j, userId));
  await supabase.from('tasks').upsert(tasks, { onConflict: 'user_id,title' });
}
```

**Cost:** Apify pay-per-result model — ~$5–10/month at launch scale (50 active users, daily syncs). Add `APIFY_TOKEN` to Railway env vars in Week 2.

---

## Risk Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Razorpay KYC not approved | **CRITICAL** | Start KYC days before. Backup: collect payment via UPI link, manually set `pro_status = true` in Supabase dashboard |
| Railway deploy fails mid-build | High | Roll back via dashboard in 30 seconds. Keep last working deploy as fallback. |
| Claude Vision fails on messy timetables | Medium | Fall back to manual input. Pre-parse 3–4 test timetables as backup demo data. |
| Redis connection failure | Medium | All calls wrapped in `withFallback()` — product degrades gracefully, never crashes |
| GitHub API rate limit | Low | 5min Redis lock per user + 5min TTL cache. QStash scoped to `last_active_at > 24hrs`. |
| Supabase connection exhaustion | Medium | Pooler URL (port 6543) from Hour 0 — this is the fix, not a later optimization. |
| Pro badge doesn't appear after payment | High | Polling `/api/user/status` with 15s timeout + "Activating Pro…" state. Tested in smoke test. |
| Team member blocked | Medium | APIs prepped and tested in pre-build. Code snippets written before Hour 0. |

---

## Post-Build: 48-Hour GTM

| Hour | Action | Owner |
|------|--------|-------|
| 12–14 | Seed 3–5 friends, collect feedback, fix critical bugs | All |
| 14–16 | Record 60-sec Instagram Reel — Next Move card + payment flow | T1 |
| 16–18 | Write WhatsApp blast — hook on exam season anxiety | T2 |
| 18–20 | Sleep | All |
| 20–24 | Fix bugs from seed users | T3 |
| 24 | Blast college WhatsApp groups | All |
| 26 | Post Reel + shareable profile link on Instagram | T1 |
| 28 | DM 20 people — "exam next week? try this" | All |
| 30–36 | Convert free users hitting Pro gate — talk to them directly | All |
| 36–48 | Screenshot revenue dashboard for jury | T3 |

---

*DeadlineOS — Implementation Plan v4 (Final) · April 2026 · Confidential*
*Deployment: Railway (persistent container, auto-deploy on push, $5/month Hobby plan)*
*Changes from v3: Post-launch roadmap added. Adzuna + Jooble replaced with Internshala via Apify — full integration spec, schema migration, QStash job, and caching strategy included.*
