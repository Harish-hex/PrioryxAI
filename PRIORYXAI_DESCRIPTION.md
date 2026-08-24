# PrioryxAI

> **Documentation Status:** Based on the current repository implementation.
>
> **Scope:** Current platform capabilities, AI architecture, technical architecture, and future development roadmap.
>
> **Important:** Future capabilities described in this document are explicitly labeled as future development and should not be interpreted as currently implemented.

## Current Implementation Update - Personalized Decision Foundation

CURRENTLY IMPLEMENTED in the next development phase:

- A centralized user-context layer in `src/lib/context/user-context.ts` that aggregates profile, locale, academic system, tasks, exams, coding data, resume/project/application data, skills, and feedback into one typed context object.
- Global academic/localization configuration in `src/lib/context/global-config.ts`, with India preserved as the default and future-ready configurations for other academic systems.
- A non-destructive Supabase migration adding global profile columns, academic terms, courses, recommendation feedback events, normalized opportunity sources/opportunities, opportunity interactions, user skills, and RAG-ready context documents.
- A feedback event foundation through `recommendation_events` and `/api/feedback`, with existing task, priority, job, application, and learning-resource actions recording lightweight behavioral events.
- Explainable priority scoring in `src/lib/scoring/explainable-priority.ts`, now used by `/api/feed` while keeping the old priority scorer available for compatibility.
- A normalized opportunity matching layer with source-adapter interfaces, opportunity normalization, explainable deterministic match scores, matched skills, missing skills, and recommended actions.
- Skill-gap analysis in `src/lib/skills/skill-gap.ts` and `/api/skills/gaps`, connecting resume/profile skills to target roles and explicit required skills.
- A conservative RAG foundation with `ai_context_documents`, an embedding abstraction, and `/api/rag/index`. Documents can be indexed without embeddings; embeddings are generated only when OpenAI is configured and the document is appropriate to embed.
- Region-aware context is now available to the assistant and priority planner prompts through the unified context summary.
- Structured logging helpers exist in `src/lib/observability/logger.ts` for future request, AI, integration, and background-job observability.

These additions are foundations. They do not claim a trained machine-learning recommender, full global product localization, autonomous background agents, or complete mobile feature parity.

## Current Implementation Update - Decision Engine Expansion

CURRENTLY IMPLEMENTED in the follow-up engineering pass:

- The unified context layer now includes recent completed task history, opportunity interactions, project/GitHub-derived skills, subject skills, and broader career/coding evidence.
- Feedback events now support both legacy and clearer event names such as `task_postponed` and `task_snoozed`, plus learning-completion aliases.
- Explainable priority scoring now returns structured dimensions: `score`, `urgency`, `impact`, `effort`, `deadlineRisk`, `factors`, `reasons`, and `summary`.
- Temporal planning exists in `src/lib/planning/temporal.ts` and `/api/planning/overview`, producing workload-risk, deadline-risk, estimated pending minutes, available daily capacity, and concrete planning recommendations.
- A scoped AI context builder in `src/lib/ai/context-builder.ts` now prepares smaller, purpose-specific context for assistant, priority, opportunity, resume, learning, and global AI workflows.
- RAG retrieval now exists in `src/lib/rag/retrieval.ts` and `/api/rag/search`. It uses vector similarity through a Supabase RPC when embeddings and pgvector are available, and falls back to lexical retrieval when semantic search is unavailable.
- The assistant now receives bounded retrieved snippets from the RAG layer as explicitly untrusted context, alongside scoped unified user context. Assistant conversations are not automatically indexed.
- `/api/rag/index` chunks larger documents, uses stable source IDs for deduplication, stores lexical previews even without embeddings, and stores vectors only when OpenAI embeddings are configured.
- The database migration now includes a vector search index and `match_ai_context_documents` RPC using user-scoped RLS-compatible retrieval. It avoids `SECURITY DEFINER`.
- `/api/opportunities` lists stored normalized opportunities, ranks them against the current user context, and records user opportunity interactions.
- Opportunity matching now includes matched skills, missing skills, relevant projects, role alignment, explainable reasons, and recommended actions.
- Skill-gap analysis now uses target roles/goals plus saved, viewed, and applied opportunity requirements where available.
- Mobile support was extended with `/api/mobile/bootstrap` and endpoint constants in Android, iOS, and Expo code. The Expo task store now routes create, complete, and snooze actions through backend APIs so those actions participate in feedback and feed-cache invalidation.
- The feed is more region-aware: India retains Internshala-specific setup and sync behavior, while non-India profiles receive generic opportunity-goal setup guidance instead of India-specific portal recommendations.

CURRENT LIMITATIONS:

- Semantic RAG requires the Supabase migration to be applied and `OPENAI_API_KEY` to be configured. Without that, retrieval gracefully falls back to lexical matching.
- Opportunity ranking is deterministic and explainable; it is not a trained ranking model.
- Mobile apps are still not full production-parity clients, but they now have clearer shared backend integration points.
- Authenticated end-to-end QA still requires an active authenticated session and a database with the new migration applied.

## Current Implementation Update - Production Hardening Status

CURRENTLY VERIFIED in the hardening pass:

- Root TypeScript validation passes with `npx tsc --noEmit`.
- A lightweight deterministic root test harness now exists through `npm test`, covering priority scoring, overdue deadline scoring, country/academic configuration, opportunity normalization and matching, skill-gap analysis, and RAG lexical fallback without external credentials.
- The Next.js production build passes with `npm run build` and includes the new decision-engine API routes.
- Targeted ESLint passes on the newly added and modified decision-engine, RAG, opportunity, feedback, context, scoring, skills, assistant, feed, task, mobile-contract, and profile files.
- `git diff --check` passes.
- Production server smoke tests verified `/`, `/login`, `/feed`, `/settings`, `/api/assistant/health`, and unauthenticated rejection for `/api/user/context`, `/api/feed`, `/api/feedback`, `/api/skills/gaps`, `/api/mobile/bootstrap`, `/api/planning/overview`, `/api/opportunities`, and `/api/rag/search`.
- RAG was hardened with embedding request timeouts, bounded retrieval, lexical fallback, source ID deduplication, assistant-message exclusion, and an explicit semantic relevance threshold.
- Opportunity interaction recording was hardened to avoid duplicate-write failures when recent duplicate rows already exist.
- Overdue task scoring was corrected so overdue deadlines increase deadline risk and urgency instead of lowering priority.
- The assistant route now returns a controlled validation error for malformed or missing message payloads.
- The Supabase migration was statically reviewed as non-destructive, with RLS enabled on new tables, user-owned ownership predicates, authenticated grants, pgvector setup, and an RLS-compatible vector RPC that does not use `SECURITY DEFINER`.

CURRENTLY BLOCKED OR NOT VERIFIED:

- The Supabase migration has not been applied to a live target database in this environment because the Supabase CLI/project access is unavailable.
- Full repository-wide lint still fails due pre-existing lint debt in untouched legacy files.
- Authenticated browser QA was not completed because no authenticated browser/session was available.
- Android build validation is blocked because the Android project has Gradle configuration but no Gradle wrapper, no system Gradle, no checked-in version catalog for the top-level `libs.*` plugin aliases, and only scaffold-level Android source files in this checkout.
- iOS SwiftPM dependency resolution succeeds, but `swift build` is not a valid production proof for this iOS-only SwiftUI package because it builds the library as macOS and fails on UIKit/SafariServices-only APIs. Xcode/iOS simulator build validation remains required.
- Expo/React Native type-check remains blocked in this environment: the mobile dependency set reports Node 22+ engine requirements while this shell runs Node 20, and `npm ci --legacy-peer-deps --ignore-scripts` ended with an npm internal exit-handler error, leaving Expo's base TypeScript config unavailable.

