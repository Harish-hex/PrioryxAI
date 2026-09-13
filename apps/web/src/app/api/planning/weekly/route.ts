import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateLLMPlan } from '@/lib/priority/llm-planner';
import { buildWeeklySchedule } from '@/lib/planning/weekly-scheduler';
import { redis, withFallback, midnightISTttl } from '@/lib/redis';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cacheKey = `weekly_schedule:${user.id}`;
  const cached = await withFallback(() => redis.get(cacheKey), null);
  if (cached) return NextResponse.json(cached);

  try {
    const plan = await generateLLMPlan(user.id);
    const schedule = buildWeeklySchedule(plan.todaysTasks);
    const body = { schedule, todaysFocus: plan.todaysFocus };
    await withFallback(() => redis.set(cacheKey, body, { ex: midnightISTttl() }), undefined);
    return NextResponse.json(body);
  } catch (e) {
    console.error('[Weekly Planning API] Error:', e);
    return NextResponse.json({ error: 'Failed to generate weekly schedule' }, { status: 500 });
  }
}
