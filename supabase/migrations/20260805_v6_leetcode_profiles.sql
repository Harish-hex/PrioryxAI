-- Migration v6: LeetCode Profile Intelligence module tables
-- Run in Supabase Dashboard → SQL Editor → New query → paste → Run

-- ═══════════════════════════════════════════════════════════
-- 1. LEETCODE PROFILES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS leetcode_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  leetcode_username TEXT NOT NULL,
  profile_data JSONB,           -- LeetCodeProfile
  solved_data JSONB,            -- SolvedStats
  skill_stats JSONB,            -- SkillStats (topic-wise)
  contest_info JSONB,           -- ContestInfo
  contest_history JSONB,        -- ContestHistory[]
  calendar_data JSONB,          -- SubmissionCalendar
  language_stats JSONB,         -- LanguageStats
  badges JSONB,                 -- badges array
  placement_readiness_score INTEGER DEFAULT 0,
  ai_analysis JSONB,            -- AI-generated analysis cache
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_leetcode_profiles_user ON leetcode_profiles(user_id);

-- ═══════════════════════════════════════════════════════════
-- 2. PROBLEM RECOMMENDATIONS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS problem_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stream TEXT NOT NULL,          -- 'SDE' | 'ML' | 'DS' | 'CS_GENERAL' | 'FRONTEND'
  priority TEXT NOT NULL,        -- 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  topic TEXT NOT NULL,
  problem_slug TEXT NOT NULL,
  problem_title TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  why_this_problem TEXT,        -- AI-generated explanation
  company_tags TEXT[],
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_problem_recommendations_user ON problem_recommendations(user_id);

-- ═══════════════════════════════════════════════════════════
-- 3. CODING STREAKS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS coding_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  problems_solved INTEGER DEFAULT 0,
  streak_maintained BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_coding_streaks_user ON coding_streaks(user_id);

-- ═══════════════════════════════════════════════════════════
-- 4. LEETCODE AI ANALYSES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS leetcode_ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type TEXT,           -- 'full' | 'skill_gap' | 'contest' | 'roadmap'
  analysis_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leetcode_ai_analyses_user ON leetcode_ai_analyses(user_id);

-- ═══════════════════════════════════════════════════════════
-- 5. RLS POLICIES
-- ═══════════════════════════════════════════════════════════

ALTER TABLE leetcode_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE leetcode_ai_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own leetcode profile" ON leetcode_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own recommendations" ON problem_recommendations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own streaks" ON coding_streaks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can read own analyses" ON leetcode_ai_analyses
  FOR ALL USING (auth.uid() = user_id);