## 1. Executive Summary

PrioryxAI is a student command center that combines academic deadlines, tasks, career preparation, coding-platform progress, job and internship opportunities, resume intelligence, project development, and AI assistance into one coordinated application.

The platform is designed primarily for students who are managing several disconnected workflows at once: university exams, assignments, GitHub projects, LeetCode practice, HackerRank activity, resume preparation, internship applications, and day-to-day planning. Instead of forcing the student to manually decide what matters most across many apps, PrioryxAI attempts to convert those scattered signals into prioritized actions.

CURRENTLY IMPLEMENTED:

- A Next.js web application with authenticated dashboard, assistant, feed, profile, settings, career, coding, resume, foundry, learning, and job-market surfaces.
- Supabase-backed persistence for users, tasks, assistant messages, coding profiles, GitHub analysis, LeetCode analysis, HackerRank profiles, schedules, resumes, project ideas, jobs, readiness scores, and peer/collaboration data.
- AI features powered mainly by OpenAI chat models for assistant responses, resume parsing/SWOT, schedule extraction, coding-platform analysis, project generation, readiness-score explanation, and selected prioritization flows.
- Rule-based and hybrid prioritization logic that ranks exams, tasks, coding gaps, GitHub actions, resume gaps, projects, and job/career actions.
- External integrations for GitHub, LeetCode through the ALFA LeetCode API, HackerRank through a coding-profile service, Remotive, Arbeitnow, Internshala through Apify, and YouTube recommendations.
- Early native/mobile codebases for Android, iOS, and Expo/React Native. These are present, but they are not equivalent to a complete production mobile ecosystem.

PrioryxAI is more than a conventional task manager because its product direction is not only to store tasks. Its core idea is: **from information overload to intelligent action**. The platform collects student context, normalizes it into usable signals, applies priority logic, and uses AI where appropriate to explain, recommend, generate, or assist.

The long-term vision is an AI-powered student intelligence platform: a system that understands academic workload, coding readiness, portfolio strength, job-market fit, available time, and user goals well enough to recommend what a student should do today, this week, and over a semester.

## 2. Problem Statement

Students often manage academic and career progress through fragmented systems:

- Academic schedules, exam PDFs, timetable images, assignment deadlines, and calendars.
- Separate task managers or notes apps.
- GitHub for projects and public proof of work.
- LeetCode and HackerRank for coding practice.
- Job boards, internship portals, company career pages, and university placement cells.
- Resume documents, project ideas, learning resources, and generic AI chatbots.

This fragmentation creates decision fatigue. A student may know that an exam is close, a resume is weak, LeetCode consistency is low, GitHub projects need cleanup, and internship deadlines are approaching, but still not know what to do first.

PrioryxAI centralizes these signals by storing academic, task, coding, resume, project, job, and assistant data in a shared Supabase-backed model. The dashboard and priority APIs then turn those signals into a unified feed, setup tasks, next-move recommendations, readiness scores, and AI-assisted guidance.

CURRENTLY IMPLEMENTED:

- Centralized web dashboard and feed.
- Manual and imported academic/job/task records.
- Resume, GitHub, LeetCode, HackerRank, project, and job-market data ingestion.
- Deterministic scoring and priority logic.
- LLM-assisted planning, explanations, extraction, and recommendations.

FUTURE DEVELOPMENT:

- Deeper integrations with university LMS/SIS platforms, official career portals, calendars, and regional academic systems.
- More personalized long-term planning based on actual completed actions and observed outcomes.

## 3. Current PrioryxAI - Product Overview

The current product is a web-first platform with supporting mobile app code. Its main product modules are:

| Module | CURRENT user-facing purpose | Backend/data behavior | AI involvement | Current limitations |
| --- | --- | --- | --- | --- |
| Dashboard and Feed | Shows next priority, task feed, setup nudges, stats, notifications, and access to AI | `/api/feed`, `tasks`, `github_cache`, user profile, Redis caching | Mostly deterministic scoring; AI indirectly through generated GitHub/resume/coding insights | Depends on available user data and external sync freshness |
| Task Management | Lets users create, complete, snooze, stage, and view tasks | `tasks` table and task API routes | Assistant can create/snooze tasks through tool calling | No full calendar engine or complex recurrence model |
| Academic Scheduling | Uploads exam/timetable files and converts extracted entries into schedule/task records | `schedule_exams`, `schedule_timetable`, task inserts, Supabase Storage flows | GPT-4o/file-processing extraction prompts | Extraction quality depends on document clarity; India-oriented prompt assumptions |
| AI Assistant | Chat panel with streaming responses and workspace tools | `/api/assistant`, `assistant_messages`, memory extraction, rate limits | GPT-4o chat/tool loop; GPT-4o-mini memory extraction | Not fully autonomous; constrained to available tools and context |
| Priority Planning | Produces daily action plans and priority tasks | `/api/priority`, `/api/priority/today`, collectors, Redis, `priority_tasks`, `daily_plans` | Hybrid: GPT-4o JSON planner with deterministic fallback | Personalization is signal-based, not trained ranking |
| Readiness Score | Shows placement readiness score and next actions | Deterministic score stored in `readiness_scores` | GPT-4o-mini explains deterministic score without changing it | Formula is fixed and versioned; not a learned model |
| Resume Intelligence | Uploads, parses, analyzes, and can generate resumes | `user_resumes`, file parser, PDF/DOCX/text/vision extraction | GPT-4o parsing/SWOT; GPT-4o resume generation | Depends on source resume quality; generation is Pro-gated |
| Project Foundry | Generates tailored portfolio projects and tracks phases | `user_projects`, phase submissions, MCP foundry tools | GPT-4o project generation, verification, mentor-like flows | Project execution itself remains user-driven |
| GitHub Intelligence | Syncs repos/activity and analyzes portfolio quality | GitHub GraphQL, `github_cache`, `github_analysis`, `github_priority_actions` | Deterministic scoring plus optional GPT-4o narrative | Requires GitHub token and username; no deep code parsing beyond repo metadata/scoring |
| LeetCode Intelligence | Connects profile, computes score, analyzes gaps, recommends problems | ALFA API, `leetcode_profiles`, `leetcode_ai_analyses`, `problem_recommendations` | GPT-4o analysis and problem selection; deterministic base readiness score | External API dependency and profile-data availability |
| HackerRank Intelligence | Connects profile, analyzes badges/certifications and practice gaps | Coding-profile service, `multi_platform_profiles`, `hr_practice_progress` | GPT-4o career/coding analysis; deterministic practice recommendations | External service dependency; some fallback/demo behavior exists |
| Job and Opportunity Feed | Fetches tech jobs and internships and stores/scores opportunities | Remotive, Arbeitnow, Apify/Internshala, `job_applications`, job tasks | Primarily deterministic match scoring | Coverage and freshness depend on APIs, scraper, tokens, and rate limits |
| Learning/YouTube | Recommends learning videos from student signals | YouTube Data API, Redis, `youtube_recommendations` | GPT-4o can generate recommendation explanations/ranking | External quota and fallback curated content |
| Profile and Settings | Stores user academic, skill, GitHub, and preference information | `users`, profile/settings API/pages | Profile data feeds AI context | Profile completeness strongly affects output quality |
| MCP / Agent Tools | Exposes internal tools through JSON-RPC, direct JSON, or SSE | `/api/mcp`, registry, tool adapters, agentic orchestrator | GPT-4o can run a bounded tool-call loop | This is implemented for tool orchestration, not a broad autonomous agent ecosystem |

