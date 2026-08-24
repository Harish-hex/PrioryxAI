# PrioryxAI

PrioryxAI is an AI-assisted student productivity and career intelligence platform. It brings academic tasks, exam schedules, coding-platform progress, GitHub portfolio signals, resume data, job opportunities, project ideas, and assistant conversations into one prioritized workspace.

The repository is web-first, with additional mobile clients:

- A production-oriented Next.js application in `src/`.
- An Expo React Native client in `PrioryxAI/`.
- Native Android and iOS reference clients in `PrioryxAI-Android/` and `PrioryxAI-iOS/`.
- Supabase migrations and schema references for the shared data layer.

The current product copy may still reference the earlier name `DeadlineOS` in some places. The repository and platform direction are organized under `PrioryxAI`.

## Product Summary

PrioryxAI is designed for students who need to decide what to work on next across many disconnected areas:

- Academic deadlines, assignments, exams, and weekly timetables.
- Personal tasks and daily planning.
- Resume quality, project portfolio strength, and job readiness.
- GitHub, LeetCode, HackerRank, and other coding-preparation signals.
- Internship and job-market opportunities.
- AI assistant conversations, memory, and contextual guidance.

The core product idea is to turn scattered student context into explainable next actions. Some features use large language models for extraction, reasoning, generation, and conversational assistance; critical scoring and ranking paths keep deterministic fallbacks so the application remains usable when AI or external integrations are unavailable.

## Current Capabilities

| Area | What it does | Main implementation |
| --- | --- | --- |
| Dashboard and feed | Shows next priority, setup nudges, task feed, stats, and career signals | `src/app/feed`, `src/app/api/feed`, `src/lib/scoring`, `src/lib/context` |
| Task management | Creates, completes, snoozes, stages, and prioritizes tasks | `src/app/api/tasks`, Supabase `tasks` data |
| AI assistant | Streams personalized responses and can use bounded tools | `src/app/api/assistant`, `src/lib/assistant/tools.ts`, `src/lib/memory` |
| Priority planning | Produces daily plans and workload recommendations | `src/app/api/priority`, `src/lib/priority`, `src/lib/planning` |
| Resume intelligence | Processes uploaded resumes, extracts content, generates analysis and drafts | `src/app/api/resume`, `src/lib/file-processor.ts`, `src/lib/pdf-parser.ts` |
| Academic schedule extraction | Converts exam and timetable uploads into structured records | `src/app/api/schedule`, `src/lib/schedule/extractor.ts` |
| Coding intelligence | Connects and analyzes LeetCode and HackerRank data | `src/app/api/leetcode`, `src/app/api/hackerrank`, `src/lib/leetcode`, `src/lib/hackerrank` |
| GitHub intelligence | Syncs repositories and produces portfolio improvement actions | `src/app/api/github`, `src/app/api/sync/github`, `src/lib/github-sync.ts` |
| Project Foundry | Generates and tracks portfolio project ideas | `src/app/api/foundry`, `src/lib/mcp/agents/foundry-agent.ts` |
| Job and opportunity matching | Fetches, normalizes, ranks, and tracks opportunities | `src/app/api/jobs`, `src/app/api/opportunities`, `src/lib/opportunities` |
| RAG foundation | Indexes and searches user-scoped context documents | `src/app/api/rag`, `src/lib/rag` |
| Payments | Razorpay subscription and webhook support | `src/app/api/payments`, `src/app/api/webhooks/razorpay` |

## Technical Stack

### Web Application

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion, Recharts, Lucide icons
- Supabase Auth, PostgreSQL, Row Level Security, and Storage
- OpenAI API for chat, extraction, generation, embeddings, and selected reasoning flows
- Upstash Redis and QStash for rate limits, caching, and background sync hooks
- GitHub GraphQL, Apify, Remotive, Arbeitnow, LeetCode-related APIs, HackerRank-related services, YouTube APIs, and Razorpay

### Mobile Clients

- `PrioryxAI/`: Expo Router, React Native, NativeWind, Zustand, Supabase client, Expo document/camera/notification APIs.
- `PrioryxAI-Android/`: Kotlin/Gradle native Android client structure.
- `PrioryxAI-iOS/`: SwiftUI client structure with package-based dependencies.
- Root Capacitor config is also present for wrapping the web build when needed.

## AI Architecture

PrioryxAI uses AI as an application intelligence layer, not as a standalone trained machine-learning system. The application combines deterministic scoring, structured user context, external data ingestion, and LLM calls where language understanding or generation adds value.

### AI Design Principles

- Keep stable decisions explainable with deterministic or hybrid scoring.
- Use LLMs for tasks that benefit from language understanding: assistant chat, resume parsing, SWOT analysis, document extraction, project generation, interview guidance, coding analysis, and natural-language explanations.
- Bound AI tools behind explicit server-side functions instead of allowing unrestricted application access.
- Cache expensive or repeatable AI outputs where practical.
- Fall back to deterministic or lexical behavior when AI, embeddings, Redis, or external APIs are unavailable.
- Treat retrieved RAG snippets as untrusted context inside assistant prompts.

### Main AI Components

