CREATE TABLE IF NOT EXISTS youtube_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,              -- YouTube video ID
  title TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  channel_id TEXT,
  thumbnail TEXT,
  duration TEXT,
  view_count INTEGER,
  published_at TEXT,
  category TEXT NOT NULL,
  source TEXT NOT NULL,
  relevance_topic TEXT NOT NULL,
  why_recommended TEXT,
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  estimated_learning_minutes INTEGER,
  watched BOOLEAN DEFAULT FALSE,
  watched_at TIMESTAMPTZ,
  saved_for_later BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE,
  dismissed_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS youtube_trending_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream TEXT NOT NULL,
  signals JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS youtube_watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  watch_duration_seconds INTEGER,
  UNIQUE(user_id, video_id)
);

ALTER TABLE youtube_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_trending_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_watch_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own recommendations" ON youtube_recommendations;
CREATE POLICY "Users own recommendations" ON youtube_recommendations
  FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users own watch history" ON youtube_watch_history;
CREATE POLICY "Users own watch history" ON youtube_watch_history
  FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Trending cache public read" ON youtube_trending_cache;
CREATE POLICY "Trending cache public read" ON youtube_trending_cache
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service role inserts trending" ON youtube_trending_cache;
CREATE POLICY "Service role inserts trending" ON youtube_trending_cache
  FOR INSERT WITH CHECK (true);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_yt_rec_user_created
  ON youtube_recommendations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_yt_rec_user_dismissed
  ON youtube_recommendations(user_id, dismissed, priority);
