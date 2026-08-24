-- Personalized decision engine foundation.
-- Non-destructive migration: adds global/user-context columns and normalized
-- tables for academic modeling, feedback, opportunities, skills, and RAG-ready
-- context documents.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'IN',
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en-IN',
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Kolkata',
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS academic_system TEXT DEFAULT 'india_semester',
  ADD COLUMN IF NOT EXISTS term_system TEXT DEFAULT 'semester',
  ADD COLUMN IF NOT EXISTS grading_system TEXT DEFAULT 'cgpa_10',
  ADD COLUMN IF NOT EXISTS available_hours_per_week NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS preferred_work_start TIME,
  ADD COLUMN IF NOT EXISTS preferred_work_end TIME,
  ADD COLUMN IF NOT EXISTS career_goals TEXT[];

CREATE TABLE IF NOT EXISTS academic_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  institution TEXT,
  country TEXT DEFAULT 'IN',
  academic_system TEXT NOT NULL DEFAULT 'india_semester',
  term_type TEXT NOT NULL DEFAULT 'semester',
  term_name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  grading_system TEXT DEFAULT 'cgpa_10',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  academic_term_id UUID REFERENCES academic_terms(id) ON DELETE SET NULL,
  code TEXT,
  name TEXT NOT NULL,
  credits NUMERIC(5,2),
  instructor TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'task_created',
      'task_completed',
      'task_skipped',
      'task_snoozed',
      'task_postponed',
      'task_dismissed',
      'recommendation_accepted',
      'recommendation_rejected',
      'opportunity_viewed',
      'opportunity_saved',
      'opportunity_ignored',
      'application_started',
      'application_completed',
      'project_completed',
      'learning_completed',
      'learning_resource_completed'
    )
  ),
  source TEXT NOT NULL DEFAULT 'app',
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  outcome TEXT,
  context JSONB NOT NULL DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opportunity_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country TEXT,
  region TEXT,
  adapter_type TEXT NOT NULL DEFAULT 'api',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key TEXT NOT NULL REFERENCES opportunity_sources(source_key) ON DELETE RESTRICT,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  remote_policy TEXT,
  country TEXT,
  deadline TIMESTAMPTZ,
  salary_min NUMERIC,
  salary_max NUMERIC,
  stipend TEXT,
  currency TEXT,
  eligibility TEXT,
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  preferred_skills TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  application_url TEXT NOT NULL,
  freshness_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_payload JSONB NOT NULL DEFAULT '{}',
  content_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_key, external_id)
);