## 4. Core Product Architecture

### Frontend

CURRENTLY IMPLEMENTED:

- Framework: Next.js 14 App Router with React 18 and TypeScript.
- Styling/UI: Tailwind CSS, custom components, lucide-react icons, Framer Motion, Recharts, and responsive layouts.
- Routing: file-based routes under `src/app`, including authenticated application pages, public pages, and many API routes.
- Main UI structure: dashboard, feed, assistant panel, career/coding screens, resume upload/generation, job market, foundry project views, learning feed, profile, settings, login, onboarding, privacy, and terms pages.
- State/data fetching: client components use fetch calls to API routes, local React state, sessionStorage caching in some dashboard shell flows, and Supabase clients where appropriate.
- PWA support: `public/manifest.json`, app icons, and Capacitor configuration are present.

Client/server boundaries are mainly aligned with Next.js App Router conventions: React components render the UI, while API routes and server utilities handle Supabase access, external API calls, OpenAI calls, and service-role operations.

### Backend

CURRENTLY IMPLEMENTED:

- Backend is implemented as Next.js API routes under `src/app/api`.
- Server-side logic includes authentication checks, Supabase reads/writes, service-role operations, OpenAI calls, Redis caching/rate limiting, QStash validation, webhook validation, file processing, PDF generation, and external API requests.
- Important API areas include assistant, priority, readiness score, feed, tasks, schedule, GitHub, LeetCode, HackerRank, resume, foundry, job market, YouTube, MCP, payments, storage, and profile/user routes.
- External calls are made from server routes/libraries, not directly from the browser for sensitive operations.

### Database

CURRENTLY IMPLEMENTED:

PrioryxAI uses Supabase with PostgreSQL migrations. The repository contains migrations for:

- `users`
- `tasks`
- `assistant_messages`
- `subscriptions`
- `github_cache`
- `github_analysis`
- `github_priority_actions`
- `github_intelligence_reports`
- `user_resumes`
- `user_projects`
- `phase_submissions`
- `coding_profiles`
- `user_coding_profiles`
- `leetcode_profiles`
- `leetcode_ai_analyses`
- `problem_recommendations`
- `coding_streaks`
- `multi_platform_profiles`
- `hr_practice_progress`
- `job_applications`
- `schedule_timetable`
- `schedule_exams`
- `priority_tasks`
- `daily_plans`
- `dsa_questions`
- `dsa_progress`
- `youtube_recommendations`
- `youtube_trending_cache`
- `youtube_watch_history`
- `peer_profiles`
- `peer_connections`
- `peer_challenges`
- `peer_xp`
- `peer_notifications`
- `challenge_messages`
- `collab_sessions`
- `readiness_scores`

Many tables enable Row Level Security with user-owned access policies. Server-side workflows sometimes use a Supabase service-role client for backend jobs, storage processing, schedule insertion, integration syncs, or administrative writes. That service role bypasses RLS by design, so these paths must remain carefully controlled.

### External Integrations

CURRENTLY IMPLEMENTED:

- GitHub: GraphQL API for repositories, languages, contributions, streaks, and cache updates; webhook route for push-triggered sync.
- LeetCode: ALFA LeetCode API plus fallback validation logic; profile, solved stats, skills, contests, calendar, languages, badges, problems, and recommendations.
- HackerRank: external coding-profile service for stats; badge/certification analysis and practice recommendations.
- Jobs/internships: Remotive, Arbeitnow, and Internshala through Apify.
- YouTube: YouTube Data API for learning recommendations with curated fallback behavior.
- OpenAI: GPT-4o and GPT-4o-mini through `src/lib/openai.ts`.
- Redis/Upstash: caching, rate limiting, daily message counters, feed caching, and planner caching.
- QStash: secured background job sync route for job synchronization.
- Razorpay: subscription/payment related code and webhook/config support.

## 5. AI Architecture

## AI Architecture

PrioryxAI currently uses AI as an application intelligence layer, not as a standalone machine-learning platform. Most AI behavior is implemented through OpenAI chat completions with structured prompts, JSON response formats where needed, and deterministic fallbacks for important flows.

### AI Providers and Models

CURRENTLY IMPLEMENTED:

- Provider: OpenAI.
- Main model: `gpt-4o`.
- Lower-cost explanation/memory model: `gpt-4o-mini`.
- AI calls are routed through server-side code, primarily `src/lib/openai.ts` and feature-specific libraries/routes.

### AI Feature Matrix

| AI feature | Input | Processing | Model | Output | User impact |
| --- | --- | --- | --- | --- | --- |
| Assistant chat | User message, profile, top tasks, GitHub cache, recent history, persistent memory | Prompt construction, bounded tool loop, streaming response, message persistence | GPT-4o; GPT-4o-mini for memory extraction | Text advice, task creation/snoozing, task/exam/readiness lookup | Gives immediate personalized guidance |
| Priority planner | Exams, DSA, GitHub, resume gaps, projects, subjects, workload/burnout state | Signal collectors build JSON context; GPT returns ranked JSON plan; deterministic fallback | GPT-4o | Daily tasks, focus, alerts, insights, burnout note | Converts many signals into a daily action plan |
| Readiness explanation | Deterministic readiness score and component breakdown | LLM explains fixed score without changing it; Redis cache by score hash | GPT-4o-mini | Summary and three next actions | Makes the score understandable and actionable |
| Resume parsing/SWOT | Uploaded PDF/DOCX/image/text resume | File extraction, AI parsing, JSON normalization, SWOT generation | GPT-4o | Parsed resume data, skills, SWOT | Feeds career matching, project generation, and recommendations |
| Resume generation | User profile, resume data, career context | LLM drafts resume content; PDF renderer outputs document | GPT-4o | Generated resume PDF/content | Helps produce a job-ready resume |
| Academic schedule extraction | Uploaded timetable/exam/calendar documents or images | Text/vision extraction prompt, JSON parsing, storage into schedule/tasks | GPT-4o | Structured exam/deadline entries | Turns documents into trackable deadlines |
| GitHub narrative | Cached repo metadata and user stream | Deterministic repo scoring, optional AI strengths/weaknesses narrative | GPT-4o | Portfolio analysis and priority actions | Helps improve recruiter-facing project quality |
| LeetCode analysis | LeetCode profile/stats/skills/contests | Deterministic score plus AI JSON assessment and problem curation | GPT-4o | Readiness, gaps, roadmap, problem recommendations | Guides DSA preparation |
| HackerRank analysis | Badges, certifications, solved data, target stream | Deterministic badge mapping plus AI career/coding analysis | GPT-4o | Missing skills, weekly plan, practice advice | Adds another coding signal |
| Project Foundry | Resume, SWOT, profile, coding, GitHub context | MCP tool calls and GPT project-generation/phase checks | GPT-4o | 9 tailored projects and phase guidance | Helps convert skills/gaps into portfolio work |
| MCP orchestration | Natural-language tool request and registered tools | GPT tool-call loop with SSE progress and iteration cap | GPT-4o | Tool results and final answer | Enables bounded multi-tool workflows |

