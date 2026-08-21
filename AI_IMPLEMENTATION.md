# AI Implementation — PrioryxAI

Track all AI changes in this file. One section per phase.

---

## Phase 1 — Priority Engine → GPT-4o Reasoning Agent ✅

**Branch**: `ai/phase-1-reasoning-engine`  
**Files added**:
- `src/lib/priority/burnout-detector.ts` — deterministic workload signal collector
- `src/lib/priority/llm-planner.ts` — GPT-4o plan generator with Redis daily cache

**Files modified**:
- `src/app/api/priority/route.ts` — switched from `generatePriorityPlan` to `generateLLMPlan`

**New response fields** (added to `PriorityPlan`):
- `burnoutRisk: 'low' | 'medium' | 'high'` — emitted by the LLM
- `burnoutNote: string | null` — shown when risk is medium/high
- `todaysFocus: string` — single headline sentence
- `fromCache: boolean` — true if served from Redis (no LLM cost)
- `fromFallback: boolean` — true if deterministic engine.ts was used

**Cache**: Redis key `priority:plan:v1:{userId}:{YYYY-MM-DD}`, TTL = seconds until midnight IST

**Fallback**: `generatePriorityPlan()` from `engine.ts` (untouched) runs if LLM fails or returns invalid JSON.

**Cost**: ~1,200 input + 600 output tokens per user per day. Cached for rest of day.

---

## Phase 2 — Agentic Orchestrator ✅

**Branch**: `ai/phase-2-agentic-orchestrator`  
**Files added**:
- `src/lib/mcp/tool-adapter.ts` — converts registry tools to OpenAI function-calling format
- `src/lib/mcp/agentic-orchestrator.ts` — real tool-call loop (max 10 iterations)

**Files modified**:
- `src/lib/mcp/types.ts` — added `'agent_reasoning'` to `SSEEvent.event` union
- `src/lib/mcp/agents/ai-agent.ts` — deprecated `runMultiAgentOrchestration` (stub kept for registry compat)

**Usage**:
```typescript
import { runAgenticOrchestration } from '@/lib/mcp/agentic-orchestrator';
const result = await runAgenticOrchestration(userId, 'Analyze my career profile', emit);
```

**SSE events emitted**: `progress`, `agent_reasoning`, `tool_start`, `tool_result`, `tool_error`

---

## Phase 3 — Burnout Detector ✅

Folded into Phase 1 LLM call (saves one round-trip).

**File**: `src/lib/priority/burnout-detector.ts`  
Reads `tasks` table: completion velocity this week vs prior week, pending load, exam proximity.  
Returns `WorkloadState` struct fed as JSON context to GPT-4o in `llm-planner.ts`.

---

## Phase 4 — Mock Interview Wired ✅

**Branch**: `ai/phase-4-interview`  
**Files added**:
- `src/app/api/career/interview/route.ts` — GET (sessions) + POST (start/evaluate)
- `src/app/career/interview/page.tsx` — full UI (setup → question → answer → result)

**Flow**:
1. `POST { action: "start", targetRole, round, topic }` → calls `ai.conductMockInterview` via registry
2. `POST { action: "evaluate", sessionId, answer }` → calls `ai.evaluateAnswerQuality` via registry
3. Sessions persisted to `interview_sessions` table

**DB Migration needed** (run manually):
```sql
CREATE TABLE IF NOT EXISTS interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  target_role text,
  round text,
  topic text,
  difficulty text,
  time_limit_minutes int,
  question text,
  expected_approach text,
  follow_ups jsonb DEFAULT '[]',
  hints jsonb DEFAULT '[]',
  transcript jsonb DEFAULT '[]',
  status text DEFAULT 'active', -- active | completed | abandoned
  score int,
  verdict text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX ON interview_sessions(user_id);
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their own sessions"
  ON interview_sessions FOR ALL
  USING (auth.uid() = user_id);
```

---

## Phase 5 — Long-term Memory + Peer Intelligence ✅

**Branch**: `ai/phase-5-memory-rag`  
**Files added**:
- `src/lib/memory/user-memory.ts` — extract facts (gpt-4o-mini), inject into prompts
- `src/lib/peer/cohort-intelligence.ts` — anonymized aggregate stats (min cohort = 20)

**Files modified**:
- `src/app/api/assistant/route.ts` — injects `getUserMemoryContext()` into system prompt; calls `extractAndUpsertMemory()` fire-and-forget after each session

**Privacy rules** (enforced in code):
- Minimum cohort size = 20 before any aggregate is returned
- No individual user data in cohort responses
- Users only read their own memory facts (row-level)

