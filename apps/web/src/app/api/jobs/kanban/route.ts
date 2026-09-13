import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const STAGES = ['saved', 'applied', 'interview', 'offer', 'rejected'] as const;
type Stage = typeof STAGES[number];

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: jobs, error } = await supabase
    .from('tasks')
    .select('id, title, subject, due_at, stage, external_url, stipend, created_at')
    .eq('user_id', user.id)
    .eq('type', 'job')
    .eq('completed', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[jobs/kanban]', error);
    return NextResponse.json({ error: 'Failed to load jobs' }, { status: 500 });
  }

  // Group by stage
  const kanban = Object.fromEntries(STAGES.map(s => [s, [] as typeof jobs])) as Record<Stage, typeof jobs>;
  for (const job of jobs ?? []) {
    const stage = (job.stage ?? 'saved') as Stage;
    if (kanban[stage]) kanban[stage]!.push(job);
  }

  return NextResponse.json({ kanban });
}
