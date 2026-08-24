-- ════════════════════════════════════════════════════
-- Migration: Peer Challenges + Connect Codes
-- ════════════════════════════════════════════════════

-- Peer profiles (connect codes)
DROP TABLE IF EXISTS peer_profiles CASCADE;
CREATE TABLE IF NOT EXISTS peer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT NOT NULL DEFAULT 'Anonymous',
  avatar_initial TEXT DEFAULT 'A',
  college TEXT DEFAULT '',
  stream TEXT DEFAULT 'Software Engineering',
  target_companies TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  placement_score INTEGER DEFAULT 0,
  is_discoverable BOOLEAN DEFAULT TRUE,
  connect_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE peer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read peer profiles" ON peer_profiles;
CREATE POLICY "Anyone authenticated can read peer profiles"
  ON peer_profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own peer profile" ON peer_profiles;
CREATE POLICY "Users can insert own peer profile"
  ON peer_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own peer profile" ON peer_profiles;
CREATE POLICY "Users can update own peer profile"
  ON peer_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own peer profile" ON peer_profiles;
CREATE POLICY "Users can delete own peer profile"
  ON peer_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Peer connections
DROP TABLE IF EXISTS peer_connections CASCADE;
CREATE TABLE IF NOT EXISTS peer_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  message TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, receiver_id)
);

ALTER TABLE peer_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own connections" ON peer_connections;
CREATE POLICY "Users manage own connections"
  ON peer_connections FOR ALL
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = receiver_id);

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

DROP POLICY IF EXISTS "peer_challenges_participants" ON peer_challenges;
CREATE POLICY "peer_challenges_participants"
  ON peer_challenges FOR ALL
  USING (auth.uid() = creator_id OR auth.uid() = opponent_id);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS peer_challenges_creator_idx ON peer_challenges(creator_id);
CREATE INDEX IF NOT EXISTS peer_challenges_opponent_idx ON peer_challenges(opponent_id);
CREATE INDEX IF NOT EXISTS peer_profiles_code_idx ON peer_profiles(connect_code);