| Component | Input | Processing | Output |
| --- | --- | --- | --- |
| Assistant | User message, profile, tasks, history, memory, retrieved snippets | OpenAI chat call with bounded tool loop and streamed response | Personalized answer, optional task actions, persisted conversation |
| Memory | Recent assistant exchanges | Lightweight extraction of durable user facts | User-scoped memory snippets for later prompts |
| Priority planner | Tasks, exams, coding signals, resume gaps, GitHub state, workload state | Hybrid deterministic collectors plus optional LLM planner | Daily plan, focus, reasons, burnout note, fallback status |
| Explainable priority | Task metadata, due dates, effort, impact, deadline risk | Deterministic score dimensions | Score, urgency, impact, effort, factors, summary |
| Readiness score | Resume, skills, GitHub, LeetCode, profile evidence | Deterministic score plus optional LLM explanation | Placement-readiness score and next actions |
| Resume intelligence | PDF, DOCX, image, or text resume | File extraction plus structured AI parsing/SWOT/generation | Normalized resume data, analysis, generated resume content |
| Schedule extraction | Uploaded exam or timetable documents | Document processing and prompt-based extraction | Structured exam/timetable entries and tasks |
| Coding analysis | LeetCode/HackerRank stats and profile data | Deterministic scoring plus LLM gap analysis | Weak topics, roadmap, recommendations |
| GitHub narrative | Repository metadata and activity cache | Deterministic scoring plus optional AI narrative | Portfolio strengths, weaknesses, and priority actions |
| Project Foundry | Resume, profile, coding, GitHub, and goal context | MCP-style agent/tool orchestration and LLM generation | Tailored portfolio project ideas and phase guidance |
| RAG | User-scoped context documents | Chunking, optional embeddings, vector or lexical retrieval | Bounded snippets for assistant and search APIs |

### RAG and Embeddings

The RAG layer is implemented in `src/lib/rag` and exposed through:

- `POST /api/rag/index`
- `POST /api/rag/search`

Documents can be indexed without embeddings. When `OPENAI_API_KEY`, the Supabase vector migration, and `pgvector` support are available, the system can store embeddings and use vector similarity through the database RPC. When semantic retrieval is unavailable, it falls back to lexical retrieval.

### Agent and Tool Boundaries

The assistant and MCP-oriented flows use server-side tool registries and adapters instead of arbitrary client-side execution. Tools cover constrained actions such as fetching readiness score, reading today's tasks, creating or snoozing tasks, checking LeetCode weak topics, and retrieving upcoming exams. Future autonomous behavior should add stronger approval flows, audit logs, retry policy, and per-tool authorization before expanding action scope.

## Repository Layout

```text
.
├── src/
│   ├── app/                  # Next.js pages, layouts, and API routes
│   ├── components/           # Web UI components
│   ├── data/                 # Static or seed-like app data
│   ├── lib/                  # AI, scoring, Supabase, integrations, context, RAG
│   └── scripts/              # Utility scripts
├── supabase/
│   └── migrations/           # Canonical database migrations
├── docs/db/                  # Reference schema dumps only
├── PrioryxAI/                # Expo React Native app
├── PrioryxAI-Android/        # Native Android app
├── PrioryxAI-iOS/            # Native iOS SwiftUI app
├── public/                   # Web static assets
├── assets/                   # Product/reference assets
├── tests/                    # Node test files
├── AI_IMPLEMENTATION.md      # AI implementation phase notes
├── MIGRATIONS.md             # Migration policy and chronology
├── PRIORYXAI_DESCRIPTION.md  # Detailed product and architecture description
└── README.md
```

## Getting Started

### Prerequisites

- Node.js compatible with Next.js 14 and the installed dependency set.
- npm.
- A Supabase project for authenticated and persistent workflows.
- OpenAI API access for AI features.
- Optional service credentials for GitHub, Apify, Upstash, Razorpay, and other integrations.

### Install Dependencies

```bash
npm install
```

