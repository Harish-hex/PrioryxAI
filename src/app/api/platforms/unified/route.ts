import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server';
import { getMockProfile } from '@/lib/mock-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(_req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Reads go through the service role. The anon cookie client is RLS-bound,
    // and `.single()` returns an *error* (PGRST116) on zero rows rather than
    // null — together these made a connected profile look disconnected in
    // production, which is why the UI kept asking users to reconnect.
    const db = createServiceRoleClient();

    // NOTE: The research agent writes to `coding_profiles` (one row per user),
    // which has leetcode_stats and hackerrank_stats as JSONB columns.
    // We read from that single table instead of the non-existent leetcode_profiles
    // and multi_platform_profiles tables.
    const { data: profile, error: profileError } = await db
      .from('coding_profiles')
      .select(
        'user_id, leetcode_username, leetcode_stats, hackerrank_username, hackerrank_stats, placement_readiness_score, last_synced'
      )
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[Unified] Profile query error:', profileError.message);
    }

    console.log(
      '[Unified] Profile:',
      profile ? 'found' : 'none',
      '| LC:', profile?.leetcode_username ?? 'none',
      '| HR:', profile?.hackerrank_username ?? 'none'
    );

    // Extract LeetCode data from JSONB
    const lcStats = (profile?.leetcode_stats ?? {}) as Record<string, unknown>;
    const hrStats = (profile?.hackerrank_stats ?? {}) as Record<string, unknown>;

    let lcData: any = profile ? {
      leetcode_username: profile.leetcode_username,
      placement_readiness_score: profile.placement_readiness_score,
      solved_data: lcStats.totalSolved ?? null,
      skill_stats: lcStats.topicBreakdown ?? null,
      contest_info: {
        rating: lcStats.contestRating ?? null,
        contests_attended: lcStats.contestsAttended ?? null,
      },
      ai_analysis: lcStats.aiAnalysis ?? null,
      last_synced_at: profile.last_synced,
    } : null;

    let hrData: any = profile?.hackerrank_username ? {
      hackerrank_username: profile.hackerrank_username,
      hackerrank_score: hrStats.totalScore ?? 0,
      codechef_data: hrStats.codechef ?? null,
      gfg_data: hrStats.gfg ?? null,
      codeforces_data: hrStats.codeforces ?? null,
    } : null;

    // The mock-db fallback is file-backed and cannot work on Vercel's
    // read-only filesystem — keep it for local dev only.
    if (!lcData && process.env.NODE_ENV === 'development') {
      const mockLc = getMockProfile('leetcode', user.id);
      if (mockLc) {
        lcData = {
          ai_analysis: mockLc.ai_analysis ?? null,
          placement_readiness_score:
            mockLc.placement_readiness_score ?? mockLc.quickScore ?? 45,
          leetcode_username: mockLc.profile?.username ?? mockLc.username,
          solved_data: mockLc.solved ?? null,
          skill_stats: mockLc.skillStats ?? null,
          contest_info: mockLc.contestInfo ?? mockLc.contest_info ?? null,
          last_synced_at: new Date().toISOString(),
        };
      }
    }

    if (!hrData && process.env.NODE_ENV === 'development') {
      const mockHr = getMockProfile('hackerrank', user.id);
      if (mockHr) hrData = mockHr;
    }

    const hasLC = !!profile?.leetcode_username;
    const hasHR = !!profile?.hackerrank_username;

    let lcScore = Number(lcData?.placement_readiness_score ?? 0);
    let hrScore = Number(hrData?.hackerrank_score ?? 0);

    let bonusScore = 0;
    let bonusCount = 0;

    if (hrData) {
      // Very simple bonus score averaging from rating logic
      if (hrData.codechef_data?.rating) {
        bonusScore += Math.min((Number(hrData.codechef_data.rating) / 2500) * 100, 100);
        bonusCount++;
      }
      if (hrData.gfg_data?.totalSolved) {
        bonusScore += Math.min((Number(hrData.gfg_data.totalSolved) / 500) * 100, 100);
        bonusCount++;
      }
      if (hrData.codeforces_data?.rating) {
        bonusScore += Math.min((Number(hrData.codeforces_data.rating) / 2500) * 100, 100);
        bonusCount++;
      }
    }

    let overallScore = 0;
    const avgBonus = bonusCount > 0 ? bonusScore / bonusCount : 0;

    if (lcScore > 0 && hrScore > 0) {
      overallScore = lcScore * 0.55 + hrScore * 0.3 + avgBonus * 0.15;
    } else if (hrScore > 0) {
      overallScore = hrScore * 0.6 + avgBonus * 0.4;
    } else if (lcScore > 0) {
      overallScore = lcScore;
    }

    return NextResponse.json({
      overallScore: Math.round(overallScore),
      // Explicit connection flags so the UI never has to infer "connected"
      // from the presence of a nested field.
      connected: {
        leetcode: hasLC || !!lcData?.leetcode_username,
        hackerrank: hasHR || !!hrData?.hackerrank_username,
      },
      leetcode: lcData || null,
      multiPlatform: hrData || null,
    });
  } catch (err: any) {
    console.error('[Unified] Unhandled error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
