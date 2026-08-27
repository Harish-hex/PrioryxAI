import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withFallback, redis } from '@/lib/redis';

export const runtime = 'nodejs';

const VALID_TYPES = ['exam', 'assignment', 'job', 'manual'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 300) : '';
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

  const type = VALID_TYPES.includes(body.type) ? body.type : 'manual';

  const priority = VALID_PRIORITIES.includes(body.priority) ? body.priority : 'medium';

  let due_at: string | null = null;
  if (body.due_at) {
    const d = new Date(body.due_at);
    if (!isNaN(d.getTime())) due_at = d.toISOString();
  }

  let deadline: string | null = null;
  if (body.deadline) {
    const d = new Date(body.deadline);
    if (!isNaN(d.getTime())) deadline = d.toISOString();
  }

  const subject = typeof body.subject === 'string' ? body.subject.slice(0, 100) : null;
  const weightage = typeof body.weightage === 'number' ? Math.min(100, Math.max(0, body.weightage)) : null;

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({ user_id: user.id, title, type, due_at, deadline, priority, subject, weightage, completed: false })
    .select()
    .single();

  if (error) {
    console.error('[tasks POST]', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }

  await withFallback(() => redis.del(`feed:${user.id}`), 0);

  return NextResponse.json({ task }, { status: 201 });
}
