import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Returns last 30 readiness score rows for the sparkline trend chart.
 * Sorted ascending (oldest first) so recharts draws left-to-right.
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data } = await supabase
    .from('readiness_scores')
    .select('score, computed_at')
    .eq('user_id', user.id)
    .order('computed_at', { ascending: false })
    .limit(30);

  // Reverse so chart shows oldest → newest left to right
  const history = (data ?? []).reverse();

  return NextResponse.json({ history });
}
