# Database Migrations

## Canonical Location

**All migrations live in `supabase/migrations/`** — this is the single source of truth.

Never create root-level `supabase-migration-*.sql` files again. Always add new migrations to `supabase/migrations/` following the naming convention below.

## Naming Convention

```
YYYYMMDD_<short_description>.sql
```

or, when a second migration is added on the same calendar day, append a two-digit
hour to keep the version number unique:

```
YYYYMMDDHH0000_<short_description>.sql
```

Examples:
- `20260816_performance_indexes.sql`
- `20260821_readiness_scores.sql`
- `20260809120000_v11_resume_upload_cols.sql` (second migration filed on 2026-08-09)

Use `IF NOT EXISTS` / `IF EXISTS` guards so every migration is idempotent. This
also applies to `CREATE POLICY`, which has no `IF NOT EXISTS` form in Postgres —
always precede it with `DROP POLICY IF EXISTS "<name>" ON <table>;`, and guard
`ADD CONSTRAINT` with a `pg_constraint` existence check in a `DO $$ ... $$` block.

**Why the timestamp suffix matters:** `supabase db push` derives each migration's
version number from the leading digits of its filename and records it in
`supabase_migrations.schema_migrations`. A bare `YYYYMMDD` prefix is only unique
per *day*, not per *file* — a second migration filed the same day collides with
the first one's version and `db push` fails with `duplicate key value violates
unique constraint "schema_migrations_pkey"`. On 2026-08-23 this repo discovered
that 31 of its 32 migrations (everything after `20260801`) had silently never
been applied to the live Supabase project — they were meant to be pasted into
the SQL Editor by hand and most never were. Re-applying them via `supabase db
push` surfaced this exact collision for every date with more than one file
(`20260809`, `20260810`, `20260811`, `20260812`, `20260814`), which is why the
first migration of each of those dates kept its bare-date name and the rest
were renamed with an hour suffix, in the order this table lists them.

Before adding a second migration on a date that already has one, check
`supabase migration list` (or this table) rather than assuming the bare date
is free.

## Chronological Order

| File | Content |
|------|---------|
| `20260801_v2_kanban_internshala.sql` | Kanban stage column, Internshala job fields |
| `20260802_v3_apify_id_uniqueness.sql` | Fix apify_id uniqueness to per-user |
| `20260803_v4_cgpa_github_days.sql` | CGPA column, contribution_days |
| `20260804_v5_ai_career_tables.sql` | AI career guidance platform tables |
| `20260805_v6_leetcode_profiles.sql` | LeetCode profile intelligence tables |
| `20260806_v7_hackerrank_profiles.sql` | HackerRank / multi-platform profiles |
| `20260807_v8_schedule_timetable.sql` | Weekly timetable + exam schedule tables |
| `20260808_v9_youtube_recommendations.sql` | YouTube recommendations table |
| `20260809_v10_github_intelligence.sql` | github_intelligence_reports table |
| `20260809120000_v11_resume_upload_cols.sql` | Resume upload columns on users |
| `20260809130000_v12_github_analysis_peer.sql` | github_analysis + peer collab tables |
| `20260810_dsa_questions.sql` | DSA questions bank |
| `20260810120000_peer_challenges.sql` | Peer challenge system |
| `20260811_github_intelligence_reports.sql` | GitHub intelligence reports |
| `20260811120000_priority_engine.sql` | Priority engine tables |
| `20260811130000_user_resumes.sql` | User resumes table |
| `20260812_peer_collab_hardening.sql` | Peer collab RLS hardening |
| `20260812120000_peer_collab_system.sql` | Peer collaboration system |
| `20260812130000_production_fixes.sql` | Production bug fixes |
| `20260812140000_task7_fixes.sql` | Task 7 fixes |
| `20260814_assistant_messages.sql` | Assistant chat history |
| `20260814120000_coding_profiles.sql` | Coding profile tables |
| `20260814130000_github_analysis.sql` | GitHub analysis tables |
| `20260814140000_github_cache.sql` | GitHub cache table |
| `20260814150000_github_priority_actions.sql` | GitHub priority actions |
| `20260814160000_leetcode_tables.sql` | LeetCode tables update |
| `20260814170000_subscriptions_table.sql` | Subscriptions / billing |
| `20260814180000_tasks_priority_deadline.sql` | Task priority & deadline columns |
| `20260814190000_user_profile_cols.sql` | User profile columns |
| `20260816_performance_indexes.sql` | Performance indexes |
| `20260821_readiness_scores.sql` | Readiness score persistence |
| `20260822_personalized_decision_foundation.sql` | Academic terms, courses, opportunities, RAG context documents, pgvector |

All 32 migrations above are applied to the live project (`wgvswyatbrdggrdadqss`)
as of 2026-08-23 — verified via `supabase migration list` (local/remote versions
match) and by probing every table through the REST API.

## Reference Schema Dumps

`docs/db/` contains **read-only reference** files:
- `supabase-schema-reference.sql` — initial full schema dump
- `supabase-email-auth-reference.sql` — email auth audit log reference

Do **not** run these via `supabase db push` — they are documentation only.
