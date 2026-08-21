# Database Migrations

## Canonical Location

**All migrations live in `supabase/migrations/`** — this is the single source of truth.

Never create root-level `supabase-migration-*.sql` files again. Always add new migrations to `supabase/migrations/` following the naming convention below.

## Naming Convention

```
YYYYMMDD_<short_description>.sql
```

Examples:
- `20260816_performance_indexes.sql`
- `20260820_readiness_scores.sql`

Use `IF NOT EXISTS` / `IF EXISTS` guards so every migration is idempotent.

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
| `20260809_v11_resume_upload_cols.sql` | Resume upload columns on users |
| `20260809_v12_github_analysis_peer.sql` | github_analysis + peer collab tables |
| `20260810_dsa_questions.sql` | DSA questions bank |
| `20260810_peer_challenges.sql` | Peer challenge system |
| `20260811_github_intelligence_reports.sql` | GitHub intelligence reports |
| `20260811_priority_engine.sql` | Priority engine tables |
| `20260811_user_resumes.sql` | User resumes table |
| `20260812_peer_collab_hardening.sql` | Peer collab RLS hardening |
| `20260812_peer_collab_system.sql` | Peer collaboration system |
| `20260812_production_fixes.sql` | Production bug fixes |
| `20260812_task7_fixes.sql` | Task 7 fixes |
| `20260814_assistant_messages.sql` | Assistant chat history |
| `20260814_coding_profiles.sql` | Coding profile tables |
| `20260814_github_analysis.sql` | GitHub analysis tables |
| `20260814_github_cache.sql` | GitHub cache table |
| `20260814_github_priority_actions.sql` | GitHub priority actions |
| `20260814_leetcode_tables.sql` | LeetCode tables update |
| `20260814_subscriptions_table.sql` | Subscriptions / billing |
| `20260814_tasks_priority_deadline.sql` | Task priority & deadline columns |
| `20260814_user_profile_cols.sql` | User profile columns |
| `20260816_performance_indexes.sql` | Performance indexes |

## Reference Schema Dumps

`docs/db/` contains **read-only reference** files:
- `supabase-schema-reference.sql` — initial full schema dump
- `supabase-email-auth-reference.sql` — email auth audit log reference

Do **not** run these via `supabase db push` — they are documentation only.