### Prompt Construction and Context

CURRENTLY IMPLEMENTED:

- Prompts are manually constructed in route/library code.
- The assistant prompt includes student profile class, semester, college, CGPA, subjects, top incomplete tasks, GitHub health, recent GitHub activity, top languages, repo count, recent assistant history, and persistent memory snippets.
- The priority planner prompt receives a structured signal object built from collectors and workload state.
- The readiness explanation prompt receives deterministic component scores and selected user context such as resume skills and LeetCode weak topics.
- Resume, schedule, LeetCode, HackerRank, and project flows use feature-specific JSON schema instructions.

### Streaming and Error Handling

CURRENTLY IMPLEMENTED:

- `/api/assistant` returns a chunked text stream. It runs a bounded tool-call loop and streams the final text response or emits the full response when a non-streaming tool path completes.
- `/api/mcp` supports SSE streaming for tool execution and also supports JSON-RPC 2.0.
- Some foundry and analysis routes emit progress events.
- Fallbacks exist for assistant responses, priority planning, readiness explanation, GitHub narrative, and external API failures.

### Agentic Behavior

CURRENTLY IMPLEMENTED:

- The normal assistant includes bounded OpenAI function/tool calling with tools such as `get_readiness_score`, `get_today_tasks`, `create_task`, `snooze_task`, `get_leetcode_weak_topics`, and `get_upcoming_exams`.
- The MCP layer includes a real bounded GPT-4o tool-call loop in `agentic-orchestrator.ts`, with registered tools, tool execution, result feedback, progress events, and an iteration cap.

This is agentic in a limited technical sense: the model can choose tools, observe tool results, and continue for a bounded number of iterations. It is not a fully autonomous background agent system.

FUTURE DEVELOPMENT:

- Long-running autonomous agents, multi-agent collaboration, vector memory, planner/executor separation, tool safety policies, and approval workflows.

## 6. AI-Powered Prioritization

CURRENTLY IMPLEMENTED:

PrioryxAI has a hybrid prioritization architecture.

Deterministic/rule-based inputs include:

- Task type, completion state, due dates, deadlines, priority fields, stages, and weightage.
- Exams in `schedule_exams`, especially dates within the next 14 days.
- Resume availability, extracted skill count, and SWOT presence.
- LeetCode placement readiness score and AI-derived weak topics.
- GitHub health, repo metadata, repo descriptions, recency, and generated priority actions.
- Project phase state from `user_projects`.
- DSA question metadata and user progress.
- Workload and burnout state calculated from pending/completed tasks and exam pressure.

AI-powered inputs and outputs include:

- GPT-4o priority planner that receives structured signals and returns a JSON daily plan with task ranking, reasoning, alerts, burnout risk, and today's focus.
- GPT-4o/GPT-4o-mini explanations that make deterministic scores or analyses understandable.
- AI-created coding, GitHub, resume, and project insights that can feed priority displays.

Hybrid behavior:

```text
User Data
  -> Supabase Tables + External API Cache
  -> Signal Collectors
  -> Deterministic Feature Extraction
  -> GPT-4o Priority Planner where enabled
  -> Deterministic Fallback Engine
  -> Dashboard Feed / Daily Plan / Assistant Context
```

Important distinction:

- The system does not currently train its own ML ranking model.
- The readiness score is deterministic.
- The fallback priority engine is deterministic.
- The LLM planner is generative/reasoning-based and cached, but it is not a learned recommender trained on PrioryxAI user outcomes.

FUTURE DEVELOPMENT:

PrioryxAI could evolve into a personalized ranking engine by learning from user feedback, task completion patterns, deadline outcomes, coding improvement, job-application conversion, and project progress. That future system would still benefit from the current architecture because the repository already separates ingestion, feature extraction, scoring, AI explanation, and user-facing recommendations.

## 7. AI Assistant

### CURRENT AI ASSISTANT

The current assistant is implemented through `/api/assistant` and a frontend assistant panel. Users type natural-language questions or choose suggested prompts. The frontend sends the message to the API and renders streamed text responses.

Request/response flow:

```text
Assistant UI
  -> POST /api/assistant
  -> Supabase auth check
  -> IP and per-user rate limits
  -> Free/pro message limit check
  -> Fetch user, tasks, GitHub cache, memory, and history
  -> GPT-4o bounded tool loop
  -> Stream final text to UI
  -> Save assistant response
  -> Extract persistent memory asynchronously
```

Assistant tools currently include:

- `get_readiness_score`
- `get_today_tasks`
- `create_task`
- `snooze_task`
- `get_leetcode_weak_topics`
- `get_upcoming_exams`

The assistant can read live context and can create or modify tasks through these explicit tools. It does not have unrestricted access to arbitrary application actions.

Personalization comes from:

- Supabase user profile fields.
- Semester, college, subjects, CGPA.
- Top incomplete tasks.
- GitHub health, languages, repositories, and last commit.
- Assistant message history.
- Persistent user memory extracted from prior assistant sessions.

Error handling:

- OpenAI failures fall back to contextual canned responses.
- Rate limits return 429/403/503 depending on failure mode.
- User messages and assistant messages are persisted in `assistant_messages`.

### FUTURE AUTONOMOUS/AGENTIC AI

Future autonomous AI would require stronger tool governance, explicit user approvals, persistent planning state, audit logs, background execution, retries, and safety constraints. The current assistant is a bounded, user-initiated chat/tool interface rather than a continuously operating autonomous agent.

## 8. Data Flow

CURRENT architecture:

```text
Student
  |
  v
PrioryxAI Web Application (Next.js / React)
  |
  v
Next.js API Routes
  |
  +--> Supabase Auth
  +--> Supabase PostgreSQL Tables
  +--> Supabase Storage
  +--> Redis / Upstash Cache and Rate Limits
  +--> External Integrations
  |      - GitHub GraphQL
  |      - ALFA LeetCode API
  |      - HackerRank coding-profile service
  |      - Remotive / Arbeitnow / Apify Internshala
  |      - YouTube Data API
  |
  +--> AI Layer
         - OpenAI assistant
         - priority planner
         - resume and schedule extraction
         - coding analysis
         - readiness explanation
         - MCP tool orchestration
  |
  v
Normalized Student Context
  |
  v
Feed + Dashboard + Daily Plan + Assistant + Career/Coding Views
```

The system stores stable user context in Supabase, caches expensive or repeated computations in Redis, and calls AI/external APIs from server-side routes. User-facing surfaces then fetch combined data through application APIs.

## 9. Dashboard and Command Center

CURRENTLY IMPLEMENTED:

The dashboard acts as the primary command center. It surfaces:

- Next priority or next-move card from the feed.
- Active tasks and deadlines.
- Setup tasks such as adding exam dates, connecting GitHub, or updating skills.
- Job and internship tasks.
- GitHub/project guidance.
- Stats and progress indicators.
- Assistant entry points and profile/settings controls.
- Notification-style deadline/setup items in the app shell.
- Readiness score UI through the readiness-score component and API.

