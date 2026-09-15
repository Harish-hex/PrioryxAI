-- ════════════════════════════════════════════════════════════════
-- Migration: Study Rooms (Peer Collaboration Dashboard — Phase 1)
-- Real-time collaborative study sessions, layered on top of the
-- existing peer_profiles/peer_connections/peer_notifications system.
-- References auth.users (matching the live schema), not public.profiles.
-- ════════════════════════════════════════════════════════════════

-- ── study_rooms ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.study_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  -- 6-character alphanumeric join code e.g. "AB3X9K"

  name TEXT NOT NULL,
  description TEXT,
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  room_type TEXT NOT NULL DEFAULT 'open_study',
  -- 'open_study' | 'dsa_sprint' | 'project_review'
  -- | 'mock_interview' | 'accountability'

  focus_topic TEXT,
  -- e.g. "Dynamic Programming", "System Design", "React Projects"

  max_members INT DEFAULT 6,
  is_private BOOLEAN DEFAULT FALSE,
  password_hash TEXT,
  -- null if not private

  status TEXT DEFAULT 'active',
  -- 'active' | 'ended' | 'scheduled'

  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,

  session_data JSONB DEFAULT '{}',
  -- shared notes, links, pomodoro timer state

  college_domain TEXT,
  -- if set, only students from this college can join

  tags TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.study_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  -- 'host' | 'co_host' | 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  presence_data JSONB DEFAULT '{}',
  -- { status: 'studying'|'away'|'stuck', last_seen }
  UNIQUE(room_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.study_room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  -- 'text' | 'code' | 'link' | 'problem' | 'system'
  metadata JSONB DEFAULT '{}',
  -- for code: { language, snippet }
  -- for problem: { leetcode_id, title, difficulty }
  -- for link: { url, title }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── connection_type on the existing peer_connections table ────────
-- Additive column so the real, live peer_connections table can later
-- distinguish accountability_partner / study_buddy from a plain peer
-- connection, without introducing a second, incompatible connections table.
ALTER TABLE public.peer_connections
  ADD COLUMN IF NOT EXISTS connection_type TEXT DEFAULT 'peer';
-- 'peer' | 'accountability_partner' | 'study_buddy' | 'mentor'

-- ── RLS ─────────────────────────────────────────────────────────
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "study_room_visibility" ON public.study_rooms;
CREATE POLICY "study_room_visibility" ON public.study_rooms
  FOR SELECT USING (
    is_private = FALSE
    OR host_id = auth.uid()
    OR id IN (
      SELECT room_id FROM public.study_room_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "study_room_host_manage" ON public.study_rooms;
CREATE POLICY "study_room_host_manage" ON public.study_rooms
  FOR UPDATE USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

DROP POLICY IF EXISTS "study_room_host_delete" ON public.study_rooms;
CREATE POLICY "study_room_host_delete" ON public.study_rooms
  FOR DELETE USING (host_id = auth.uid());

DROP POLICY IF EXISTS "study_room_create" ON public.study_rooms;
CREATE POLICY "study_room_create" ON public.study_rooms
  FOR INSERT WITH CHECK (host_id = auth.uid());

DROP POLICY IF EXISTS "study_room_members_visibility" ON public.study_room_members;
CREATE POLICY "study_room_members_visibility" ON public.study_room_members
  FOR SELECT USING (
    room_id IN (
      SELECT id FROM public.study_rooms WHERE is_private = FALSE
    )
    OR user_id = auth.uid()
    OR room_id IN (
      SELECT room_id FROM public.study_room_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "study_room_members_self_manage" ON public.study_room_members;
CREATE POLICY "study_room_members_self_manage" ON public.study_room_members
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "study_room_messages_members_only" ON public.study_room_messages;
CREATE POLICY "study_room_messages_members_only" ON public.study_room_messages
  FOR SELECT USING (
    room_id IN (
      SELECT room_id FROM public.study_room_members
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "study_room_messages_send" ON public.study_room_messages;
CREATE POLICY "study_room_messages_send" ON public.study_room_messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND room_id IN (
      SELECT room_id FROM public.study_room_members
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- ── Indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_study_rooms_status_type ON public.study_rooms(status, room_type);
CREATE INDEX IF NOT EXISTS idx_study_rooms_college ON public.study_rooms(college_domain);
CREATE INDEX IF NOT EXISTS idx_study_room_members_room ON public.study_room_members(room_id, is_active);
CREATE INDEX IF NOT EXISTS idx_study_room_members_user ON public.study_room_members(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_study_room_messages_room ON public.study_room_messages(room_id, created_at);

-- ── Realtime (Postgres Changes) ────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'study_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.study_rooms;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'study_room_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.study_room_members;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'study_room_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.study_room_messages;
  END IF;
END $$;
