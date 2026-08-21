-- Run this in Supabase SQL Editor after supabase-schema.sql
-- Dashboard → SQL Editor → New query → paste → Run

-- EMAIL AUTH AUDIT LOG
-- Tracks sign-in/sign-up events per user for security review.
-- Credentials (passwords) are NEVER stored here — Supabase Auth owns those in auth.users.
CREATE TABLE IF NOT EXISTS email_auth_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  event       TEXT NOT NULL CHECK (event IN ('signup', 'signin')),
  ip          TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_auth_log_user ON email_auth_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_auth_log_event ON email_auth_log(event, created_at DESC);

-- Only the service role (used by the API) can insert; users cannot read their own log
-- to prevent timing attacks that enumerate events.
ALTER TABLE email_auth_log ENABLE ROW LEVEL SECURITY;

-- No user-facing policy — the service role bypasses RLS entirely.
-- Admins can query via Supabase Dashboard or service role key.
