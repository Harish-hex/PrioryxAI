import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withFallback, redis } from '@/lib/redis';

export const runtime = 'nodejs';

// Fields the user is allowed to edit on a task
const EDITABLE_FIELDS = new Set(['title', 'subject', 'due_at', 'weightage', 'type']);
const VALID_TYPES = ['exam', 'assignment', 'job', 'manual'];

export async function PATCH(
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

  const updates: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(body)) {
    if (!EDITABLE_FIELDS.has(key)) continue;

    if (key === 'title') {
      if (typeof val !== 'string' || !val.trim()) {
        return NextResponse.json({ error: 'title must be a non-empty string' }, { status: 400 });
      }
      updates.title = val.trim().slice(0, 300);
    } else if (key === 'subject') {
      updates.subject = val === null ? null : String(val).slice(0, 100);
    } else if (key === 'due_at') {
      if (val !== null) {
        const d = new Date(val as string);
        if (isNaN(d.getTime())) {
          return NextResponse.json({ error: 'due_at must be a valid ISO 8601 date or null' }, { status: 400 });
        }
        updates.due_at = d.toISOString();
      } else {
        updates.due_at = null;
      }
    } else if (key === 'weightage') {
      if (val !== null) {
        const n = Number(val);
        if (isNaN(n) || n < 0 || n > 100) {
          return NextResponse.json({ error: 'weightage must be a number between 0 and 100 or null' }, { status: 400 });
        }
        updates.weightage = n;
      } else {
        updates.weightage = null;
      }
    } else if (key === 'type') {
      if (!VALID_TYPES.includes(val as string)) {
        return NextResponse.json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 });
      }
      updates.type = val;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', user.id) // ownership check
    .select()
    .single();

  if (error || !data) {
    if (error?.code === 'PGRST116') {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    console.error('[tasks/[id] PATCH]', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }

  await withFallback(() => redis.del(`feed:${user.id}`), 0);

  return NextResponse.json({ task: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error, count } = await supabase
    .from('tasks')
    .delete({ count: 'exact' })
    .eq('id', params.id)
    .eq('user_id', user.id); // ownership check — cannot delete another user's task

  if (error) {
    console.error('[tasks/[id] DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }

  if (count === 0) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  await withFallback(() => redis.del(`feed:${user.id}`), 0);

  return NextResponse.json({ success: true });
}
