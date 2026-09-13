/**
 * Priority Plan API — Phase 1 (LLM Reasoning Engine)
 *
 * Now backed by GPT-4o via llm-planner.ts with:
 * - Per-user per-day Redis cache (reuses existing midnightISTttl pattern)
 * - Burnout detection folded in (Phase 3)
 * - Deterministic fallback if LLM fails (engine.ts untouched)
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateLLMPlan } from '@/lib/priority/llm-planner';

export const maxDuration = 30

export const runtime = 'nodejs';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const plan = await generateLLMPlan(user.id);
    return NextResponse.json(plan);
  } catch (e) {
    console.error('[Priority API] Error:', e);
    return NextResponse.json({ error: 'Failed to generate priority plan' }, { status: 500 });
  }
}
