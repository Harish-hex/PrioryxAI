-- Migration v4: Add cgpa column to users table + contribution_days to github_cache
-- Run in Supabase Dashboard → SQL Editor → New query → paste → Run

ALTER TABLE users ADD COLUMN IF NOT EXISTS cgpa NUMERIC(3,1);

-- Constraint: CGPA must be between 0.0 and 10.0 (Indian 10-point scale)
-- Also covers 4.0 scale — values above 10 will be rejected
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_cgpa_range'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_cgpa_range CHECK (cgpa IS NULL OR (cgpa >= 0 AND cgpa <= 10));
  END IF;
END $$;

-- Add contribution_days to github_cache for real contribution graph on profile page
-- Stores array of {date, count} objects for the last 6 months (182 days)
ALTER TABLE github_cache ADD COLUMN IF NOT EXISTS contribution_days JSONB DEFAULT '[]';