The dashboard turns multiple sources into a single interface by combining stored tasks, integration caches, profile completeness, generated setup nudges, job opportunities, and priority scores.

Current limitation:

- The dashboard is only as strong as the data available. If a student has not connected GitHub, uploaded a resume, added subjects, imported exams, or connected coding platforms, many recommendations become setup-oriented.

## 10. Academic Intelligence

CURRENTLY IMPLEMENTED:

- Manual tasks can represent exams, assignments, jobs, GitHub work, learning, or general tasks.
- Exam schedule upload routes parse academic documents with AI and write structured exam entries.
- Timetable/schedule routes store timetable data.
- Extracted exam/deadline entries can be inserted into `tasks` so they appear in the feed and priority logic.
- The priority engines treat upcoming exams as high-urgency signals, especially when exams are within 14 days and critical when very close.
- Assistant tools can retrieve upcoming exams from `schedule_exams`.

AI involvement:

- GPT-4o is used to extract exam dates, assignment deadlines, test dates, lab submissions, venue/session metadata, and schedule structure from uploaded files.

Deterministic involvement:

- Deadline proximity, due dates, task completion, and priority ranking are handled by rule-based code.

Current limitations:

- The extraction prompt is explicitly oriented toward Indian university schedule formats.
- There is no confirmed full university SIS/LMS integration.
- There is no complete recurring calendar engine, automatic class attendance tracking, or universal academic-calendar standardization.

## 11. Career and Opportunity Intelligence

CURRENTLY IMPLEMENTED:

Career features include:

- Resume upload, parsing, SWOT analysis, and generated resume support.
- Job-market browsing using Remotive and Arbeitnow.
- Internshala job sync through Apify, derived from subjects and GitHub languages.
- Job application persistence in `job_applications`.
- Job tasks stored in `tasks` with stages such as saved/applied/interview/offer/rejected.
- Feed ranking and job match reasons based on skills, stipend, deadline proximity, and profile subjects.
- Project Foundry for generating portfolio project ideas from resume/coding/GitHub context.
- Career collaboration/peer challenge tables and routes for peer-oriented learning or challenges.

Opportunity aggregation:

- Remotive and Arbeitnow are fetched live by the job-market route and filtered to tech roles.
- Internshala data is fetched through Apify and upserted as per-user job tasks.
- Redis cache and sync markers reduce repeated external calls.
- QStash can trigger job sync with request-signature validation or authenticated-user fallback.

Current limitations:

- Opportunity coverage is limited to implemented sources.
- Match scoring is deterministic text matching against user skills and profile data.
- There is no confirmed direct integration with university placement portals or company applicant-tracking systems.

## 12. Developer Intelligence

### GitHub

CURRENTLY IMPLEMENTED:

- Sync uses GitHub GraphQL and `GITHUB_TOKEN`.
- Data retrieved includes top repositories, descriptions, URLs, primary languages, stars, push timestamps, contribution days, total commit contributions, language counts, streak days, and health score.
- Data is cached in `github_cache`.
- Repository analysis scores projects deterministically across portfolio dimensions and creates priority actions for weak repo signals such as missing descriptions, weak README/deployment signals, stale code, or low recruiter value.
- Optional GPT-4o narrative summarizes portfolio strengths and weaknesses.
- Webhook support validates GitHub push events and triggers sync.

### LeetCode

CURRENTLY IMPLEMENTED:

- Uses ALFA LeetCode API.
- Retrieves profile, solved counts, skills, contests, contest history, calendar, language stats, badges, problems, daily challenge, and problem metadata.
- Computes deterministic placement readiness from volume, quality, contest performance, and consistency.
- GPT-4o produces structured assessment, priority topics, contest advice, language advice, a 12-week roadmap, and personalized feedback.
- GPT-4o can curate recommended problems from candidate problems.

### HackerRank

CURRENTLY IMPLEMENTED:

- Uses an external coding-profile service.
- Retrieves/normalizes badges, certifications, solved counts, and profile signals.
- Maps badges to stream-relevant domains and missing skills.
- GPT-4o generates career/coding analysis, weekly action plans, certification advice, and cross-platform insights.
- Deterministic practice recommendations are generated from missing/earned badges.

FUTURE DEVELOPMENT:

- Unified skill graph across all coding platforms.
- Skill-gap detection against target companies or job descriptions.
- More robust source verification and deeper code-quality analysis.
- Learned improvement prediction based on actual progress.

## 13. Authentication and Security

CURRENTLY IMPLEMENTED:

- Supabase Auth is used for user authentication.
- Next.js middleware refreshes/updates Supabase sessions for non-API routes.
- API routes perform their own auth checks using Supabase server clients or helper functions.
- Many tables enable Row Level Security with policies restricting users to their own rows.
- Server-side service-role clients are used for backend operations that need elevated writes.
- Assistant route includes IP-level in-memory rate limiting, Redis-backed per-user rate limiting, and free-user daily message limits.
- Webhooks include verification logic for GitHub and QStash paths where implemented.
- Secrets are expected through environment variables such as Supabase keys, OpenAI key, GitHub token, Apify token, QStash keys, Razorpay keys, and YouTube key.

Security limitations:

- Some mobile/demo code contains public Supabase configuration directly in source; Supabase anon keys are public by design, but production mobile configuration should still be environment-managed.
- The MCP token path notes an MVP token-hash/plain-token concern in code comments.
- The repository does not prove compliance certification, formal privacy program, full audit logging, full key rotation, or enterprise security controls.

FUTURE DEVELOPMENT:

- Stronger token hashing/rotation, audit trails, scoped service-role operations, per-tool authorization, admin observability, and compliance-ready data export/deletion workflows.

## 14. Current Technical Strengths

CURRENTLY IMPLEMENTED strengths:

- Web-first architecture with clear separation between UI components, API routes, integration libraries, and Supabase persistence.
- Broad student signal coverage: academics, tasks, GitHub, LeetCode, HackerRank, resume, projects, jobs, learning, assistant history, and readiness score.
- Hybrid AI design: deterministic scoring for stable calculations and LLMs for extraction, explanation, planning, and generation.
- Redis/Upstash usage for caching and rate limiting.
- Supabase migrations with RLS on many user-owned data models.
- Bounded tool-calling assistant and MCP tool orchestration.
- External integration abstraction in dedicated library files.
- Early cross-platform work through Android, iOS, and Expo/React Native folders.

## 15. Current Limitations

CURRENT limitations based on the repository:

- Scalability: serverless API routes and external API calls are practical for early-stage use but need background workers, queues, and stronger observability for large-scale traffic.
- AI cost and latency: many features call GPT-4o; caching exists in some flows, but heavy use can become expensive.
- External dependency reliability: GitHub, ALFA LeetCode API, coding-profile service, Remotive, Arbeitnow, Apify, YouTube, OpenAI, Supabase, Redis, and QStash availability affects functionality.
- Data freshness: some syncs are cached or fire-and-forget; data may not always be real time.
- Personalization: recommendations are contextual and rule/LLM-based, not trained on longitudinal outcome data.
- Recommendation accuracy: deterministic formulas and prompt outputs can miss nuance or over-rank available signals.
- Internationalization: current academic extraction prompts and career assumptions include India-oriented behavior.
- Mobile readiness: Android/iOS/Expo code exists, but mobile apps are not yet a fully proven production replacement for the web app.
- Observability: code shows logging and fallbacks, but not a complete production-grade tracing/metrics/audit stack.
- Compliance: no current evidence of GDPR certification, formal consent management, data residency, or regulated student-data compliance.

