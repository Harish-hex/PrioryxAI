const { Client } = require('pg');

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || '';
if (!dbUrl) {
  console.error('Missing DIRECT_URL or DATABASE_URL environment variable');
  process.exit(1);
}

const migrationSql = `
-- Ensure table has all required columns
ALTER TABLE user_resumes
  ADD COLUMN IF NOT EXISTS raw_text TEXT,
  ADD COLUMN IF NOT EXISTS skill_entities JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS swot JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS parsed_data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS extraction_method TEXT DEFAULT 'text_extraction',
  ADD COLUMN IF NOT EXISTS ats_score INTEGER,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Ensure UNIQUE constraint on user_id for upsert to work:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_resumes_user_id_key'
      AND conrelid = 'user_resumes'::regclass
  ) THEN
    ALTER TABLE user_resumes
      ADD CONSTRAINT user_resumes_user_id_key UNIQUE (user_id);
    RAISE NOTICE 'Added unique constraint on user_id';
  ELSE
    RAISE NOTICE 'Unique constraint already exists';
  END IF;
END $$;

-- Ensure RLS policy allows insert AND update:
DROP POLICY IF EXISTS "Users can manage own resume" ON user_resumes;
CREATE POLICY "Users can manage own resume" ON user_resumes
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Also ensure profiles has the resume_uploaded column
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS resume_uploaded BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS resume_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS github_username TEXT;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS resume_uploaded BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS resume_uploaded_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS github_username TEXT;
  END IF;
END $$;
`;

async function runMigration() {
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    console.log('Connected to DB');
    const res = await client.query(migrationSql);
    console.log('Migration executed successfully:', res);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

runMigration();
