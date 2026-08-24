-- Weekly timetable entries
CREATE TABLE IF NOT EXISTS schedule_timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  day TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  location TEXT,
  type TEXT DEFAULT 'lecture',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exam and assignment deadlines
CREATE TABLE IF NOT EXISTS schedule_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT,
  date DATE,
  start_time TEXT,
  end_time TEXT,
  location TEXT,
  type TEXT DEFAULT 'exam',
  priority TEXT DEFAULT 'high',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE schedule_timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own timetable" ON schedule_timetable;
CREATE POLICY "Users own timetable" ON schedule_timetable
  FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users own exam schedule" ON schedule_exams;
CREATE POLICY "Users own exam schedule" ON schedule_exams
  FOR ALL USING (auth.uid() = user_id);
