-- Migration v4: Add cgpa column to users table
-- Run in Supabase Dashboard → SQL Editor → New query → paste → Run

ALTER TABLE users ADD COLUMN IF NOT EXISTS cgpa NUMERIC(3,1);

-- Constraint: CGPA must be between 0.0 and 10.0 (Indian 10-point scale)
-- Also covers 4.0 scale — values above 10 will be rejected
ALTER TABLE users ADD CONSTRAINT users_cgpa_range CHECK (cgpa IS NULL OR (cgpa >= 0 AND cgpa <= 10));
