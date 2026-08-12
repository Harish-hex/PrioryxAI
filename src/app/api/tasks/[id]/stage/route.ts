import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withFallback, redis } from '@/lib/redis';

export const maxDuration = 20

export const runtime = 'nodejs';

const VALID_STAGES = ['saved', 'applied', 'interview', 'offer', 'rejected'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const stage: string = body.stage;

  if (!VALID_STAGES.includes(stage)) {
    return NextResponse.json(
      { error: `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}` },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('tasks')
    .update({ stage })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .eq('type', 'job'); // Safety: only job tasks have stages

  if (error) {
    console.error('[tasks/stage]', error);
    return NextResponse.json({ error: 'Failed to update stage' }, { status: 500 });
  }

  // Invalidate feed cache
  await withFallback(() => redis.del(`feed:${user.id}`), 0);

  return NextResponse.json({ success: true, stage });
}
