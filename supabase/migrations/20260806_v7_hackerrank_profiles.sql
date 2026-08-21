-- Multi-platform coding profiles (HackerRank + bonus platforms)
CREATE TABLE IF NOT EXISTS multi_platform_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- HackerRank
  hackerrank_username TEXT,
  hackerrank_data JSONB,          -- HackerRankRawData
  hackerrank_analysis JSONB,      -- HRAnalyzedProfile
  hackerrank_score INTEGER DEFAULT 0,

  -- Bonus platforms (from same CPS service)
  codechef_username TEXT,
  codechef_data JSONB,
  gfg_username TEXT,
  gfg_data JSONB,
  codeforces_username TEXT,
  codeforces_data JSONB,

  -- AI analysis
  ai_analysis JSONB,              -- HRAIAnalysis
  hr_practice_recommendations JSONB,  -- HRPracticeRecommendation[]

  -- Metadata
  stream TEXT,
  target_companies TEXT[],
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- HR practice problem tracking
CREATE TABLE IF NOT EXISTS hr_practice_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,           -- e.g. "Problem Solving"
  subdomain TEXT,
  difficulty TEXT,
  problems_solved INTEGER DEFAULT 0,
  target_problems INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, domain, subdomain)
);

ALTER TABLE multi_platform_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_practice_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their multi-platform profiles"
  ON multi_platform_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own their HR practice progress"
  ON hr_practice_progress FOR ALL USING (auth.uid() = user_id);
