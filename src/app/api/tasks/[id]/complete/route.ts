import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withFallback, redis } from '@/lib/redis';
import { recordFeedbackEvent } from '@/lib/feedback/events';

export const runtime = 'nodejs';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('tasks')
    .update({ completed: true })
    .eq('id', params.id)
    .eq('user_id', user.id); // Ensure user owns the task

  if (error) {
    console.error('[tasks/complete] DB error:', error);
    return NextResponse.json({ error: 'Failed to complete task' }, { status: 500 });
  }

  // Invalidate feed cache so next load reflects the change
  await withFallback(() => redis.del(`feed:${user.id}`), 0);
  await recordFeedbackEvent(supabase, user.id, {
    eventType: 'task_completed',
    source: 'tasks_api',
    entityType: 'task',
    entityId: params.id,
  });

  return NextResponse.json({ success: true });
}
