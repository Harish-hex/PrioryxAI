-- Phase 2: Readiness Score history table
-- Append-only: never UPDATE or DELETE rows.
-- Every recomputation inserts a new row so we get trend/delta data for free.

CREATE TABLE IF NOT EXISTS readiness_scores (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score          INTEGER     NOT NULL CHECK (score >= 0 AND score <= 100),
  breakdown      JSONB       NOT NULL DEFAULT '{}',
  score_version  INTEGER     NOT NULL DEFAULT 1,
  computed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast "latest score per user" queries
CREATE INDEX IF NOT EXISTS readiness_scores_user_computed
  ON readiness_scores (user_id, computed_at DESC);

-- RLS: users can only read their own scores
ALTER TABLE readiness_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own readiness scores"
  ON readiness_scores FOR SELECT
  USING (auth.uid() = user_id);

-- Service role (server-side) can insert on behalf of any user
CREATE POLICY "Service role insert readiness scores"
  ON readiness_scores FOR INSERT
  WITH CHECK (true);
