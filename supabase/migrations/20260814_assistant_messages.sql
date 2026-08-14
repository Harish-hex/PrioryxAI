-- �������������������������������������������������������������������������������������������������������������������������������
-- Migration: Assistant Messages Table
-- Run this in Supabase SQL Editor
-- Created: 2026-08-14
-- �������������������������������������������������������������������������������������������������������������������������������

CREATE TABLE IF NOT EXISTS assistant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own assistant messages" ON assistant_messages;
CREATE POLICY "Users can read own assistant messages"
  ON assistant_messages FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own assistant messages" ON assistant_messages;
CREATE POLICY "Users can insert own assistant messages"
  ON assistant_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Service role handles bulk operations (webhook handlers bypass RLS anyway)
DROP POLICY IF EXISTS "Service role manages assistant messages" ON assistant_messages;
CREATE POLICY "Service role manages assistant messages"
  ON assistant_messages FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_assistant_messages_user_created ON assistant_messages(user_id, created_at DESC);