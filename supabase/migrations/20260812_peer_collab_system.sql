-- ════════════════════════════════════════════════════════════════
-- Migration: Complete Peer Collaboration System
-- Run this in Supabase SQL Editor
-- ════════════════════════════════════════════════════════════════

-- ── Fix peer_profiles: ensure display_name comes from profiles ──
UPDATE peer_profiles pp
SET display_name = COALESCE(
  (SELECT p.display_name FROM profiles p WHERE p.id = pp.user_id),
  (SELECT split_part(au.email, '@', 1)
   FROM auth.users au WHERE au.id = pp.user_id),
  'User'
),
avatar_initial = UPPER(LEFT(COALESCE(
  (SELECT p.display_name FROM profiles p WHERE p.id = pp.user_id),
  (SELECT split_part(au.email, '@', 1)
   FROM auth.users au WHERE au.id = pp.user_id),
  'U'
), 1))
WHERE display_name = 'Anonymous' OR display_name = 'User' OR display_name IS NULL;

-- ── peer_connections: add missing columns ────────────────────────
ALTER TABLE peer_connections
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS seen_by_receiver BOOLEAN DEFAULT FALSE;

-- Make sure message column exists
ALTER TABLE peer_connections
  ADD COLUMN IF NOT EXISTS message TEXT DEFAULT '';

-- ── peer_challenges table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS peer_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  challenge_type TEXT NOT NULL,
  -- 'leetcode_duel' | 'streak_war' | 'badge_race' | 'solve_count' | 'project_phase'

  target_value TEXT DEFAULT '',
  deadline TIMESTAMPTZ,
  stake TEXT DEFAULT 'Bragging rights',
  xp_reward INTEGER DEFAULT 50,

  status TEXT DEFAULT 'pending',
  -- pending | accepted | in_progress | completed | expired | declined

  creator_completed BOOLEAN DEFAULT FALSE,
  opponent_completed BOOLEAN DEFAULT FALSE,
  creator_value TEXT DEFAULT '',
  opponent_value TEXT DEFAULT '',
  winner_id UUID REFERENCES auth.users(id),
  result_description TEXT DEFAULT '',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  CONSTRAINT no_self_challenge CHECK (creator_id != opponent_id)
);

-- ── peer_xp table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS peer_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  challenges_won INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,
  win_streak INTEGER DEFAULT 0,
  longest_win_streak INTEGER DEFAULT 0,
  badges_earned TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── challenge_messages table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS challenge_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES peer_challenges(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── peer_notifications table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS peer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  -- 'connection_request' | 'connection_accepted' | 'challenge_received'
  -- | 'challenge_accepted' | 'challenge_completed' | 'challenge_won'
  -- | 'challenge_lost' | 'xp_earned'
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  action_url TEXT DEFAULT '',
  related_id TEXT DEFAULT '',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS Policies ─────────────────────────────────────────────────
ALTER TABLE peer_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own challenges" ON peer_challenges;
CREATE POLICY "Users see own challenges"
  ON peer_challenges FOR ALL TO authenticated
  USING (auth.uid() = creator_id OR auth.uid() = opponent_id)
  WITH CHECK (auth.uid() = creator_id OR auth.uid() = opponent_id);

DROP POLICY IF EXISTS "Users see own XP" ON peer_xp;
CREATE POLICY "Users see own XP"
  ON peer_xp FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Friends can see each other XP" ON peer_xp;
CREATE POLICY "Friends can see each other XP"
  ON peer_xp FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM peer_connections pc
      WHERE pc.status = 'accepted'
        AND (
          (pc.requester_id = auth.uid() AND pc.receiver_id = user_id) OR
          (pc.receiver_id = auth.uid() AND pc.requester_id = user_id)
        )
    )
  );

DROP POLICY IF EXISTS "Challenge participants see messages" ON challenge_messages;
CREATE POLICY "Challenge participants see messages"
  ON challenge_messages FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM peer_challenges pc
      WHERE pc.id = challenge_id
        AND (pc.creator_id = auth.uid() OR pc.opponent_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users see own notifications" ON peer_notifications;
CREATE POLICY "Users see own notifications"
  ON peer_notifications FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Indexes ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_peer_connections_receiver
  ON peer_connections(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_peer_connections_requester
  ON peer_connections(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_peer_challenges_users
  ON peer_challenges(creator_id, opponent_id, status);
CREATE INDEX IF NOT EXISTS idx_peer_notifications_user
  ON peer_notifications(user_id, read, created_at DESC);

-- ── Initialize XP for existing users ─────────────────────────────
INSERT INTO peer_xp (user_id, total_xp, level)
SELECT id, 0, 1 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- ── Verify ───────────────────────────────────────────────────────
SELECT 'peer_profiles' as tbl, COUNT(*) FROM peer_profiles
UNION ALL
SELECT 'peer_connections', COUNT(*) FROM peer_connections
UNION ALL
SELECT 'peer_challenges', COUNT(*) FROM peer_challenges
UNION ALL
SELECT 'peer_xp', COUNT(*) FROM peer_xp
UNION ALL
SELECT 'peer_notifications', COUNT(*) FROM peer_notifications;
