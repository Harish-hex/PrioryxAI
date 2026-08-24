-- PrioryxAI GitHub Intelligence + Peer Collaboration Migration
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS github_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  repo_name TEXT NOT NULL,
  total_score INTEGER NOT NULL DEFAULT 0,
  grade TEXT NOT NULL DEFAULT 'F',
  dimensions JSONB DEFAULT '{}',
  weaknesses JSONB DEFAULT '[]',
  strengths JSONB DEFAULT '[]',
  career_relevance JSONB DEFAULT '{}',
  analysed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, repo_name)
);

ALTER TABLE github_analysis ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own github analysis') THEN
    DROP POLICY IF EXISTS "Users read own github analysis" ON github_analysis;
    CREATE POLICY "Users read own github analysis" ON github_analysis FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS github_priority_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  repo_name TEXT NOT NULL,
  repo_url TEXT,
  action_title TEXT NOT NULL,
  action_description TEXT,
  weakness_category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  effort TEXT NOT NULL DEFAULT 'half_day',
  estimated_minutes INTEGER DEFAULT 30,
  impact_score INTEGER DEFAULT 0,
  impact_areas JSONB DEFAULT '[]',
  ai_suggested_commands TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE github_priority_actions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own github actions') THEN
    DROP POLICY IF EXISTS "Users manage own github actions" ON github_priority_actions;
    CREATE POLICY "Users manage own github actions" ON github_priority_actions FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS peer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  college TEXT,
  stream TEXT,
  target_companies TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  placement_score INTEGER DEFAULT 0,
  is_discoverable BOOLEAN DEFAULT TRUE,
  connect_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE peer_profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read discoverable peer profiles') THEN
    DROP POLICY IF EXISTS "Public read discoverable peer profiles" ON peer_profiles;
    CREATE POLICY "Public read discoverable peer profiles" ON peer_profiles FOR SELECT USING (is_discoverable = true);
    DROP POLICY IF EXISTS "Users manage own peer profile" ON peer_profiles;
    CREATE POLICY "Users manage own peer profile" ON peer_profiles FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS peer_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, receiver_id)
);

ALTER TABLE peer_connections ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users see their peer connections') THEN
    DROP POLICY IF EXISTS "Users see their peer connections" ON peer_connections;
    CREATE POLICY "Users see their peer connections" ON peer_connections FOR ALL USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_github_analysis_user ON github_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_github_actions_user_impact ON github_priority_actions(user_id, impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_peer_profiles_connect_code ON peer_profiles(connect_code);
