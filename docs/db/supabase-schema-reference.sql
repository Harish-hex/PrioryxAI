-- Run this in Supabase SQL Editor
-- Dashboard → SQL Editor → New query → paste → Run

-- USERS
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  github_username TEXT UNIQUE,
  college TEXT,
  semester INT,
  subjects TEXT[],
  pro_status BOOLEAN DEFAULT false,
  pro_expires_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TASKS (no priority_score column — computed at query time)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('exam','assignment','job','github','manual')),
  title TEXT NOT NULL,
  subject TEXT,
  due_at TIMESTAMPTZ,
  weightage INT,
  source TEXT CHECK (source IN ('timetable','manual','vision','github')),
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- GITHUB CACHE
CREATE TABLE github_cache (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  repos JSONB DEFAULT '[]',
  languages JSONB DEFAULT '{}',
  last_commit_at TIMESTAMPTZ,
  streak_days INT DEFAULT 0,
  health_score FLOAT DEFAULT 0,
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- ASSISTANT MESSAGES
CREATE TABLE assistant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  razorpay_subscription_id TEXT UNIQUE,
  status TEXT DEFAULT 'created',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES
CREATE INDEX idx_tasks_user_due ON tasks(user_id, due_at);
CREATE INDEX idx_tasks_user_completed ON tasks(user_id, completed);
CREATE INDEX idx_messages_user ON assistant_messages(user_id, created_at);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_last_active ON users(last_active_at);

-- ROW LEVEL SECURITY
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users: own row" ON users USING (auth.uid() = id);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks: own rows" ON tasks USING (auth.uid() = user_id);

ALTER TABLE github_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "github_cache: own row" ON github_cache USING (auth.uid() = user_id);

ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages: own rows" ON assistant_messages USING (auth.uid() = user_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions: own rows" ON subscriptions USING (auth.uid() = user_id);
