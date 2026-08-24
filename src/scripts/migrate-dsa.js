// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Pool } = require('pg');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');

// Basic manual parsing of .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envFile.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
}

const sql = `
CREATE TABLE IF NOT EXISTS dsa_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'Medium',
  platform TEXT NOT NULL DEFAULT 'LeetCode',
  problem_url TEXT DEFAULT '',
  companies TEXT[] DEFAULT '{}',
  frequency INTEGER DEFAULT 0,
  acceptance_rate NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  is_important BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(title, platform)
);

CREATE TABLE IF NOT EXISTS dsa_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES dsa_questions(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'todo',
  solved_at TIMESTAMPTZ,
  time_taken_minutes INTEGER,
  notes TEXT,
  UNIQUE(user_id, question_id)
);

ALTER TABLE dsa_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dsa_progress ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read DSA questions" ON dsa_questions FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users own their DSA progress" ON dsa_progress FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS idx_dsa_topic ON dsa_questions(topic);
CREATE INDEX IF NOT EXISTS idx_dsa_difficulty ON dsa_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_dsa_important ON dsa_questions(is_important);
CREATE INDEX IF NOT EXISTS idx_dsa_progress_user ON dsa_progress(user_id, status);
`;

function normalizeDatabaseUrl(rawUrl) {
  const trimmed = rawUrl.trim();
  const protocolIndex = trimmed.indexOf('://');
  if (protocolIndex === -1) return trimmed;
  const authStart = protocolIndex + 3;
  const pathIndex = trimmed.indexOf('/', authStart);
  if (pathIndex === -1) return trimmed;
  const authSegment = trimmed.slice(authStart, pathIndex);
  const lastAtIndex = authSegment.lastIndexOf('@');
  const firstColonIndex = authSegment.indexOf(':');
  if (lastAtIndex === -1 || firstColonIndex === -1 || firstColonIndex > lastAtIndex) return trimmed;
  const username = authSegment.slice(0, firstColonIndex);
  const password = authSegment.slice(firstColonIndex + 1, lastAtIndex);
  const host = authSegment.slice(lastAtIndex + 1);
  return trimmed.slice(0, authStart) + encodeURIComponent(username) + ":" + encodeURIComponent(password) + "@" + host + trimmed.slice(pathIndex);
}

async function run() {
  const dbUrl = env.SUPABASE_DB_URL;
  if (!dbUrl) throw new Error('SUPABASE_DB_URL not set');
  const pool = new Pool({
    connectionString: normalizeDatabaseUrl(dbUrl),
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Executing migration...');
    await pool.query(sql);
    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

run();
