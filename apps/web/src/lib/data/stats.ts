// Shared stats data loader — extracted from src/app/api/stats/route.ts so the
// same logic can be called from the /api/stats route (client revalidation)
// and directly from a Server Component for first-paint data.
import type { SupabaseClient } from '@supabase/supabase-js';
import { withFallback, redis } from '@/lib/redis';

const STATS_CACHE_TTL = 120; // 2 minutes

export async function getStatsData(supabase: SupabaseClient, userId: string) {
  const cacheKey = `stats:${userId}`;
  const cached = await withFallback(() => redis.get(cacheKey), null);
  if (cached) return cached;

  // Start of current week (Monday IST)
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const dayOfWeek = now.getDay(); // 0=Sun
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysFromMonday);
  weekStart.setHours(0, 0, 0, 0);

  // Aggregation is done in Postgres (get_task_stats RPC, SECURITY INVOKER —
  // RLS on `tasks` still restricts this to the caller's own rows regardless
  // of p_user_id) instead of pulling every task row into Node and counting
  // in JS — this used to scale linearly with a user's lifetime task count.
  const [{ data: taskStats }, { data: github }] = await Promise.all([
    supabase.rpc('get_task_stats', { p_user_id: userId, p_week_start: weekStart.toISOString() }).maybeSingle(),
    supabase
      .from('github_cache')
      .select('streak_days, health_score, last_commit_at')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  const result = {
    total_tasks: (taskStats as any)?.total_tasks ?? 0,
    pending_tasks: (taskStats as any)?.pending_tasks ?? 0,
    completed_tasks: (taskStats as any)?.completed_tasks ?? 0,
    completed_this_week: (taskStats as any)?.completed_this_week ?? 0,
    overdue: (taskStats as any)?.overdue ?? 0,
    by_type: (taskStats as any)?.by_type ?? {},
    github: {
      streak_days: (github as any)?.streak_days ?? 0,
      health_score: (github as any)?.health_score ?? 0,
      last_commit_at: (github as any)?.last_commit_at ?? null,
    },
  };

  await withFallback(() => redis.set(cacheKey, result, { ex: STATS_CACHE_TTL }), undefined);

  return result;
}