## 16. Future AI Development

FUTURE DEVELOPMENT:

### Personalized AI Decision Engine

PrioryxAI can evolve from AI-assisted features into a continuously personalized decision engine. The future system could understand:

- Academic workload.
- Exam and assignment deadlines.
- Coding progress and weak topics.
- GitHub portfolio quality.
- Resume strengths and gaps.
- Projects and phase progress.
- Internships, jobs, and application status.
- Career goals and target companies.
- Available time and work capacity.

It could generate:

- Daily priorities.
- Weekly plans.
- Deadline warnings.
- Skill-gap analysis.
- Personalized learning paths.
- Project recommendations.
- Career recommendations.
- Opportunity ranking.
- Adaptive schedules.

The current architecture already has useful building blocks: normalized tables, signal collectors, deterministic scoring, LLM explanations, and action-oriented dashboard surfaces. Future work would add feedback loops and learned ranking.

## 17. Advanced AI Roadmap

FUTURE DEVELOPMENT unless marked otherwise:

| Technology | What it is | Why it benefits PrioryxAI | Architectural fit | Current status |
| --- | --- | --- | --- | --- |
| Retrieval-Augmented Generation | LLM answers grounded in retrieved documents/data | Better answers over resume, schedules, docs, and historical plans | Retrieval layer before assistant calls | Foundation implemented; production use requires migration and credentials |
| Embeddings | Vector representations of text/items | Semantic matching between skills, jobs, projects, and learning content | OpenAI embedding abstraction plus Supabase vector column | Foundation implemented when `OPENAI_API_KEY` is configured |
| Vector database | Database/index for similarity search | Fast semantic retrieval and personalization | Supabase pgvector via migration | Migration foundation implemented; not verified against a live Supabase database in this environment |
| Semantic search | Meaning-based search | Match students to jobs/resources beyond keyword overlap | Search layer over opportunities, projects, videos | Not implemented |
| Personalized recommender | Model/rules ranked per user | Higher relevance over time | Ranking service using feedback and outcomes | Not implemented |
| Learning-to-rank | ML ranking from historical examples | Improves priority/order quality | Training pipeline and feature store | Not implemented |
| Feedback loops | Use user actions as signals | Personalization improves from completions/dismissals | Store feedback events and retrain/re-rank | Partially present through completed tasks, not a full feedback system |
| LLM planning | LLM decomposes goals into plans | Better multi-step academic/career planning | Extend existing priority planner and MCP tool loop | Partially present |
| Tool-using agents | AI invokes tools to inspect/update state | More useful assistant actions | Extend assistant/MCP tool registry | Partially present |
| Multi-step reasoning | Iterative analysis over several sources | Better cross-domain recommendations | Agentic orchestrator with state and approvals | Partially present in bounded MCP/assistant loops |
| Knowledge graphs | Typed relationships between skills, courses, jobs, projects | Better explanation and gap analysis | Graph model over student skills and opportunity requirements | Not implemented |
| Temporal reasoning | Reason over time, workload, deadlines | Better schedule and deadline-risk planning | Calendar/workload engine | Partially present through deadline and burnout logic |
| Workload prediction | Estimate future overload | Prevent burnout and missed deadlines | Model using task history and calendar | Not implemented |
| Deadline risk prediction | Predict likely missed tasks | Early warnings | Train over task completion/outcome data | Not implemented |
| Skill-gap detection | Compare skills to goals/jobs | More precise learning/project advice | Skill ontology + job/resume/coding signals | Partially present through prompt/rule analysis |
| Resume-job matching | Match resume to job descriptions | Better application targeting | Semantic matching and scoring | Basic deterministic matching exists; advanced matching is future |
| Adaptive scheduling | Generate schedules around capacity | Better execution planning | Calendar + workload + feedback loop | Not implemented |

## 18. Future Agentic PrioryxAI

FUTURE DEVELOPMENT:

A future agent architecture could be:

```text
Student Context Agent
  -> Academic Agent
  -> Career Agent
  -> Coding / Skill Agent
  -> Opportunity Agent
  -> Planning / Prioritization Agent
  -> Personal AI Coordinator
```

Such a system could:

- Observe changes in tasks, schedules, coding activity, jobs, and projects.
- Reason over deadlines, goals, and workload.
- Plan daily and weekly priorities.
- Recommend actions.
- Execute approved actions such as creating tasks, drafting resumes, or preparing application checklists.
- Evaluate outcomes.
- Adapt future recommendations.

CURRENT status:

- PrioryxAI currently has bounded tool-calling in the assistant and MCP orchestration.
- It does not yet have continuously running autonomous agents, independent background planning, approval workflows for real-world actions, or multi-agent memory/state management.

## 19. Global Expansion Beyond India

FUTURE DEVELOPMENT:

The current product has some India-oriented assumptions, especially around academic schedule extraction and Internshala-oriented opportunity flows. Global expansion should replace country-specific logic with configurable models.

### International Academic Systems

PrioryxAI should support:

- Semesters, quarters, trimesters, and modular academic terms.
- Different grading systems: GPA, CGPA, percentage, honors classifications, pass/fail, credits.
- Country-specific exam structures and assessment terminology.
- University-specific calendars, holidays, add/drop periods, and placement seasons.
- Configurable credit systems and workload models.

Recommended architecture:

- `academic_systems` configuration by country/region/institution.
- Configurable term, course, exam, credit, and grading schemas.
- Locale-aware academic extraction prompts.
- Imported academic events stored in a normalized model rather than hard-coded calendar assumptions.

### Global Career Ecosystem

PrioryxAI should add a source abstraction layer for:

- International job boards.
- Internship platforms.
- University career portals.
- Company career pages.
- Regional government/employment APIs.
- Country-specific hiring calendars.

Each source adapter should normalize opportunities into common fields such as title, company, location, remote policy, deadline, salary/stipend/currency, eligibility, skills, application URL, source, and freshness timestamp.

### Localization

PrioryxAI should support:

- Multiple languages.
- Local date/time formats.
- Time zones.
- Currencies.
- Regional holidays.
- Academic terminology.
- Country-specific role names and credential conventions.

Localization should exist at both UI and data/model layers. Translating labels is not enough; the AI and ranking logic need country, institution, calendar, market, and terminology context.

## 20. International AI Personalization

FUTURE DEVELOPMENT:

Global AI personalization should adapt recommendations based on:

- Country and region.
- University and academic system.
- Time zone and working hours.
- Local exam formats.
- Local internship/job market.
- Language preferences.
- Currency and compensation norms.
- Visa/work authorization constraints where relevant.
- Regional platforms and opportunity sources.

Architecturally, this requires a context layer that feeds locale and academic/career-market metadata into AI prompts, deterministic scoring, opportunity matching, and scheduling logic. The same underlying dashboard can remain, but the data normalization and prompt context must become region-aware.

## 21. Android Application

### CURRENT Android Status

The repository contains a `PrioryxAI-Android` native Android project.

CURRENTLY IMPLEMENTED:

