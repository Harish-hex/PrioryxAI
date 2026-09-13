-- PrioryxAI spec schema (additive only).
--
-- This migration adds the new tables from the PrioryxAI monorepo-rebuild
-- spec: profiles, career_graph, actions, outcomes, integrations,
-- score_history, jobs, job_matches, institutions.
--
-- It does NOT touch, rename, or drop any of the 33 existing migrations'
-- tables (users, tasks, priority_tasks, readiness_scores, github_analysis,
-- leetcode_profiles, user_resumes, subscriptions, opportunities, etc).
-- Those keep serving the current app unchanged. A follow-up backfill
-- migration will copy data from them into the new tables below.
--
-- One exception: `subscriptions` already exists (razorpay_subscription_id,
-- status, current_period_end) and serves the same purpose as the spec's
-- `subscriptions` table, so rather than creating a colliding duplicate we
-- ALTER it to add the spec's extra columns (plan, institution_id).

-- ─────────────────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users primary key,
  email text unique not null,
  full_name text,
  username text unique,
  avatar_url text,
  college text,
  college_domain text,
  graduation_year int,
  degree text,
  branch text,
  country text default 'IN',
  career_goal text,
  target_companies text[],
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users own their profile" on public.profiles;
create policy "Users own their profile" on public.profiles
  for all using (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────
-- career_graph
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.career_graph (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,

  skills jsonb default '{}',

  github_username text,
  github_health_score int,
  github_data jsonb default '{}',
  github_last_synced_at timestamptz,

  leetcode_username text,
  hackerrank_username text,
  dsa_score int,
  dsa_data jsonb default '{}',

  academic_data jsonb default '{}',
  calendar_connected boolean default false,

  resume_url text,
  resume_parsed_at timestamptz,
  resume_skills text[],
  resume_score int,
  resume_data jsonb default '{}',

  career_state jsonb default '{}',
  behavior_data jsonb default '{}',

  readiness_score int,
  score_breakdown jsonb default '{}',
  score_last_calculated_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

alter table public.career_graph enable row level security;

drop policy if exists "Users own their career graph" on public.career_graph;
create policy "Users own their career graph" on public.career_graph
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- actions
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,

  title text not null,
  description text,
  category text not null,

  priority_rank int not null,
  impact_score int not null,
  effort_minutes int,

  reasoning text,
  evidence jsonb default '{}',

  status text default 'pending',

  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,

  metadata jsonb default '{}',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.actions enable row level security;

drop policy if exists "Users own their actions" on public.actions;
create policy "Users own their actions" on public.actions
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- outcomes
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,

  type text not null,
  company_name text,
  role text,
  status text,

  readiness_score_at_time int,
  actions_completed_before int,

  verified boolean default false,
  verification_data jsonb default '{}',

  occurred_at timestamptz,
  created_at timestamptz default now()
);

alter table public.outcomes enable row level security;

drop policy if exists "Users own their outcomes" on public.outcomes;
create policy "Users own their outcomes" on public.outcomes
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- integrations
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  provider text not null,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  provider_user_id text,
  provider_username text,
  scopes text[],
  is_active boolean default true,
  last_synced_at timestamptz,
  sync_data jsonb default '{}',
  created_at timestamptz default now(),
  unique(user_id, provider)
);

alter table public.integrations enable row level security;

drop policy if exists "Users own their integrations" on public.integrations;
create policy "Users own their integrations" on public.integrations
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- score_history
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.score_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  readiness_score int not null,
  score_breakdown jsonb not null,
  recorded_at timestamptz default now()
);

alter table public.score_history enable row level security;

drop policy if exists "Users own their score history" on public.score_history;
create policy "Users own their score history" on public.score_history
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- jobs (public read, spec's clean job model - separate from `opportunities`)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  title text not null,
  company text not null,
  location text,
  type text,
  required_skills text[],
  preferred_skills text[],
  description text,
  apply_url text,
  deadline timestamptz,
  source text,
  is_active boolean default true,
  metadata jsonb default '{}',
  fetched_at timestamptz default now()
);

alter table public.jobs enable row level security;

drop policy if exists "Jobs are public read" on public.jobs;
create policy "Jobs are public read" on public.jobs
  for select using (true);

-- ─────────────────────────────────────────────────────────────────────────
-- job_matches
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.job_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete cascade,
  match_score int not null,
  match_breakdown jsonb not null,
  gap_skills text[],
  days_to_ready int,
  applied boolean default false,
  applied_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, job_id)
);

alter table public.job_matches enable row level security;

drop policy if exists "Users own their job matches" on public.job_matches;
create policy "Users own their job matches" on public.job_matches
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- institutions (B2B tier, Phase 3 - added now since subscriptions
-- references it)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text unique,
  country text default 'IN',
  student_count int,
  plan text default 'free',
  plan_expires_at timestamptz,
  tpo_contact jsonb default '{}',
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.institutions enable row level security;

-- No public policy yet - institution-admin access is designed in Phase 3.
-- RLS is enabled with no policies, which defaults to fully closed (safe).

-- ─────────────────────────────────────────────────────────────────────────
-- subscriptions: extend existing table instead of creating a duplicate
-- ─────────────────────────────────────────────────────────────────────────
alter table public.subscriptions
  add column if not exists plan text default 'free',
  add column if not exists institution_id uuid references public.institutions(id),
  add column if not exists current_period_start timestamptz;
