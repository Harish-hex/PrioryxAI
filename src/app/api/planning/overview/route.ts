import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildUserContext } from '@/lib/context/user-context';
import { buildWorkloadPlan } from '@/lib/planning/temporal';

export const runtime = 'nodejs';
export const maxDuration = 20;

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const context = await buildUserContext(supabase, user.id, { includeFeedback: true });
  return NextResponse.json({ planning: buildWorkloadPlan(context) });
}
