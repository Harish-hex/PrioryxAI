// Problem Complete API Route
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 20

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    platform: string;
    problemId: string;
    problemTitle: string;
    topic?: string;
    difficulty?: string;
    completed: boolean;
  };

  const { error } = await supabase.from('problem_progress').upsert({
    user_id: user.id,
    platform: body.platform,
    problem_id: body.problemId,
    problem_title: body.problemTitle,
    topic: body.topic,
    difficulty: body.difficulty,
    completed: body.completed,
    completed_at: body.completed ? new Date().toISOString() : null,
  }, { onConflict: 'user_id,platform,problem_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
