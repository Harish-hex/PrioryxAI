/**
 * Priority Plan API — Bug 8B
 * Returns AI-generated priority tasks from the priority engine.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePriorityPlan } from '@/lib/priority/engine';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const plan = await generatePriorityPlan(user.id);
    return NextResponse.json(plan);
  } catch (e) {
    console.error('[Priority API] Error:', e);
    return NextResponse.json({ error: 'Failed to generate priority plan' }, { status: 500 });
  }
}
