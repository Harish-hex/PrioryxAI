-- ═══════════════════════════════════════════════════════════════
-- Migration: Subscriptions Table
-- Run this in Supabase SQL Editor
-- Created: 2026-08-14
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  razorpay_subscription_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  status TEXT DEFAULT 'created',
  -- created | active | charged | cancelled | completed | expired
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  plan_id TEXT,
  amount_paid INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own subscriptions" ON subscriptions;
CREATE POLICY "Users can read own subscriptions"
  ON subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Service role handles writes (webhook handlers bypass RLS anyway)
DROP POLICY IF EXISTS "Service role manages subscriptions" ON subscriptions;
CREATE POLICY "Service role manages subscriptions"
  ON subscriptions FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_id ON subscriptions(razorpay_subscription_id);

-- ── Helper: Check if user has active Pro via any source ──────────
CREATE OR REPLACE FUNCTION is_user_pro(p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT pro_status FROM users WHERE id = p_user_id),
    FALSE
  ) AND (
    SELECT COALESCE(pro_expires_at > NOW(), FALSE)
    FROM users WHERE id = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER;
