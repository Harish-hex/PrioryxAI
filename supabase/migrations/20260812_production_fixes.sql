-- Bug 3: LeetCode/HackerRank Persistence
CREATE TABLE IF NOT EXISTS user_coding_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('leetcode', 'hackerrank')),
  username text NOT NULL,
  data jsonb DEFAULT '{}',
  connected boolean DEFAULT true,
  last_synced timestamptz DEFAULT now(),
  UNIQUE(user_id, platform)
);
ALTER TABLE user_coding_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profiles" ON user_coding_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Bug 9: Contribution Graph Internal Activity RPC
CREATE OR REPLACE FUNCTION get_user_daily_activity(p_user_id uuid, p_from date)
RETURNS TABLE(activity_date date, count bigint) AS $$
SELECT date_trunc('day', created_at)::date as activity_date, COUNT(*) as count
FROM (
  SELECT created_at FROM tasks WHERE user_id = p_user_id AND created_at >= p_from
  UNION ALL
  SELECT updated_at as created_at FROM user_resumes WHERE user_id = p_user_id AND updated_at >= p_from
  UNION ALL
  SELECT last_synced as created_at FROM user_coding_profiles WHERE user_id = p_user_id AND last_synced >= p_from
) combined
GROUP BY activity_date ORDER BY activity_date;
$$ LANGUAGE sql SECURITY DEFINER;

-- Global Fixes: Storage bucket policies
-- Assuming buckets 'resumes' and 'schedules' are created via Dashboard as requested by user.
-- RLS Policy for storage.objects (if not already existing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users access own files' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users access own files" ON storage.objects
      FOR ALL USING (auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END
$$;
