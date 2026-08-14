-- �����������������������������������������������������������������������������������������������������������������������������������
-- Migration: GitHub Cache Table
-- Run this in Supabase SQL Editor
-- Created: 2026-08-14
-- Stores synced GitHub data for intelligence analysis and AI assistant context
-- �����������������������������������������������������������������������������������������������������������������������������������

CREATE TABLE IF NOT EXISTS github_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  repos JSONB DEFAULT '[]',
  languages JSONB DEFAULT '{}',
  last_commit_at TIMESTAMPTZ,
  streak_days INTEGER DEFAULT 0,
  health_score INTEGER DEFAULT 0,
  contribution_days JSONB DEFAULT '[]',
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE github_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own github cache" ON github_cache;
CREATE POLICY "Users can read own github cache"
  ON github_cache FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Service role handles writes from sync operations
DROP POLICY IF EXISTS "Service role manages github cache" ON github_cache;
CREATE POLICY "Service role manages github cache"
  ON github_cache FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_github_cache_user ON github_cache(user_id);