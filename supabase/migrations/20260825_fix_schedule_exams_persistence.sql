-- Fix: /api/schedule/exam inserts columns that never existed on schedule_exams
-- (subject_code, day_of_week, session, exam_type, marks, notes, institution,
-- semester), so every exam-schedule upload silently failed to persist and the
-- API still reported success using the in-memory AI extraction. Add the
-- missing columns so the insert (and the GET reader) actually work.
ALTER TABLE schedule_exams ADD COLUMN IF NOT EXISTS subject_code TEXT;
ALTER TABLE schedule_exams ADD COLUMN IF NOT EXISTS day_of_week TEXT;
ALTER TABLE schedule_exams ADD COLUMN IF NOT EXISTS session TEXT;
ALTER TABLE schedule_exams ADD COLUMN IF NOT EXISTS exam_type TEXT;
ALTER TABLE schedule_exams ADD COLUMN IF NOT EXISTS marks TEXT;
ALTER TABLE schedule_exams ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE schedule_exams ADD COLUMN IF NOT EXISTS institution TEXT;
ALTER TABLE schedule_exams ADD COLUMN IF NOT EXISTS semester TEXT;

-- Fix: the same route inserts tasks with source = 'exam_upload', which the
-- tasks_source_check constraint rejects (only 'timetable', 'manual', 'vision',
-- 'github' were allowed), so those rows never reached the Priority Feed either.
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_source_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_source_check
  CHECK (source = ANY (ARRAY['timetable'::text, 'manual'::text, 'vision'::text, 'github'::text, 'exam_upload'::text]));
