-- Migration: LeetCode Tables
-- Run in: Supabase SQL Editor
-- Created: 2026-08-14
-- Stores LeetCode profile data, AI analyses, and problem recommendations

-- 1. LeetCode Profiles Table
CREATE TABLE IF NOT EXISTS leetcode_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  leetcode_username TEXT NOT NULL,
  profile_data JSONB DEFAULT '{}',
  solved_data JSONB DEFAULT '{}',
  skill_stats JSONB DEFAULT '{}',
  contest_info JSONB DEFAULT '{}',
  contest_history JSONB DEFAULT '[]',
  calendar_data JSONB DEFAULT '{}',
  language_stats JSONB DEFAULT '{}',
  badges JSONB DEFAULT '[]',
  ai_analysis JSONB DEFAULT '{}',
  placement_readiness_score INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leetcode_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own leetcode profile" ON leetcode_profiles;
CREATE POLICY "Users can read own leetcode profile"
  ON leetcode_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can write own leetcode profile" ON leetcode_profiles;
CREATE POLICY "Users can write own leetcode profile"
  ON leetcode_profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role handles writes from sync operations
DROP POLICY IF EXISTS "Service role manages leetcode profiles" ON leetcode_profiles;
CREATE POLICY "Service role manages leetcode profiles"
  ON leetcode_profiles FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_leetcode_profiles_user ON leetcode_profiles(user_id);

-- 2. LeetCode AI Analyses Table
CREATE TABLE IF NOT EXISTS leetcode_ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL DEFAULT 'full',
  analysis_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leetcode_ai_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own leetcode analyses" ON leetcode_ai_analyses;
CREATE POLICY "Users can read own leetcode analyses"
  ON leetcode_ai_analyses FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Service role handles writes from analysis operations
DROP POLICY IF EXISTS "Service role manages leetcode analyses" ON leetcode_ai_analyses;
CREATE POLICY "Service role manages leetcode analyses"
  ON leetcode_ai_analyses FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_leetcode_analyses_user ON leetcode_ai_analyses(user_id);

-- 3. Problem Recommendations Table
CREATE TABLE IF NOT EXISTS problem_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stream TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  topic TEXT NOT NULL,
  problem_slug TEXT NOT NULL,
  problem_title TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  why_this_problem TEXT DEFAULT '',
  company_tags TEXT[] DEFAULT '{}',
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, problem_slug)
);

ALTER TABLE problem_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own problem recommendations" ON problem_recommendations;
CREATE POLICY "Users can read own problem recommendations"
  ON problem_recommendations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own problem recommendations" ON problem_recommendations;
CREATE POLICY "Users can update own problem recommendations"
  ON problem_recommendations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role handles writes from recommendation generation
DROP POLICY IF EXISTS "Service role manages problem recommendations" ON problem_recommendations;
CREATE POLICY "Service role manages problem recommendations"
  ON problem_recommendations FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_problem_recommendations_user ON problem_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_problem_recommendations_priority ON problem_recommendations(user_id, priority, completed);