export const maxDuration = 60;
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withFallback, redis } from '@/lib/redis';

export const runtime = 'nodejs';

const STATS_CACHE_TTL = 120; // 2 minutes

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cacheKey = `stats:${user.id}`;
  // Temporarily bypass cache so F5 works immediately
  // const cached = await withFallback(() => redis.get(cacheKey), null);
  // if (cached) return NextResponse.json(cached);

  // Start of current week (Monday IST)
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const dayOfWeek = now.getDay(); // 0=Sun
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysFromMonday);
  weekStart.setHours(0, 0, 0, 0);

  const [
    { data: allTasks },
    { data: completedThisWeek },
    { data: allPriorityTasks },
    { data: github },
  ] = await Promise.all([
    supabase
      .from('tasks')
      .select('type, completed, due_at')
      .eq('user_id', user.id),

    supabase
      .from('tasks')
      .select('id, type')
      .eq('user_id', user.id)
      .eq('completed', true)
      .gte('due_at', weekStart.toISOString()),

    supabase
      .from('priority_tasks')
      .select('source_type, completed, expires_at, completed_at')
      .eq('user_id', user.id)
      .eq('dismissed', false),

    supabase
      .from('github_cache')
      .select('streak_days, health_score, last_commit_at')
      .eq('user_id', user.id)
      .single(),
  ]);

  const tasks = allTasks ?? [];
  const priorityTasks = allPriorityTasks ?? [];

  // Tasks by type breakdown
  const byType: Record<string, { total: number; pending: number; completed: number }> = {};
  
  const processTask = (type: string, isCompleted: boolean) => {
    if (!byType[type]) byType[type] = { total: 0, pending: 0, completed: 0 };
    byType[type].total++;
    if (isCompleted) byType[type].completed++;
    else byType[type].pending++;
  };

  for (const t of tasks) {
    processTask(t.type as string, t.completed);
  }
  for (const t of priorityTasks) {
    processTask(t.source_type as string, t.completed);
  }

  // Overdue count
  const now2 = new Date();
  const overdue = tasks.filter(
    t => !t.completed && t.due_at && new Date(t.due_at) < now2
  ).length + priorityTasks.filter(
    t => !t.completed && t.expires_at && new Date(t.expires_at) < now2
  ).length;

  const priorityCompletedThisWeek = priorityTasks.filter(
    t => t.completed && t.completed_at && new Date(t.completed_at) >= weekStart
  ).length;

  const result = {
    total_tasks: tasks.length + priorityTasks.length,
    pending_tasks: tasks.filter(t => !t.completed).length + priorityTasks.filter(t => !t.completed).length,
    completed_tasks: tasks.filter(t => t.completed).length + priorityTasks.filter(t => t.completed).length,
    completed_this_week: (completedThisWeek?.length ?? 0) + priorityCompletedThisWeek,
    overdue,
    by_type: byType,
    github: {
      streak_days: github?.streak_days ?? 0,
      health_score: github?.health_score ?? 0,
      last_commit_at: github?.last_commit_at ?? null,
    },
  };

  await withFallback(() => redis.set(cacheKey, result, { ex: STATS_CACHE_TTL }), undefined);

  return NextResponse.json(result);
}
