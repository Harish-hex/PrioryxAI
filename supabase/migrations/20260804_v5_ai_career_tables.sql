-- Migration v5: AI Career Guidance Platform tables
-- Run in Supabase Dashboard → SQL Editor → New query → paste → Run
-- Prerequisite: All previous migrations (v1–v4) must be applied first

-- ═══════════════════════════════════════════════════════════
-- 1. ALTER existing users table for career fields
-- ═══════════════════════════════════════════════════════════

ALTER TABLE users ADD COLUMN IF NOT EXISTS target_roles TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS target_companies TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS career_timeline TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_uploaded BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS coding_connected BOOLEAN DEFAULT FALSE;

-- ═══════════════════════════════════════════════════════════
-- 2. USER RESUMES — parsed resume data, SWOT, ATS scoring
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  raw_text TEXT,
  skill_entities JSONB DEFAULT '[]',
  swot JSONB DEFAULT '{}',
  ats_score INTEGER DEFAULT 0,
  verified_projects JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_resumes_user ON user_resumes(user_id);

ALTER TABLE user_resumes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_resumes: own rows" ON user_resumes;
CREATE POLICY "user_resumes: own rows" ON user_resumes
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_resumes: insert own" ON user_resumes;
CREATE POLICY "user_resumes: insert own" ON user_resumes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_resumes: update own" ON user_resumes;
CREATE POLICY "user_resumes: update own" ON user_resumes
  FOR UPDATE USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════
-- 3. USER PROJECTS — 9 foundry projects with phase tracking
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  skill_gaps_addressed TEXT[] DEFAULT '{}',
  difficulty TEXT CHECK (difficulty IN ('foundation','intermediate','advanced')),
  phases JSONB DEFAULT '[]',
  current_phase INTEGER DEFAULT 1 CHECK (current_phase >= 1 AND current_phase <= 6),
  completion_pct INTEGER DEFAULT 0 CHECK (completion_pct >= 0 AND completion_pct <= 100),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_projects_user ON user_projects(user_id);

ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_projects: own rows" ON user_projects;
CREATE POLICY "user_projects: own rows" ON user_projects
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_projects: insert own" ON user_projects;
CREATE POLICY "user_projects: insert own" ON user_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_projects: update own" ON user_projects;
CREATE POLICY "user_projects: update own" ON user_projects
  FOR UPDATE USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════
-- 4. PHASE SUBMISSIONS — phase gate deliverables + AI feedback
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS phase_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES user_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL CHECK (phase_number >= 1 AND phase_number <= 6),
  submission_text TEXT,
  ai_feedback TEXT,
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  passed BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phase_submissions_project ON phase_submissions(project_id, phase_number);
CREATE INDEX IF NOT EXISTS idx_phase_submissions_user ON phase_submissions(user_id);

ALTER TABLE phase_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "phase_submissions: own rows" ON phase_submissions;
CREATE POLICY "phase_submissions: own rows" ON phase_submissions
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "phase_submissions: insert own" ON phase_submissions;
CREATE POLICY "phase_submissions: insert own" ON phase_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════
-- 5. CODING PROFILES — LeetCode + HackerRank stats
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS coding_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  leetcode_username TEXT,
  hackerrank_username TEXT,
  leetcode_stats JSONB DEFAULT '{}',
  hackerrank_stats JSONB DEFAULT '{}',
  placement_readiness_score INTEGER DEFAULT 0 CHECK (
    placement_readiness_score >= 0 AND placement_readiness_score <= 100
  ),
  weak_topics TEXT[] DEFAULT '{}',
  last_synced TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_coding_profiles_user ON coding_profiles(user_id);

ALTER TABLE coding_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coding_profiles: own row" ON coding_profiles;
CREATE POLICY "coding_profiles: own row" ON coding_profiles
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "coding_profiles: insert own" ON coding_profiles;
CREATE POLICY "coding_profiles: insert own" ON coding_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "coding_profiles: update own" ON coding_profiles;
CREATE POLICY "coding_profiles: update own" ON coding_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════
-- 6. PROBLEM PROGRESS — individual problem tracking
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS problem_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('leetcode','hackerrank')),
  problem_id TEXT NOT NULL,
  problem_title TEXT,
  topic TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy','medium','hard')),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, platform, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_problem_progress_user ON problem_progress(user_id, platform);

ALTER TABLE problem_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "problem_progress: own rows" ON problem_progress;
CREATE POLICY "problem_progress: own rows" ON problem_progress
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "problem_progress: insert own" ON problem_progress;
CREATE POLICY "problem_progress: insert own" ON problem_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "problem_progress: update own" ON problem_progress;
CREATE POLICY "problem_progress: update own" ON problem_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════
-- 7. JOB APPLICATIONS — application tracker pipeline
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  jd_url TEXT,
  jd_text TEXT,
  match_score INTEGER DEFAULT 0 CHECK (match_score >= 0 AND match_score <= 100),
  status TEXT DEFAULT 'saved' CHECK (
    status IN ('saved','applied','interview','offer','rejected')
  ),
  applied_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_applications_user ON job_applications(user_id, status);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "job_applications: own rows" ON job_applications;
CREATE POLICY "job_applications: own rows" ON job_applications
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "job_applications: insert own" ON job_applications;
CREATE POLICY "job_applications: insert own" ON job_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "job_applications: update own" ON job_applications;
CREATE POLICY "job_applications: update own" ON job_applications
  FOR UPDATE USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════
-- 8. COLLAB SESSIONS — peer collaboration rooms
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS collab_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  peer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_type TEXT DEFAULT 'pair_programming',
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
  shared_notes TEXT DEFAULT '',
  project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collab_sessions_creator ON collab_sessions(creator_id);
CREATE INDEX IF NOT EXISTS idx_collab_sessions_peer ON collab_sessions(peer_id);

ALTER TABLE collab_sessions ENABLE ROW LEVEL SECURITY;
-- Both creator and peer can read/update their sessions
DROP POLICY IF EXISTS "collab_sessions: participant read" ON collab_sessions;
CREATE POLICY "collab_sessions: participant read" ON collab_sessions
  USING (auth.uid() = creator_id OR auth.uid() = peer_id);
DROP POLICY IF EXISTS "collab_sessions: creator insert" ON collab_sessions;
CREATE POLICY "collab_sessions: creator insert" ON collab_sessions
  FOR INSERT WITH CHECK (auth.uid() = creator_id);
DROP POLICY IF EXISTS "collab_sessions: participant update" ON collab_sessions;
CREATE POLICY "collab_sessions: participant update" ON collab_sessions
  FOR UPDATE USING (auth.uid() = creator_id OR auth.uid() = peer_id);
