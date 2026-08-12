import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withFallback, redis } from '@/lib/redis';

export const maxDuration = 20

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

  // Try updating regular tasks table
  const { error: errorTasks } = await supabase
    .from('tasks')
    .update({ completed: true })
    .eq('id', params.id)
    .eq('user_id', user.id); // Ensure user owns the task

  // Try updating priority tasks table (for AI tasks)
  const { error: errorPriority } = await supabase
    .from('priority_tasks')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (errorTasks && errorPriority) {
    console.error('[tasks/complete] DB error:', errorTasks, errorPriority);
    return NextResponse.json({ error: 'Failed to complete task' }, { status: 500 });
  }

  // Invalidate feed cache so next load reflects the change
  await withFallback(() => redis.del(`feed:${user.id}`), 0);

  return NextResponse.json({ success: true });
}