### Configure Environment

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Fill the values required for the workflows you want to run:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
APIFY_TOKEN=
GITHUB_TOKEN=
GITHUB_WEBHOOK_SECRET=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_PLAN_ID=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_PAYMENT_LINK=
```

At minimum, most authenticated web flows need Supabase URL and anon key. Server-side database writes, storage processing, admin operations, and integration syncs may require the service-role key. AI features require `OPENAI_API_KEY`.

### Run Web App

```bash
npm run dev
```

The local web app runs at:

```text
http://localhost:3000
```

### Build Web App

```bash
npm run build
npm run start
```

`npm run start` expects `PORT` to be set because the script runs `next start -p $PORT`.

### Run Tests

```bash
npm test
```

The current test harness uses Node's built-in test runner and covers selected deterministic decision logic, including priority scoring, opportunity matching, skill-gap analysis, and lexical RAG fallback.

### Lint

```bash
npm run lint
```

The Next.js config currently ignores ESLint during production builds. Treat lint failures as engineering debt to address, not as proof that a build cannot run.

## Database and Migrations

Supabase migrations live only in:

```text
supabase/migrations/
```

Follow the convention documented in `MIGRATIONS.md`:

```text
YYYYMMDD_short_description.sql
```

Use guarded DDL such as `IF NOT EXISTS` and `IF EXISTS` where possible so migrations are idempotent. Do not put runnable migration files at the repository root. The SQL files in `docs/db/` are reference dumps and should not be pushed as migrations.

The schema includes data models for users, tasks, assistant messages, coding profiles, GitHub analysis/cache, LeetCode and HackerRank intelligence, schedules, resumes, project ideas, job applications, peer/collaboration data, readiness scores, opportunity matching, recommendation events, and RAG-ready context documents.

Security note: many tables use Row Level Security and user-owned access policies. Server routes that use `SUPABASE_SERVICE_ROLE_KEY` bypass RLS by design and must remain tightly scoped.

## Mobile Development

### Expo Client

```bash
cd PrioryxAI
npm install
npm run start
```

Available scripts:

```bash
npm run android
npm run ios
npm run web
```

The Expo app uses Supabase, Expo Router, NativeWind, Zustand, camera/document APIs, secure storage, notifications, and haptics.

### Native Android

The native Android project is in `PrioryxAI-Android/` and uses Gradle/Kotlin project structure.

### Native iOS

The native iOS project is in `PrioryxAI-iOS/` and contains SwiftUI features for onboarding, dashboard, assistant, learning, career, profile, and setup flows.

### Capacitor

The root project also has `capacitor.config.ts` with:

- App ID: `ai.prioryx.app`
- App name: `PrioryxAI`
- Web directory: `out`

Useful root scripts:

```bash
npm run mobile:copy
npm run mobile:sync
npm run mobile:android
```

## API Surface

Important API route groups:

- `/api/assistant`
- `/api/feed`
- `/api/priority`
- `/api/planning`
- `/api/tasks`
- `/api/user`
- `/api/profile`
- `/api/resume`
- `/api/schedule`
- `/api/github`
- `/api/leetcode`
- `/api/hackerrank`
- `/api/opportunities`
- `/api/jobs`
- `/api/rag`
- `/api/readiness-score`
- `/api/foundry`
- `/api/mcp`
- `/api/payments`
- `/api/webhooks`

Most routes perform their own authentication and authorization checks. API routes that call third-party services should validate credentials, handle rate limits, and return controlled fallback states where possible.

## External Integrations

| Integration | Purpose |
| --- | --- |
| Supabase | Auth, PostgreSQL, RLS, Storage, service-role operations |
| OpenAI | Assistant, structured extraction, generation, analysis, embeddings |
| Upstash Redis | Rate limiting, AI output caching, feed/planner cache |
| QStash | Signed background job trigger support |
| GitHub | Repository and contribution intelligence |
| Apify | Internshala and scraper-backed opportunity ingestion |
| Remotive / Arbeitnow | Job and opportunity data |
| LeetCode-related APIs | Coding profile, solved problems, weak-topic analysis |
| HackerRank-related services | Coding profile and badge intelligence |
| YouTube APIs | Learning-resource recommendations |
| Razorpay | Subscription/payment flows |

## Security and Privacy Notes

- Do not commit `.env.local`, Supabase service-role keys, OpenAI keys, tokens, webhook secrets, or payment secrets.
- Supabase anon keys are public client credentials, but production configuration should still be environment-managed.
- Service-role operations must stay server-side.
- Webhook routes should verify signatures or shared secrets before processing state changes.
- Assistant memory and RAG documents are user-scoped and should never be mixed across users.
- Cohort or peer intelligence should only expose aggregate data and should enforce minimum cohort sizes.
- AI output should be treated as advisory. Deterministic scoring and user-visible explanations should make important recommendations auditable.

## Development Workflow

1. Keep migrations in `supabase/migrations/`.
2. Add deterministic tests for scoring, matching, fallback logic, and other business-critical behavior.
3. Prefer typed context builders over ad hoc prompt construction.
4. Keep AI prompts bounded and explicit about allowed context.
5. Use fallbacks for OpenAI, Redis, Supabase RPC, and third-party API failures.
6. Avoid widening service-role access when a user-scoped Supabase client is sufficient.
7. Update `AI_IMPLEMENTATION.md` when adding or materially changing AI behavior.
8. Update this README when setup, environment variables, route groups, or architecture changes.

## Known Limitations

- PrioryxAI does not currently train its own ranking model.
- Opportunity matching and priority scoring are deterministic or hybrid, not learned from user outcomes.
- Semantic RAG requires the relevant Supabase migration, `pgvector`, and OpenAI embeddings configuration; otherwise lexical fallback is used.
- AI quality depends on profile completeness, integration freshness, uploaded document quality, and prompt context.
- Mobile clients may not have full feature parity with the web application.
- Some legacy code and product copy may still use the previous `DeadlineOS` naming.

## Useful Reference Documents

- `PRIORYXAI_DESCRIPTION.md`: full product and architecture description.
- `AI_IMPLEMENTATION.md`: AI feature implementation history and phase notes.
- `MIGRATIONS.md`: migration rules and migration chronology.
- `MCP_CONNECTOR_SETUP.md`: MCP connector setup notes.
- `docs/db/`: reference schema dumps.
