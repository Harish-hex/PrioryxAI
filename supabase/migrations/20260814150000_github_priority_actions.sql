-- �������������������������������������������������������������������������������������������������������������������������������������
-- Migration: GitHub Priority Actions Table
-- Run this in Supabase SQL Editor
-- Created: 2026-08-14
-- Stores actionable fix items from GitHub intelligence analysis
-- �������������������������������������������������������������������������������������������������������������������������������������

CREATE TABLE IF NOT EXISTS github_priority_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_name TEXT NOT NULL,
  repo_url TEXT DEFAULT '',
  action_title TEXT NOT NULL,
  action_description TEXT DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  effort TEXT NOT NULL DEFAULT 'half_day' CHECK (effort IN ('quick_win', 'half_day', 'full_day', 'multi_day')),
  estimated_minutes INTEGER DEFAULT 120,
  impact_score INTEGER DEFAULT 10,
  ai_suggested_commands TEXT DEFAULT '',
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE github_priority_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own github actions" ON github_priority_actions;
CREATE POLICY "Users can read own github actions"
  ON github_priority_actions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own github actions" ON github_priority_actions;
CREATE POLICY "Users can update own github actions"
  ON github_priority_actions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role handles inserts from analysis
DROP POLICY IF EXISTS "Service role manages github actions" ON github_priority_actions;
CREATE POLICY "Service role manages github actions"
  ON github_priority_actions FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_github_actions_user ON github_priority_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_github_actions_priority ON github_priority_actions(user_id, priority, completed);