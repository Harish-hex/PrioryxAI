-- �����������������������������������������������������������������������������������������������������������������������������������������
-- Migration: Coding Profiles Table (Research Agent)
-- Run this in Supabase SQL Editor
-- Created: 2026-08-14
-- Note: This mirrors the research-agent.ts schema. The connect routes also
-- write to user_coding_profiles (one row per platform). Both tables coexist.
-- �����������������������������������������������������������������������������������������������������������������������������������������

CREATE TABLE IF NOT EXISTS coding_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  leetcode_username TEXT,
  leetcode_stats JSONB DEFAULT '{}',
  hackerrank_username TEXT,
  hackerrank_stats JSONB DEFAULT '{}',
  weak_topics TEXT[] DEFAULT '{}',
  placement_readiness_score INTEGER DEFAULT 0,
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE coding_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own coding profile" ON coding_profiles;
CREATE POLICY "Users can read own coding profile"
  ON coding_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own coding profile" ON coding_profiles;
CREATE POLICY "Users can insert own coding profile"
  ON coding_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own coding profile" ON coding_profiles;
CREATE POLICY "Users can update own coding profile"
  ON coding_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role handles writes from AI agents
DROP POLICY IF EXISTS "Service role manages coding profiles" ON coding_profiles;
CREATE POLICY "Service role manages coding profiles"
  ON coding_profiles FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_coding_profiles_user ON coding_profiles(user_id);