CREATE TABLE IF NOT EXISTS user_opportunity_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  external_url TEXT,
  source TEXT,
  event_type TEXT NOT NULL CHECK (
    event_type IN ('viewed', 'saved', 'ignored', 'applied', 'dismissed')
  ),
  status TEXT,
  notes TEXT,
  context JSONB NOT NULL DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  normalized_skill TEXT NOT NULL,
  source TEXT NOT NULL,
  evidence TEXT,
  confidence NUMERIC(4,3) NOT NULL DEFAULT 0.700 CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, normalized_skill, source)
);

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS ai_context_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id TEXT,
  title TEXT,
  content_preview TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  content_hash TEXT,
  embedding_model TEXT,
  embedding extensions.vector(1536),
  embedded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ai_context_documents_user_source_unique'
  ) THEN
    ALTER TABLE ai_context_documents
      ADD CONSTRAINT ai_context_documents_user_source_unique
      UNIQUE(user_id, source_type, source_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_global_context
  ON users(country, timezone, locale);

CREATE INDEX IF NOT EXISTS idx_academic_terms_user_dates
  ON academic_terms(user_id, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_courses_user_term
  ON courses(user_id, academic_term_id);

CREATE INDEX IF NOT EXISTS idx_recommendation_events_user_time
  ON recommendation_events(user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_recommendation_events_entity
  ON recommendation_events(user_id, entity_type, entity_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_opportunity_sources_country
  ON opportunity_sources(country, enabled);

CREATE INDEX IF NOT EXISTS idx_opportunities_source_freshness
  ON opportunities(source_key, freshness_at DESC);

CREATE INDEX IF NOT EXISTS idx_opportunities_country_deadline
  ON opportunities(country, deadline);

CREATE INDEX IF NOT EXISTS idx_opportunities_required_skills
  ON opportunities USING GIN(required_skills);

CREATE INDEX IF NOT EXISTS idx_user_opportunity_interactions_user_time
  ON user_opportunity_interactions(user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_skills_user_normalized
  ON user_skills(user_id, normalized_skill);

CREATE INDEX IF NOT EXISTS idx_ai_context_documents_user_source
  ON ai_context_documents(user_id, source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_ai_context_documents_embedding
  ON ai_context_documents
  USING ivfflat (embedding extensions.vector_cosine_ops)
  WITH (lists = 100)
  WHERE embedding IS NOT NULL;

ALTER TABLE academic_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_opportunity_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_context_documents ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON academic_terms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON recommendation_events TO authenticated;
GRANT SELECT ON opportunity_sources TO authenticated;
GRANT SELECT ON opportunities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_opportunity_interactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_skills TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_context_documents TO authenticated;

DROP POLICY IF EXISTS "Users manage own academic terms" ON academic_terms;
CREATE POLICY "Users manage own academic terms"
  ON academic_terms FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users manage own courses" ON courses;
CREATE POLICY "Users manage own courses"
  ON courses FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users manage own recommendation events" ON recommendation_events;
CREATE POLICY "Users manage own recommendation events"
  ON recommendation_events FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Authenticated users read opportunity sources" ON opportunity_sources;
CREATE POLICY "Authenticated users read opportunity sources"
  ON opportunity_sources FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users read opportunities" ON opportunities;
CREATE POLICY "Authenticated users read opportunities"
  ON opportunities FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users manage own opportunity interactions" ON user_opportunity_interactions;
CREATE POLICY "Users manage own opportunity interactions"
  ON user_opportunity_interactions FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users manage own skills" ON user_skills;
CREATE POLICY "Users manage own skills"
  ON user_skills FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users manage own context documents" ON ai_context_documents;
CREATE POLICY "Users manage own context documents"
  ON ai_context_documents FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION match_ai_context_documents(
  query_embedding extensions.vector(1536),
  match_count INTEGER DEFAULT 6,
  source_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  source_type TEXT,
  source_id TEXT,
  title TEXT,
  content_preview TEXT,
  metadata JSONB,
  similarity DOUBLE PRECISION,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  SELECT
    d.id,
    d.source_type,
    d.source_id,
    d.title,
    d.content_preview,
    d.metadata,
    1 - (d.embedding <=> query_embedding) AS similarity,
    d.created_at
  FROM ai_context_documents d
  WHERE d.user_id = (SELECT auth.uid())
    AND d.embedding IS NOT NULL
    AND (source_filter IS NULL OR d.source_type = source_filter)
  ORDER BY d.embedding <=> query_embedding
  LIMIT LEAST(GREATEST(match_count, 1), 20);
$$;

GRANT EXECUTE ON FUNCTION match_ai_context_documents(extensions.vector(1536), INTEGER, TEXT) TO authenticated;

INSERT INTO opportunity_sources(source_key, name, country, adapter_type, metadata)
VALUES
  ('remotive', 'Remotive', NULL, 'api', '{"scope":"global_remote"}'),
  ('arbeitnow', 'Arbeitnow', 'DE', 'api', '{"scope":"global_remote"}'),
  ('internshala', 'Internshala', 'IN', 'apify', '{"scope":"india_internships"}')
ON CONFLICT (source_key) DO UPDATE SET
  name = EXCLUDED.name,
  country = EXCLUDED.country,
  adapter_type = EXCLUDED.adapter_type,
  metadata = opportunity_sources.metadata || EXCLUDED.metadata,
  updated_at = NOW();
