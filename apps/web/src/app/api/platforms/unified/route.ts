import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server';
import { getMockProfile } from '@/lib/mock-db';
import { redis, withFallback } from '@/lib/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const CACHE_TTL = 120; // seconds — same window as /api/stats; short enough that a fresh sync shows up quickly without needing explicit cache invalidation

export async function GET(_req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cacheKey = `unified:${user.id}`;
    const cached = await withFallback(() => redis.get(cacheKey), null);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Reads go through the service role. The anon cookie client is RLS-bound,
    // and `.single()` returns an *error* (PGRST116) on zero rows rather than
    // null — together these made a connected profile look disconnected in
    // production, which is why the UI kept asking users to reconnect.
    const db = createServiceRoleClient();

    // The connect routes (`/api/leetcode/connect`, `/api/hackerrank/connect`)
    // upsert into `leetcode_profiles` and `multi_platform_profiles` — read
    // from those same tables here. A previous version of this route read
    // from `coding_profiles`, which is only populated by the research agent
    // and never by the connect flow, so a freshly connected profile never
    // showed up here and the UI kept asking users to reconnect.
    const [{ data: lcProfile, error: lcError }, { data: hrProfile, error: hrError }] = await Promise.all([
      db
        .from('leetcode_profiles')
        .select(
          'leetcode_username, solved_data, skill_stats, contest_info, placement_readiness_score, ai_analysis, last_synced_at'
        )
        .eq('user_id', user.id)
        .maybeSingle(),
      db
        .from('multi_platform_profiles')
        .select(
          'hackerrank_username, hackerrank_data, hackerrank_score, codechef_data, gfg_data, codeforces_data, last_synced_at'
        )
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    if (lcError) console.error('[Unified] LeetCode profile query error:', lcError.message);
    if (hrError) console.error('[Unified] HackerRank profile query error:', hrError.message);

    console.log(
      '[Unified] Profile:',
      '| LC:', lcProfile?.leetcode_username ?? 'none',
      '| HR:', hrProfile?.hackerrank_username ?? 'none'
    );

    let lcData: any = lcProfile?.leetcode_username ? {
      leetcode_username: lcProfile.leetcode_username,
      placement_readiness_score: lcProfile.placement_readiness_score,
      solved_data: lcProfile.solved_data ?? null,
      skill_stats: lcProfile.skill_stats ?? null,
      contest_info: lcProfile.contest_info ?? null,
      ai_analysis: lcProfile.ai_analysis ?? null,
      last_synced_at: lcProfile.last_synced_at,
    } : null;

    let hrData: any = hrProfile?.hackerrank_username ? {
      hackerrank_username: hrProfile.hackerrank_username,
      hackerrank_score: hrProfile.hackerrank_score ?? 0,
      hackerrank_data: hrProfile.hackerrank_data ?? null,
      codechef_data: hrProfile.codechef_data ?? null,
      gfg_data: hrProfile.gfg_data ?? null,
      codeforces_data: hrProfile.codeforces_data ?? null,
      last_synced_at: hrProfile.last_synced_at,
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

    const hasLC = !!lcProfile?.leetcode_username;
    const hasHR = !!hrProfile?.hackerrank_username;

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

    const result = {
      overallScore: Math.round(overallScore),
      // Explicit connection flags so the UI never has to infer "connected"
      // from the presence of a nested field.
      connected: {
        leetcode: hasLC || !!lcData?.leetcode_username,
        hackerrank: hasHR || !!hrData?.hackerrank_username,
      },
      leetcode: lcData || null,
      multiPlatform: hrData || null,
    };
    await withFallback(() => redis.set(cacheKey, result, { ex: CACHE_TTL }), undefined);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[Unified] Unhandled error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