- Kotlin/Android project configured with Jetpack Compose, Material 3, Navigation Compose, lifecycle/viewmodel dependencies, Supabase Kotlin libraries, DataStore, Coil, Lottie, Razorpay, Android security crypto, Retrofit, and OkHttp logging.
- Android namespace/application ID: `in.prioryxai.app`.
- Kotlin/Java 17 configuration.
- Basic application and activity scaffolding.

Current limitation:

- The inspected Android source is early scaffold-level compared with the web implementation. It is not currently a complete, feature-parity production Android app.

### FUTURE Android Roadmap

FUTURE DEVELOPMENT:

- Native dashboard with next priority, tasks, readiness score, and opportunities.
- AI assistant with streaming or incremental response rendering.
- Push notifications for deadlines, exams, job alerts, and project reminders.
- Calendar integration.
- Coding progress views for GitHub, LeetCode, and HackerRank.
- Resume upload and project foundry mobile flows.
- Offline cache for tasks, profile, and recent recommendations.
- Background synchronization for non-sensitive refreshes.
- Secure token storage with Android Keystore-backed mechanisms.
- Biometric unlock where appropriate.
- Deep links into tasks, opportunities, and assistant prompts.
- Crash monitoring and analytics.

The Android app should call the existing backend/API layer and Supabase-authenticated services instead of duplicating business logic on-device.

## 22. iOS Application

### CURRENT iOS Status

The repository contains a `PrioryxAI-iOS` Swift package/project.

CURRENTLY IMPLEMENTED:

- Swift 5.9 / iOS 17 package.
- Dependencies for Supabase Swift, MarkdownUI, Lottie, and Kingfisher.
- SwiftUI screens for dashboard, assistant, learning, profile, onboarding/auth, setup, career jobs, coding, foundry, resume, and upgrade surfaces.
- Design-system components such as cards, buttons, badges, avatar, score ring, typography, colors, skeletons, and empty states.
- API client and Keychain helper for token-based requests.

Current limitation:

- The iOS code is an early native implementation/scaffold with sample/demo-style UI paths in places. It is not shown as a complete production app with full backend parity.

### FUTURE iOS Roadmap

FUTURE DEVELOPMENT:

- Native dashboard and AI assistant with shared backend APIs.
- Push notifications and background refresh.
- Calendar integration and widgets.
- Apple ecosystem integrations such as Siri/Shortcuts where useful.
- Secure token storage in Keychain.
- Face ID/Touch ID app lock where appropriate.
- Offline support for tasks and recent recommendations.
- Deep linking into tasks, assistant conversations, project phases, and opportunities.
- Crash monitoring, analytics, and release management.

iOS should share the same backend, database, authentication, AI, and integration architecture as web and Android.

## 23. Cross-Platform Architecture

CURRENT and FUTURE architecture:

```text
                PrioryxAI
                    |
    ---------------------------------
    |               |               |
   Web           Android           iOS
 Next.js       Native/Expo       SwiftUI
    |               |               |
    ---------------------------------
                    |
             Unified API Layer
         Next.js API Routes / Future API
                    |
    ---------------------------------
    |               |               |
 Database          AI          Integrations
    |               |               |
 Supabase       OpenAI /       GitHub, LeetCode,
 PostgreSQL     Future AI      HackerRank, Jobs,
 Auth/Storage   Engine         YouTube, Payments
```

CURRENTLY IMPLEMENTED:

- Web is the most complete client.
- Android, iOS, and Expo/React Native folders exist as mobile workstreams.
- Shared backend APIs already provide many reusable endpoints for mobile clients.

FUTURE DEVELOPMENT:

- API versioning for mobile compatibility.
- Shared schemas/types across clients.
- Standardized auth/session exchange for native clients.
- Offline sync and conflict handling.
- Cache strategy by endpoint.
- Event-driven notifications and background workers.
- Feature flags for gradual rollout.
- Platform-specific telemetry and crash monitoring.

## 24. Global SaaS Scalability

FUTURE DEVELOPMENT:

To evolve into a global SaaS platform, PrioryxAI would need:

- Horizontal scaling for API workloads.
- CDN-backed static assets and edge caching.
- Redis caching for hot data and rate limits.
- Database indexing, query audits, and read replicas.
- Background workers for syncs, scraping, AI jobs, score recomputation, and notifications.
- Queues for long-running external integrations and AI tasks.
- API rate limiting per user, IP, route, and integration.
- Centralized logging.
- Metrics and dashboards.
- Distributed tracing.
- AI request management, model routing, retries, and cost controls.
- Regional deployments for latency and data residency.
- Disaster recovery, backups, restore drills, and incident processes.

CURRENT status:

- The repository already uses Supabase, Redis/Upstash, QStash, route-level caching, and server-side integration boundaries.
- It does not currently prove globally distributed infrastructure, read replicas, formal disaster recovery, or full observability.

## 25. Privacy and Compliance for Global Expansion

FUTURE DEVELOPMENT:

International expansion will require privacy and compliance work such as:

- GDPR readiness for EU users.
- Compliance with regional privacy laws.
- Clear consent for data ingestion from coding platforms, resumes, and academic documents.
- Data deletion and export workflows.
- Student-data handling policies.
- Additional protection if minors or younger students use the platform.
- Data residency controls.
- AI transparency: explaining what data is used, why recommendations were generated, and how users can opt out.
- Secure retention policies for uploaded resumes, files, assistant messages, and external integration data.

CURRENT status:

- The repository shows authentication, RLS policies, and environment-based secret management.
- It does not show formal compliance certification or a complete privacy/compliance operating model.

## 26. Long-Term Product Vision

PrioryxAI can evolve in stages:

1. Student productivity platform: collect tasks, exams, jobs, coding progress, profile, and project data.
2. AI-powered student intelligence platform: explain scores, generate plans, analyze resumes, recommend problems, and summarize priorities.
3. Personal AI decision engine: continuously adapt actions to deadlines, skills, goals, workload, and outcomes.
4. Global AI career and education operating system: support international academic systems, local career markets, mobile-first usage, and region-aware AI planning.

The current implementation is strongest as a web-first command center with hybrid AI features. Its future opportunity is to become the intelligent layer that connects every major student signal and converts it into focused action.

## 27. Development Roadmap

### Phase 1 - Current Foundation

CURRENT:

- Next.js web app.
- Supabase Auth/PostgreSQL/Storage.
- Task/feed/dashboard system.
- AI assistant.
- Resume, GitHub, LeetCode, HackerRank, schedule, job, YouTube, project, readiness score, and MCP features.

User benefit:

- One place to manage and understand academic, career, coding, and opportunity signals.

### Phase 2 - Product Stabilization

FUTURE:

- Expand tests for API routes, scoring, collectors, and file extraction.
- Improve observability and error reporting.
- Harden service-role usage.
- Improve retry behavior for external APIs.
- Add stronger admin tooling and data-quality checks.

User benefit:

- More reliable syncs, more predictable recommendations, and fewer silent failures.

### Phase 3 - Advanced AI

FUTURE:

- RAG, embeddings, semantic search, personalized recommendation models, feedback loops, advanced planner memory, and better evaluation.

User benefit:

- More relevant plans, opportunity ranking, learning paths, and project recommendations.

### Phase 4 - Mobile

FUTURE:

- Complete Android and iOS apps.
- Push notifications, offline tasks, native assistant, mobile uploads, and deep links.

User benefit:

- PrioryxAI becomes useful at the moment students need reminders or quick decisions.

