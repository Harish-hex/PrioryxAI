export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAggregatedUserContributions } from '@/lib/activity-aggregator';

export const maxDuration = 20;
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    // This previously accepted an arbitrary `userId` query param with no auth
    // check at all — anyone could pull any other user's private activity
    // timeline. Always use the caller's own id; there's no legitimate case
    // for viewing someone else's raw contribution data through this route
    // (no client code even calls it).
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

    const url = new URL(req.url);
    const daysParam = url.searchParams.get('days');
    const daysBack = daysParam ? Math.min(365, Math.max(30, parseInt(daysParam, 10))) : 365;

    const { data: github } = await supabase
      .from('github_cache')
      .select('contribution_days, streak_days')
      .eq('user_id', userId)
      .maybeSingle();

    const aggregated = await getAggregatedUserContributions(userId, supabase, github, daysBack);

    return NextResponse.json({
      contributions: aggregated.contribution_days,
      streak_days: aggregated.streak_days,
      total_contributions: aggregated.total_contributions,
      internal_count: aggregated.internal_count,
      github_count: aggregated.github_count,
    });
  } catch (error: any) {
    console.error('[contributions] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch contributions' }, { status: 500 });
  }
}

