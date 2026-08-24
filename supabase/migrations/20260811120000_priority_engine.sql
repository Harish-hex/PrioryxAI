-- Migration: Automatic Priority Engine Tables
-- Run in: Supabase SQL Editor

CREATE TABLE IF NOT EXISTS priority_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  urgency_score INTEGER DEFAULT 50,
  scheduled_for DATE,
  due_date DATE,
  action_url TEXT DEFAULT '',
  action_label TEXT DEFAULT 'Open',
  secondary_url TEXT DEFAULT '',
  why_now TEXT DEFAULT '',
  estimated_minutes INTEGER DEFAULT 30,
  effort_level TEXT DEFAULT 'medium',
  source_type TEXT DEFAULT 'ai',
  source_id TEXT DEFAULT '',
  task_data JSONB DEFAULT '{}',
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  dismissed BOOLEAN DEFAULT FALSE,
  snoozed_until DATE,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  todays_focus TEXT DEFAULT '',
  urgent_alerts TEXT[] DEFAULT '{}',
  insights TEXT[] DEFAULT '{}',
  total_estimated_minutes INTEGER DEFAULT 0,
  plan_data JSONB DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, plan_date)
);

ALTER TABLE priority_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own priority tasks" ON priority_tasks;
CREATE POLICY "Users own priority tasks"
  ON priority_tasks FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users own daily plans" ON daily_plans;
CREATE POLICY "Users own daily plans"
  ON daily_plans FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_priority_tasks_user_date
  ON priority_tasks(user_id, scheduled_for, completed, dismissed);
CREATE INDEX IF NOT EXISTS idx_priority_tasks_urgency
  ON priority_tasks(user_id, urgency_score DESC);
CREATE INDEX IF NOT EXISTS idx_daily_plans_user_date
  ON daily_plans(user_id, plan_date DESC);
