# PrioryxAI

PrioryxAI is a Next.js 14 application for managing academic, project, and career work in one AI-assisted workspace. The current app includes authentication, an activity feed, assistant flows, onboarding, profile pages, settings, task management APIs, GitHub sync hooks, and payment/webhook endpoints.

## Stack

- Next.js 14 App Router
- React 18
- Tailwind CSS
- Supabase auth and data access
- OpenAI, Apify, Upstash, and Razorpay integrations

## Project Layout

```text
.
├── src/
│   ├── app/                  # App Router pages and API routes
│   ├── components/           # Dashboard, sidebar, assistant, profile UI
│   └── lib/                  # Supabase, AI, GitHub sync, scoring, security
├── supabase-schema.sql       # Base schema
├── supabase-migration-v2.sql # Additional migration work
├── DeadlineOS_PRD.docx       # Product requirement document
└── priorix_plan_final.md     # Planning and implementation notes
```

## Local Setup

```bash
npm install
npm run dev
```

The app runs on `http://localhost:3000`.

## Environment Variables

Create `.env.local` and provide the values used by the integrations in this app:

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

## Useful Commands

```bash
npm run dev
npm run build
npm run lint
```

## Notes

- `.gitignore` is configured to keep local secrets, build output, editor metadata, and unrelated local workspaces out of the repository.
- The shipped product copy in the app still uses the name `DeadlineOS`; only the repository is being organized under `PrioryxAI`.
