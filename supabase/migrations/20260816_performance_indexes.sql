-- Migration: Database Performance Indexing Overhaul
-- Run in: Supabase SQL Editor
-- Purpose: Speed up core query lookups, avoiding sequential scans on high-traffic tables.

-- 1. Tasks & Priority Feed Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_active_due 
  ON tasks(user_id, completed, due_at) 
  WHERE completed = false;

CREATE INDEX IF NOT EXISTS idx_tasks_user_type_created 
  ON tasks(user_id, type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_user_deadline 
  ON tasks(user_id, deadline) 
  WHERE deadline IS NOT NULL;

-- 2. Users & Profiles
CREATE INDEX IF NOT EXISTS idx_users_username 
  ON users(username);

CREATE INDEX IF NOT EXISTS idx_users_github 
  ON users(github_username) 
  WHERE github_username IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON subscriptions(user_id, status);

-- 3. Assistant Messages & History
CREATE INDEX IF NOT EXISTS idx_assistant_messages_user_created 
  ON assistant_messages(user_id, created_at DESC);

-- 4. User Resumes
CREATE INDEX IF NOT EXISTS idx_user_resumes_user_created
  ON user_resumes(user_id, created_at DESC);

-- 5. Notifications (peer_notifications already indexed by
--    idx_peer_notifications_user in 20260812_peer_collab_hardening.sql)

-- 6. Peer Collaboration (peer_connections already indexed by
--    idx_peer_connections_receiver / idx_peer_connections_requester
--    in 20260812_peer_collab_hardening.sql)
CREATE INDEX IF NOT EXISTS idx_peer_challenges_creator
  ON peer_challenges(creator_id, status);

CREATE INDEX IF NOT EXISTS idx_peer_challenges_opponent
  ON peer_challenges(opponent_id, status);

-- 7. GitHub Cache & Intelligence
CREATE INDEX IF NOT EXISTS idx_github_cache_user 
  ON github_cache(user_id);

CREATE INDEX IF NOT EXISTS idx_github_intelligence_user_created 
  ON github_intelligence_reports(user_id, created_at DESC);

-- 8. Coding Profiles (coding_profiles.user_id is already UNIQUE/auto-indexed;
--    user_coding_profiles(user_id, platform) is already UNIQUE/auto-indexed)

-- 9. YouTube Recommendations
CREATE INDEX IF NOT EXISTS idx_youtube_recommendations_user_cat 
  ON youtube_recommendations(user_id, category, watched, dismissed);

-- 10. Job Applications
CREATE INDEX IF NOT EXISTS idx_job_applications_user_status 
  ON job_applications(user_id, status, created_at DESC);
