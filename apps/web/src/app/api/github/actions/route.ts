import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 20

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: actions } = await supabase
    .from('github_priority_actions')
    .select('*')
    .eq('user_id', user.id)
    .order('impact_score', { ascending: false })
    .limit(30);

  const { data: analysis } = await supabase
    .from('github_analysis')
    .select('*')
    .eq('user_id', user.id)
    .order('total_score', { ascending: false });

  return NextResponse.json({ actions: actions ?? [], analysis: analysis ?? [] });
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, completed } = await req.json() as { id: string; completed: boolean };

  const { error } = await supabase
    .from('github_priority_actions')
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
