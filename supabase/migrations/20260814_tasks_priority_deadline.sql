-- ���������������������������������������������������������������������������������������������������������������������������������
-- Migration: Add priority and deadline columns to tasks table
-- Run this in Supabase SQL Editor
-- Created: 2026-08-14
-- ���������������������������������������������������������������������������������������������������������������������������������

-- Add priority column (low, medium, high, urgent)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium'
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Add deadline column (separate from due_at for more granular control)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;

-- Index for priority-based queries
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(user_id, priority);

-- Index for deadline-based queries
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(user_id, deadline) WHERE deadline IS NOT NULL;