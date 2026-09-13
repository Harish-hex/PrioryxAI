-- Backfill the new PrioryxAI spec tables from existing data.
--
-- Idempotent: every insert uses ON CONFLICT DO NOTHING keyed on the new
-- tables' unique constraints, so re-running this migration is a no-op.
-- Source tables (users, priority_tasks, readiness_scores, github_analysis,
-- leetcode_profiles, user_resumes, opportunities) are read-only here -
-- nothing is deleted or altered on them.

-- profiles <- users
insert into public.profiles (id, email, full_name, username, avatar_url, college, target_companies, country, created_at)
select u.id, u.email, u.name, u.username, u.avatar_url, u.college, u.target_companies, coalesce(u.country, 'IN'), u.created_at
from public.users u
on conflict (id) do nothing;

-- career_graph <- users + github_analysis + leetcode_profiles + user_resumes + readiness_scores
with github_agg as (
  select
    user_id,
    max(total_score) as health_score,
    jsonb_agg(jsonb_build_object(
      'repo_name', repo_name, 'total_score', total_score, 'grade', grade,
      'dimensions', dimensions, 'strengths', strengths, 'weaknesses', weaknesses
    )) as data,
    max(analysed_at) as last_synced_at
  from public.github_analysis
  group by user_id
),
latest_score as (
  select distinct on (user_id) user_id, score, breakdown, computed_at
  from public.readiness_scores
  order by user_id, computed_at desc
)
insert into public.career_graph (
  user_id, github_username, github_health_score, github_data, github_last_synced_at,
  leetcode_username, dsa_score, dsa_data,
  resume_score, resume_data,
  readiness_score, score_breakdown, score_last_calculated_at
)
select
  u.id,
  u.github_username,
  ga.health_score,
  coalesce(ga.data, '[]'::jsonb),
  ga.last_synced_at,
  lp.leetcode_username,
  lp.placement_readiness_score,
  coalesce(lp.profile_data, '{}'::jsonb),
  ur.ats_score,
  coalesce(ur.parsed_data, '{}'::jsonb),
  ls.score,
  coalesce(ls.breakdown, '{}'::jsonb),
  ls.computed_at
from public.users u
left join github_agg ga on ga.user_id = u.id
left join public.leetcode_profiles lp on lp.user_id = u.id
left join public.user_resumes ur on ur.user_id = u.id
left join latest_score ls on ls.user_id = u.id
on conflict (user_id) do nothing;

-- score_history <- readiness_scores (full history, not just latest)
insert into public.score_history (user_id, readiness_score, score_breakdown, recorded_at)
select user_id, score, coalesce(breakdown, '{}'::jsonb), computed_at
from public.readiness_scores
on conflict do nothing;

-- actions <- priority_tasks
insert into public.actions (
  id, user_id, title, description, category, priority_rank, impact_score,
  effort_minutes, reasoning, status, completed_at, expires_at, created_at
)
select
  pt.id,
  pt.user_id,
  pt.title,
  pt.description,
  pt.category,
  coalesce(pt.urgency_score, 50),
  coalesce(pt.urgency_score, 50),
  pt.estimated_minutes,
  pt.why_now,
  case
    when pt.completed then 'completed'
    when pt.dismissed then 'skipped'
    else 'pending'
  end,
  pt.completed_at,
  pt.expires_at,
  pt.created_at
from public.priority_tasks pt
on conflict (id) do nothing;

-- jobs <- opportunities
insert into public.jobs (
  id, external_id, title, company, location, required_skills, preferred_skills,
  description, apply_url, deadline, source, metadata, fetched_at
)
select
  o.id,
  o.external_id,
  o.title,
  o.company,
  o.location,
  o.required_skills,
  o.preferred_skills,
  o.description,
  o.application_url,
  o.deadline,
  o.source_key,
  coalesce(o.raw_payload, '{}'::jsonb),
  coalesce(o.freshness_at, o.created_at)
from public.opportunities o
on conflict (id) do nothing;
