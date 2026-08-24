import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withFallback, redis } from '@/lib/redis';
import { recordFeedbackEvent } from '@/lib/feedback/events';

export const runtime = 'nodejs';

const ALLOWED_HOURS = [1, 2, 4, 8, 24, 48];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const hours = Number(body.hours);
  if (!ALLOWED_HOURS.includes(hours)) {
    return NextResponse.json(
      { error: `hours must be one of: ${ALLOWED_HOURS.join(', ')}` },
      { status: 400 }
    );
  }

  // Fetch the task to get current due_at
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('id, due_at')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Snooze from current due_at (or now if no deadline)
  const base = task.due_at ? new Date(task.due_at) : new Date();
  const newDueAt = new Date(base.getTime() + hours * 3_600_000).toISOString();

  const { data: updated, error } = await supabase
    .from('tasks')
    .update({ due_at: newDueAt })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('[tasks/snooze]', error);
    return NextResponse.json({ error: 'Failed to snooze task' }, { status: 500 });
  }

  await withFallback(() => redis.del(`feed:${user.id}`), 0);
  await recordFeedbackEvent(supabase, user.id, {
    eventType: 'task_snoozed',
    source: 'tasks_api',
    entityType: 'task',
    entityId: params.id,
    context: { hours, previous_due_at: task.due_at, new_due_at: newDueAt },
  });

  return NextResponse.json({ task: updated, snoozed_hours: hours, new_due_at: newDueAt });
}
