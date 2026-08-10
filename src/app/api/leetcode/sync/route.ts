import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchFullLeetCodeProfile } from '@/lib/leetcode/alfa-api';
import { computePlacementReadinessScore } from '@/lib/leetcode/ai-analyzer';
import { UserStream } from '@/lib/leetcode/types';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: profileRow } = await supabase
      .from('leetcode_profiles')
      .select('leetcode_username, last_synced_at')
      .eq('user_id', user.id)
      .single();

    if (!profileRow) {
      return NextResponse.json({ error: 'Profile not connected' }, { status: 400 });
    }

    const lastSynced = new Date(profileRow.last_synced_at);
    const now = new Date();
    const diffMins = (now.getTime() - lastSynced.getTime()) / 60000;

    if (diffMins < 30) {
      return NextResponse.json({
        rateLimited: true,
        nextSyncIn: Math.round((30 - diffMins) * 60)
      }, { status: 429 });
    }

    // Default to SDE stream if not provided, just for fast scoring
    const body = await req.json().catch(() => ({}));
    const stream = (body.stream as UserStream) || 'SDE';

    const fullData = await fetchFullLeetCodeProfile(profileRow.leetcode_username);
    const newScore = computePlacementReadinessScore(fullData, stream);

    await supabase.from('leetcode_profiles').update({
      profile_data: fullData.profile,
      solved_data: fullData.solved,
      skill_stats: fullData.skillStats,
      contest_info: fullData.contestInfo,
      contest_history: fullData.contestHistory,
      calendar_data: fullData.calendar,
      language_stats: fullData.languageStats,
      badges: fullData.badges,
      placement_readiness_score: newScore,
      last_synced_at: new Date().toISOString()
    }).eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      profile: fullData.profile,
      score: newScore
    });
  } catch (error) {
    console.error('[leetcode sync] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
