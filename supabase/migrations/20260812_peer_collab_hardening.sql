-- ════════════════════════════════════════════════════════════════
-- Peer Collab — hardening pass
-- Run in Supabase SQL Editor. Safe to re-run (idempotent).
--
-- Supersedes the ad-hoc version of this script. Two corrections were
-- required to make it execute at all:
--
--   1. `CREATE POLICY IF NOT EXISTS` is NOT valid Postgres — there is no
--      IF NOT EXISTS clause for policies. Using it aborts the whole script.
--      Replaced with DROP POLICY IF EXISTS + CREATE POLICY.
--
--   2. The display-name backfill selected from a `profiles` table. No
--      migration in this repo creates `profiles`, and the ensure-profile
--      route explicitly notes it does not exist. Referencing it raises
--      42P01 and aborts. Names now come from auth.users only.
-- ════════════════════════════════════════════════════════════════

-- ── Backfill placeholder display names ───────────────────────────
-- NB: `display_name IN (..., NULL)` never matches NULL — SQL three-valued
-- logic makes that comparison UNKNOWN. The IS NULL arm is required.
UPDATE peer_profiles pp
SET
  display_name = COALESCE(
    (SELECT split_part(au.email, '@', 1) FROM auth.users au WHERE au.id = pp.user_id),
    'User'
  ),
  avatar_initial = UPPER(LEFT(COALESCE(
    (SELECT split_part(au.email, '@', 1) FROM auth.users au WHERE au.id = pp.user_id),
    'U'
  ), 1))
WHERE display_name IN ('Anonymous', 'User', '')
   OR display_name IS NULL;

-- ── peer_connections: columns the API writes ─────────────────────
ALTER TABLE peer_connections
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS message TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS seen_by_receiver BOOLEAN DEFAULT FALSE;

-- ── Core tables (no-ops if 20260812_peer_collab_system.sql ran) ───
CREATE TABLE IF NOT EXISTS peer_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  challenge_type TEXT NOT NULL,
  target_value TEXT DEFAULT '',
  deadline TIMESTAMPTZ,
  stake TEXT DEFAULT 'Bragging rights',
  xp_reward INTEGER DEFAULT 50,
  status TEXT DEFAULT 'pending',
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

-- The legacy /collab/challenge route wrote a bare `target` column that the
-- schema never defined, so every insert through it failed. The route is
-- being removed; add the column defensively in case rows are mid-flight.
ALTER TABLE peer_challenges
  ADD COLUMN IF NOT EXISTS target_value TEXT DEFAULT '';

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

CREATE TABLE IF NOT EXISTS peer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  action_url TEXT DEFAULT '',
  related_id TEXT DEFAULT '',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS ──────────────────────────────────────────────────────────
ALTER TABLE peer_challenges    ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_xp            ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "challenges_own" ON peer_challenges;
CREATE POLICY "challenges_own" ON peer_challenges FOR ALL TO authenticated
  USING (auth.uid() = creator_id OR auth.uid() = opponent_id)
  WITH CHECK (auth.uid() = creator_id OR auth.uid() = opponent_id);

DROP POLICY IF EXISTS "xp_own" ON peer_xp;
CREATE POLICY "xp_own" ON peer_xp FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "xp_friends" ON peer_xp;
CREATE POLICY "xp_friends" ON peer_xp FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM peer_connections pc WHERE pc.status = 'accepted'
    AND ((pc.requester_id = auth.uid() AND pc.receiver_id = user_id)
      OR (pc.receiver_id = auth.uid() AND pc.requester_id = user_id))
  ));

DROP POLICY IF EXISTS "notifications_own" ON peer_notifications;
CREATE POLICY "notifications_own" ON peer_notifications FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Indexes ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_peer_connections_receiver  ON peer_connections(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_peer_connections_requester ON peer_connections(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_peer_challenges_users      ON peer_challenges(creator_id, opponent_id, status);
CREATE INDEX IF NOT EXISTS idx_peer_notifications_user    ON peer_notifications(user_id, read, created_at DESC);

-- ── Seed XP rows for existing users ──────────────────────────────
INSERT INTO peer_xp (user_id, total_xp, level)
SELECT id, 0, 1 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- ── De-duplicate connections, then enforce one pair per couple ────
-- The connect route's duplicate check uses .maybeSingle(), which THROWS
-- when more than one row matches — so duplicates break new connections
-- entirely. Clean up before adding the constraint.
DELETE FROM peer_connections a USING peer_connections b
WHERE a.id > b.id AND (
  (a.requester_id = b.requester_id AND a.receiver_id = b.receiver_id) OR
  (a.requester_id = b.receiver_id  AND a.receiver_id = b.requester_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS peer_connections_pair_unique
ON peer_connections (
  LEAST(requester_id::text, receiver_id::text),
  GREATEST(requester_id::text, receiver_id::text)
);

-- ── Verify ───────────────────────────────────────────────────────
SELECT display_name, connect_code FROM peer_profiles LIMIT 10;
SELECT COUNT(*) AS pending FROM peer_connections WHERE status = 'pending';
SELECT 'peer_challenges' AS tbl, COUNT(*) FROM peer_challenges
UNION ALL SELECT 'peer_xp', COUNT(*) FROM peer_xp
UNION ALL SELECT 'peer_notifications', COUNT(*) FROM peer_notifications;
