-- �������������������������������������������������������������������������������������������������������������������������������������
-- Migration: GitHub Analysis Table
-- Run this in Supabase SQL Editor
-- Created: 2026-08-14
-- Stores per-repo analysis data from the intelligence engine
-- �������������������������������������������������������������������������������������������������������������������������������������

CREATE TABLE IF NOT EXISTS github_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_name TEXT NOT NULL,
  total_score INTEGER DEFAULT 0,
  grade TEXT DEFAULT 'F',
  dimensions JSONB DEFAULT '{}',
  weaknesses JSONB DEFAULT '[]',
  strengths JSONB DEFAULT '[]',
  primary_language TEXT,
  career_relevance JSONB DEFAULT '{}',
  analysed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, repo_name)
);

ALTER TABLE github_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own github analysis" ON github_analysis;
CREATE POLICY "Users can read own github analysis"
  ON github_analysis FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Service role handles writes from analysis operations
DROP POLICY IF EXISTS "Service role manages github analysis" ON github_analysis;
CREATE POLICY "Service role manages github analysis"
  ON github_analysis FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_github_analysis_user ON github_analysis(user_id);