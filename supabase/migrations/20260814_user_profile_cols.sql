-- ═══════════════════════════════════════════════════════════════
-- Migration: User Profile Columns for Onboarding
-- Run this in Supabase SQL Editor
-- Created: 2026-08-14
-- ═══════════════════════════════════════════════════════════════

-- Add onboarding/profile columns to the Supabase Auth `users` table
-- These are required by the onboarding flow (Step 1) and /api/user/profile PATCH
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS college TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS semester INTEGER CHECK (semester >= 1 AND semester <= 12),
  ADD COLUMN IF NOT EXISTS subjects TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS github_username TEXT,
  ADD COLUMN IF NOT EXISTS cgpa NUMERIC(4,2) CHECK (cgpa >= 0 AND cgpa <= 10),
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- Index for username lookups (public profile pages)
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Ensure RLS allows users to read/update their own row
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
