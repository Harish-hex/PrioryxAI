-- Migration v2: Kanban stage column + Internshala job fields
-- Run in Supabase SQL Editor AFTER the initial schema

-- Add stage column to tasks for Kanban tracker
-- Stages: saved → applied → interview → offer → rejected
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'saved'
    CHECK (stage IN ('saved', 'applied', 'interview', 'offer', 'rejected'));

-- Add apify_id to deduplicate Internshala job listings
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS apify_id TEXT UNIQUE;

-- Add external_url for job listing links
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS external_url TEXT;

-- Add stipend field for Internshala jobs
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS stipend TEXT;

-- Index for kanban queries (filter by user + type=job + stage)
CREATE INDEX IF NOT EXISTS idx_tasks_kanban ON tasks(user_id, type, stage);

-- Index for deduplication on apify_id
CREATE INDEX IF NOT EXISTS idx_tasks_apify_id ON tasks(apify_id) WHERE apify_id IS NOT NULL;