**DB Migrations needed** (run manually):
```sql
-- Long-term memory
CREATE TABLE IF NOT EXISTS user_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  fact_type text NOT NULL, -- 'goal' | 'preference' | 'struggle' | 'advice_given' | 'context'
  fact_text text NOT NULL,
  session_context text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX ON user_memory(user_id);
ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their own memory"
  ON user_memory FOR ALL
  USING (auth.uid() = user_id);

-- pgvector (for Phase 5 RAG — future)
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## Phase 6 — MCP Connector ✅

**Branch**: `ai/phase-6-mcp-connector`  
**Files added**:
- `src/app/api/mcp/token/route.ts` — GET (check) / POST (generate) / DELETE (revoke)

**Files modified**:
- `src/app/api/mcp/route.ts` — added bearer token auth path alongside existing session auth

**DB Migration needed** (run manually):
```sql
CREATE TABLE IF NOT EXISTS mcp_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  token_hash text NOT NULL,  -- MVP: plaintext; TODO: SHA-256 hash before storage
  revoked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON mcp_tokens(user_id);
CREATE INDEX ON mcp_tokens(token_hash);
ALTER TABLE mcp_tokens ENABLE ROW LEVEL SECURITY;
-- Token validation happens via service role (no user-facing RLS needed)
```

**Usage for external clients**:
```bash
# 1. Generate a token (requires session auth)
curl -X POST https://your-app.vercel.app/api/mcp/token \
  -H "Cookie: <your-session-cookie>"

# 2. Use the token externally
curl -X POST https://your-app.vercel.app/api/mcp \
  -H "Authorization: Bearer pryx_<token>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

---

## Phase 7 — Resume Autodraft ✅

**Branch**: `ai/phase-7-resume-autodraft`  
**Files added**:
- `src/app/api/career/resume/autodraft/route.ts` — reads DB → one GPT-4o call → returns structured draft

**Output schema**:
- `summary` — 3-line professional summary
- `skills` — categorised by language/framework/tool/concept
- `projects` — with action-verb ATS bullets (max 2 per project)
- `githubHighlights` — 2-3 bullets on GitHub activity
- `dsaSection` — 1-line LeetCode/competitive programming summary
- `improvementTips` — 3 concrete suggestions

---

## Phase 8 — GitHub Commit-Quality Agent ✅

**Branch**: `ai/phase-8-github-commit-agent`
**Files added**:
- `src/lib/mcp/agents/github-agent.ts` — Fetches commits via GitHub API and uses `gpt-4o` to analyze commit quality.
- `src/app/api/career/coding/github/analyze/route.ts` — POST route streaming SSE via `runAgenticOrchestration`.

**Files modified**:
- `src/lib/mcp/registry.ts` — Registered `githubAgent` with alias `github.analyze`.

**Output schema**:
- `github_analysis` table: Stores repo `total_score`, `grade`, `dimensions`, `strengths`, `weaknesses`, `career_relevance`.
- `github_priority_actions` table: Actionable items generated by the LLM (e.g., "Use Conventional Commits").

**Usage**:
```typescript
// Triggers the orchestrator for a specific repo
fetch('/api/career/coding/github/analyze', {
  method: 'POST',
  body: JSON.stringify({ repo_name: 'Pinn-FSI-Airfoil' })
})
```

---

## Privacy & Review Flags (User Attention Required)

> [!IMPORTANT]
> **Phase 5 — Peer Intelligence & Cohort Benchmarking Privacy Flag**:
> - The cohort aggregation engine (`src/lib/peer/cohort-intelligence.ts`) enforces strict privacy boundaries:
>   1. **Minimum Cohort Size**: Set to `20`. If fewer than 20 students share a cohort profile (same semester, stream, domain), all aggregate benchmarks are withheld and omitted.
>   2. **Zero Individual Data Leakage**: No student IDs, project names, or individual data points are ever exposed to peers. All metrics are mathematical aggregates (averages, distributions).
>   3. **Consent Recommendation**: While aggregation is strictly anonymized, we recommend adding an explicit opt-in/opt-out toggle in User Settings (`"Share anonymized stats to unlock peer benchmarking"`) before promoting this feature in production.

---

## DB Migrations Summary

Run all of these in your Supabase SQL Editor before deploying:

1. `interview_sessions` — Phase 4
2. `user_memory` + `vector` extension — Phase 5
3. `mcp_tokens` — Phase 6
4. `github_analysis` and `github_priority_actions` (now at `supabase/migrations/20260809_v12_github_analysis_peer.sql`) — Phase 8

---

## New Environment Variables

No new env vars added. All existing vars (`OPENAI_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) are reused.

---

## Cost Model

| Feature | Model | Frequency | Approx cost |
|---|---|---|---|
| Priority plan (Phase 1) | gpt-4o | Once/user/day (cached) | ~$0.004/user/day |
| Memory extraction (Phase 5) | gpt-4o-mini | Each assistant session | ~$0.0003/session |
| Interview question (Phase 4) | gpt-4o | Per interview start | ~$0.003/session |
| Interview evaluation (Phase 4) | gpt-4o | Per answer | ~$0.004/answer |
| Resume autodraft (Phase 7) | gpt-4o | On demand | ~$0.012/draft |
| Agentic orchestration (Phase 2) | gpt-4o | On demand | ~$0.005-0.05/run |
| GitHub Commit Analysis (Phase 8) | gpt-4o | On demand per repo | ~$0.01/repo |
