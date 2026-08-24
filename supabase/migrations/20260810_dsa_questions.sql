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

-- User progress on DSA questions
CREATE TABLE IF NOT EXISTS dsa_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES dsa_questions(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'todo', -- todo | attempted | solved | revisit
  solved_at TIMESTAMPTZ,
  time_taken_minutes INTEGER,
  notes TEXT,
  UNIQUE(user_id, question_id)
);

ALTER TABLE dsa_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dsa_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read DSA questions" ON dsa_questions;
CREATE POLICY "Anyone can read DSA questions"
  ON dsa_questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users own their DSA progress" ON dsa_progress;
CREATE POLICY "Users own their DSA progress"
  ON dsa_progress FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_dsa_topic ON dsa_questions(topic);
CREATE INDEX IF NOT EXISTS idx_dsa_difficulty ON dsa_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_dsa_important ON dsa_questions(is_important);
CREATE INDEX IF NOT EXISTS idx_dsa_progress_user ON dsa_progress(user_id, status);
