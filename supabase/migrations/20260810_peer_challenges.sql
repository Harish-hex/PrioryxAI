-- ════════════════════════════════════════════════════
-- Migration: Peer Challenges + Connect Codes
-- ════════════════════════════════════════════════════

-- Peer profiles (connect codes)
CREATE TABLE IF NOT EXISTS peer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  connect_code TEXT UNIQUE NOT NULL,
  display_name TEXT,
  skills TEXT[] DEFAULT '{}',
  stream TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE peer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "peer_profiles_owner"
  ON peer_profiles FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "peer_profiles_read_others"
  ON peer_profiles FOR SELECT
  USING (true); -- anyone authenticated can look up by connect_code

-- Peer connections
CREATE TABLE IF NOT EXISTS peer_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_a, user_b)
);

ALTER TABLE peer_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "peer_connections_owner"
  ON peer_connections FOR ALL
  USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Peer challenges
CREATE TABLE IF NOT EXISTS peer_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT DEFAULT 'problem',
  -- 'problem': solve a LeetCode problem
  -- 'streak': maintain coding streak for N days
  -- 'badge': earn a HackerRank badge
  target TEXT,
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  -- pending | accepted | in_progress | completed | expired
  creator_completed BOOLEAN DEFAULT FALSE,
  opponent_completed BOOLEAN DEFAULT FALSE,
  creator_proof TEXT,
  opponent_proof TEXT,
  winner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE peer_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "peer_challenges_participants"
  ON peer_challenges FOR ALL
  USING (auth.uid() = creator_id OR auth.uid() = opponent_id);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS peer_challenges_creator_idx ON peer_challenges(creator_id);
CREATE INDEX IF NOT EXISTS peer_challenges_opponent_idx ON peer_challenges(opponent_id);
CREATE INDEX IF NOT EXISTS peer_profiles_code_idx ON peer_profiles(connect_code);
