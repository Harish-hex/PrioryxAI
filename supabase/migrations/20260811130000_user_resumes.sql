-- ── 1. Ensure user_resumes has all needed columns ────────────
CREATE TABLE IF NOT EXISTS user_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_text TEXT DEFAULT '',
  skill_entities JSONB DEFAULT '{}',
  swot JSONB DEFAULT '{}',
  parsed_data JSONB DEFAULT '{}',
  extraction_method TEXT DEFAULT 'text_extraction',
  ats_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add any missing columns to existing table
ALTER TABLE user_resumes
  ADD COLUMN IF NOT EXISTS raw_text TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS skill_entities JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS swot JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS parsed_data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS extraction_method TEXT DEFAULT 'text_extraction',
  ADD COLUMN IF NOT EXISTS ats_score INTEGER,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ── 2. CRITICAL: Add UNIQUE constraint so upsert works ───────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_resumes_user_id_key'
      AND conrelid = 'user_resumes'::regclass
  ) THEN
    ALTER TABLE user_resumes
      ADD CONSTRAINT user_resumes_user_id_key UNIQUE (user_id);
    RAISE NOTICE 'Added UNIQUE constraint on user_id';
  ELSE
    RAISE NOTICE 'UNIQUE constraint already exists';
  END IF;
END $$;

-- ── 3. Fix RLS policies ──────────────────────────────────────
ALTER TABLE user_resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own resume" ON user_resumes;
DROP POLICY IF EXISTS "Users can manage own resume" ON user_resumes;
DROP POLICY IF EXISTS "Users can view own resume" ON user_resumes;
DROP POLICY IF EXISTS "Users can insert own resume" ON user_resumes;
DROP POLICY IF EXISTS "Users can update own resume" ON user_resumes;

-- Single policy covering all operations
CREATE POLICY "Users manage own resume"
  ON user_resumes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 4. Add resume_uploaded flag to users ──────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS resume_uploaded BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS resume_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stream TEXT DEFAULT 'Software Engineering',
  ADD COLUMN IF NOT EXISTS target_companies TEXT[] DEFAULT '{}';

-- ── 5. Ensure user_projects has all needed columns ───────────
CREATE TABLE IF NOT EXISTS user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  difficulty TEXT DEFAULT 'intermediate',
  estimated_weeks INTEGER DEFAULT 2,
  tech_stack TEXT[] DEFAULT '{}',
  skill_gaps_addressed TEXT[] DEFAULT '{}',
  why_this_project TEXT DEFAULT '',
  learning_outcomes TEXT[] DEFAULT '{}',
  phases JSONB DEFAULT '[]',
  current_phase INTEGER DEFAULT 1,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_projects
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'intermediate',
  ADD COLUMN IF NOT EXISTS estimated_weeks INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS why_this_project TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS learning_outcomes TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS phases JSONB DEFAULT '[]';

ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own projects" ON user_projects;
CREATE POLICY "Users manage own projects"
  ON user_projects FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