### Phase 5 - Internationalization

FUTURE:

- Configurable academic systems, localized career sources, languages, time zones, currencies, date formats, and regional opportunity adapters.

User benefit:

- Students outside India can use the same command-center concept with local context.

### Phase 6 - Global Infrastructure

FUTURE:

- Scalable API layer, queues, workers, read replicas, regional infrastructure, observability, backups, data residency, and compliance workflows.

User benefit:

- The product can support large cohorts, universities, and global users reliably.

### Phase 7 - Agentic Intelligence

FUTURE:

- Multi-agent workflows with explicit approvals, audit logs, planning memory, and tool permissions.

User benefit:

- PrioryxAI can help plan and prepare actions across academics, career, coding, and projects while keeping the student in control.

## 28. Competitive Positioning

PrioryxAI differs from:

- Calendars: calendars show time; PrioryxAI combines time with academic, career, coding, and opportunity context.
- Task managers: task managers store work; PrioryxAI ranks work using student-specific signals.
- Generic AI chatbots: chatbots answer prompts; PrioryxAI can use live user data and application tools.
- Job boards: job boards list roles; PrioryxAI connects opportunities to resume, skills, coding, and priorities.
- Coding trackers: trackers show solved problems; PrioryxAI connects coding progress to readiness, projects, and career planning.
- Academic management systems: academic systems show institutional data; PrioryxAI blends academic urgency with career execution.

Positioning statements:

- PrioryxAI turns student information overload into intelligent action.
- PrioryxAI is a unified intelligence layer for academic, coding, career, and opportunity decisions.
- PrioryxAI helps students answer the daily question: "What should I do next?"
- PrioryxAI connects deadlines, skills, projects, and opportunities into one decision system.

## 29. Technical Summary

| Area | CURRENT implementation |
| --- | --- |
| Frontend stack | Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Framer Motion, lucide-react, Recharts |
| Backend stack | Next.js API routes running Node.js runtime where required |
| Database | Supabase PostgreSQL with migrations and RLS policies |
| Authentication | Supabase Auth with SSR cookies and route-level auth checks |
| Storage | Supabase Storage paths used for uploaded/processed files |
| Cache/rate limits | Redis/Upstash utilities for feed cache, assistant rate limits, planner cache, sync markers |
| AI provider | OpenAI |
| AI models | GPT-4o and GPT-4o-mini |
| Integrations | GitHub GraphQL/webhooks, ALFA LeetCode API, HackerRank coding-profile service, Remotive, Arbeitnow, Apify/Internshala, YouTube Data API, Razorpay, QStash |
| Mobile status | Android native scaffold, iOS SwiftUI scaffold, Expo/React Native app folder, shared backend endpoint constants, Expo task mutations routed through backend APIs |
| Current AI capabilities | Assistant, tool calling, scoped unified context, bounded RAG retrieval context, priority planner, resume parsing/generation, schedule extraction, coding analysis, readiness explanation, project generation, MCP orchestration |
| Future AI architecture | Production RAG operations, trained personalized ranking, richer feedback loops, multi-agent workflows, semantic matching, adaptive scheduling |

## 30. Product Summary

PrioryxAI is an AI-powered student command center that brings academic deadlines, tasks, coding progress, resume intelligence, project development, jobs, internships, learning resources, and AI guidance into one place. It helps students move from scattered information to a prioritized plan of action.

The current implementation already includes a substantial web platform with Supabase persistence, AI assistant flows, hybrid prioritization, coding integrations, opportunity aggregation, resume intelligence, project generation, readiness scoring, and early mobile codebases. The future direction is a globally adaptable AI decision engine for education and career execution.

## 31. One-Line Description

PrioryxAI is an AI-powered student command center that transforms academic, coding, career, and opportunity signals into prioritized actions.

## 32. Short Description

PrioryxAI helps students manage academics, coding practice, projects, resumes, jobs, internships, and daily tasks from one intelligent dashboard. It uses Supabase-backed data, external integrations, deterministic scoring, and OpenAI-powered assistance to turn scattered student information into focused priorities and actionable next steps.

## 33. Medium Description

PrioryxAI is a web-first student productivity and decision-support platform. It combines academic schedules, exam deadlines, tasks, GitHub activity, LeetCode progress, HackerRank signals, resume analysis, project ideas, job opportunities, learning recommendations, and AI chat into a unified command center.

The current implementation uses Next.js, React, Supabase, Redis/Upstash, OpenAI, and several external APIs. It includes deterministic priority scoring, readiness scoring, AI-assisted daily planning, resume parsing, academic schedule extraction, coding-platform analysis, GitHub intelligence, job aggregation, and bounded tool-calling assistant behavior. Its long-term direction is to become a personalized AI decision engine that helps students choose what to do next across academics and career development.

## 34. Technical Description

PrioryxAI is implemented as a Next.js 14 App Router application with React 18, TypeScript, Tailwind CSS, and server-side API routes. Supabase provides authentication, PostgreSQL persistence, storage integration, and RLS-protected user data. Redis/Upstash is used for caching, rate limiting, daily counters, and sync markers. The backend integrates with GitHub GraphQL, ALFA LeetCode API, a HackerRank/coding-profile service, Remotive, Arbeitnow, Apify/Internshala, YouTube Data API, QStash, Razorpay, and OpenAI.

The AI layer uses GPT-4o and GPT-4o-mini for multiple application workflows: assistant responses, function/tool calling, priority planning, readiness-score explanation, resume parsing and SWOT generation, resume drafting, academic schedule extraction, LeetCode and HackerRank analysis, GitHub portfolio narrative, YouTube recommendation explanations, Project Foundry generation, and MCP tool orchestration. Deterministic logic remains important: readiness scoring is a pure weighted formula, GitHub and LeetCode have deterministic scoring components, feed ranking uses rule-based scoring, and the priority engine has a deterministic fallback.

The current architecture is hybrid rather than fully autonomous. It combines structured user data, external integration caches, feature extraction, deterministic scoring, LLM reasoning, bounded RAG retrieval, and dashboard/assistant presentation. The MCP and assistant layers include bounded tool-calling behavior, but the repository does not currently implement a continuous autonomous agent ecosystem or trained recommender model. The RAG/vector layer is a foundation that requires the Supabase migration and embedding credentials before semantic retrieval can operate in production.

Mobile work exists in Android, iOS, and Expo/React Native folders, but the web application is the most complete product surface today.

## 35. Future Vision Statement

PrioryxAI today is a serious web-first student command center with real implementations for tasks, academic extraction, AI assistance, coding integrations, resume intelligence, job aggregation, readiness scoring, project generation, and hybrid prioritization.

PrioryxAI can evolve into a global AI student intelligence platform. The next step is product stabilization: applying and validating the decision-engine migration, adding automated tests, improving observability, hardening security, and completing authenticated QA. After that, advanced AI can deepen semantic search, personalized ranking, feedback loops, skill graphs, adaptive scheduling, and approved agentic workflows.

Global expansion requires configurable academic systems, localized opportunity sources, time-zone and language awareness, regional career-market context, privacy controls, and scalable infrastructure. Android and iOS should become native clients over the same unified backend rather than separate logic silos.

The long-term vision is a personalized AI decision platform that continuously understands academic commitments, coding activity, projects, resume strength, internships, jobs, goals, and available time, then turns that understanding into clear daily and weekly action.
