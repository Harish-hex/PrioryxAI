-- Migration v3: Fix apify_id uniqueness scope
--
-- BUG: apify_id was UNIQUE globally, meaning the same Internshala job listing
-- could only be stored once across ALL users. Every user after the first who
-- synced the same listing would have their row silently skipped by the upsert,
-- leaving them with 0 matched jobs.
--
-- FIX: Make deduplication per-user by using a composite unique constraint on
-- (user_id, apify_id). The same job listing can now be stored for each user.

-- 1. Drop the old global unique constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_apify_id_key;

-- 2. Add per-user composite unique constraint
ALTER TABLE tasks
  ADD CONSTRAINT tasks_user_apify_unique UNIQUE (user_id, apify_id);

-- 3. Replace the old single-column index (now redundant) with one that matches
--    the new composite constraint for query performance
DROP INDEX IF EXISTS idx_tasks_apify_id;
CREATE INDEX IF NOT EXISTS idx_tasks_user_apify ON tasks (user_id, apify_id)
  WHERE apify_id IS NOT NULL;
