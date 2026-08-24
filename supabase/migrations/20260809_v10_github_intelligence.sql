CREATE TABLE IF NOT EXISTS github_intelligence_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  github_username TEXT,
  report JSONB DEFAULT '{}',
  portfolio_score INTEGER DEFAULT 0,
  profile_strength TEXT,
  total_repos INTEGER DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE github_intelligence_reports ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own github report') THEN
    DROP POLICY IF EXISTS "Users manage own github report" ON github_intelligence_reports;
    CREATE POLICY "Users manage own github report" ON github_intelligence_reports FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
