-- Migration: GitHub Intelligence Reports Table
-- Run in: Supabase SQL Editor

CREATE TABLE IF NOT EXISTS github_intelligence_reports (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  github_username TEXT,
  report JSONB NOT NULL DEFAULT '{}',
  portfolio_score INTEGER DEFAULT 0,
  profile_strength TEXT DEFAULT '',
  total_repos INTEGER DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE github_intelligence_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own github reports" ON github_intelligence_reports;
CREATE POLICY "Users can read own github reports"
  ON github_intelligence_reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Note: Inserts/Updates are done via service_role key in the API, so no INSERT/UPDATE policy is strictly needed for the client,
-- but adding it for completeness if the client ever writes directly.
DROP POLICY IF EXISTS "Users can write own github reports" ON github_intelligence_reports;
CREATE POLICY "Users can write own github reports"
  ON github_intelligence_reports FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
