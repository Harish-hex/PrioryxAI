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

    // NOTE ON COLUMNS: PostgREST fails the *whole* query with 42703 if any
    // selected column is unknown, which would null the result and reproduce
    // the very "please reconnect" bug this route exists to fix. Neither table
    // has `rating` or `updated_at` — the freshness column is `last_synced_at`
    // on both (see supabase-migration-v6/v7). Do not add columns here without
    // checking the migration first.
    const [lcResult, hrResult] = await Promise.allSettled([
      db
        .from('leetcode_profiles')
        .select(
          'user_id, leetcode_username, placement_readiness_score, solved_data, skill_stats, contest_info, ai_analysis, last_synced_at'
        )
        .eq('user_id', user.id)
        .maybeSingle(),
      db
        .from('multi_platform_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    console.log(
      '[Unified] LC:',
      lcResult.status,
      lcResult.status === 'fulfilled'
        ? lcResult.value.data?.leetcode_username ?? 'NULL'
        : lcResult.reason
    );
    console.log(
      '[Unified] HR:',
      hrResult.status,
      hrResult.status === 'fulfilled'
        ? hrResult.value.data?.hackerrank_username ?? 'NULL'
        : hrResult.reason
    );

    if (lcResult.status === 'fulfilled' && lcResult.value.error) {
      console.error('[Unified] LeetCode query error:', lcResult.value.error.message);
    }
    if (hrResult.status === 'fulfilled' && hrResult.value.error) {
      console.error('[Unified] HackerRank query error:', hrResult.value.error.message);
    }

    let lcData: any =
      lcResult.status === 'fulfilled' ? lcResult.value.data ?? null : null;
    let hrData: any =
      hrResult.status === 'fulfilled' ? hrResult.value.data ?? null : null;

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
        };
      }
    }

    if (!hrData && process.env.NODE_ENV === 'development') {
      const mockHr = getMockProfile('hackerrank', user.id);
      if (mockHr) hrData = mockHr;
    }

    console.log(
      '[Unified] user:', user.id,
      '| LC:', lcData?.leetcode_username ?? 'none',
      '| HR:', hrData?.hackerrank_username ?? 'none'
    );

    const hasLC =
      lcResult.status === 'fulfilled' && !!lcResult.value.data?.leetcode_username;
    const hasHR =
      hrResult.status === 'fulfilled' && !!hrResult.value.data?.hackerrank_username;

    let combinedScore = 0;
    let maxScore = 0;

    let lcScore = 0;
    if (lcData?.placement_readiness_score) {
      lcScore = lcData.placement_readiness_score;
      maxScore += 100;
      combinedScore += lcScore;
    }

    let hrScore = 0;
    let bonusScore = 0;
    let bonusCount = 0;

    if (hrData) {
      hrScore = hrData.hackerrank_score || 0;
      if (hrScore > 0) {
        maxScore += 100;
        combinedScore += hrScore;
      }

      // Very simple bonus score averaging from rating logic
      if (hrData.codechef_data?.rating) {
        bonusScore += Math.min((hrData.codechef_data.rating / 2500) * 100, 100);
        bonusCount++;
      }
      if (hrData.gfg_data?.totalSolved) {
        bonusScore += Math.min((hrData.gfg_data.totalSolved / 500) * 100, 100);
        bonusCount++;
      }
      if (hrData.codeforces_data?.rating) {
        bonusScore += Math.min((hrData.codeforces_data.rating / 2500) * 100, 100);
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
        // hasLC/hasHR come straight off the query; the `||` keeps the dev-only
        // mock fallback above working without weakening the production signal.
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
