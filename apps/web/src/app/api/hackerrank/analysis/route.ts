import { NextResponse } from 'next/server';
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server';
import { getMockProfile } from '@/lib/mock-db';
import { withFallback, redis } from '@/lib/redis';

export const maxDuration = 30;
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HACKERRANK_ANALYSIS_CACHE_TTL = 60; // seconds — short since analysis can still be "in progress"

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cacheKey = `hackerrank-analysis:${user.id}`;
    const cached = await withFallback(() => redis.get(cacheKey), null);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Reads go through the service role. This route previously built an inline
    // anon cookie client and used `.single()`, which raises PGRST116 on zero
    // rows — so a connected account read back as an error, fell through to the
    // file-backed mock (impossible on Vercel's read-only FS) and returned 404,
    // which the UI renders as "not connected". Same defect as the LeetCode
    // profile route.
    const db = createServiceRoleClient();

    const { data, error } = await db
      .from('multi_platform_profiles')
      .select(
        'hackerrank_username, hackerrank_score, ai_analysis, hr_practice_recommendations, hackerrank_analysis, last_synced_at'
      )
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[HR Analysis] query error:', error.message);
    }

    let profileData: any = data;

    if (!profileData && process.env.NODE_ENV === 'development') {
      profileData = getMockProfile('hackerrank', user.id) ?? null;
    }

    console.log(
      '[HR Analysis] user:', user.id,
      '| HR:', profileData?.hackerrank_username ?? 'NULL',
      '| analysis:', profileData?.ai_analysis ? 'ready' : 'pending'
    );

    // Distinguish "never connected" from "connected, analysis still running".
    // The old code returned 404 for both, so a connected user with a pending
    // analysis was told to reconnect.
    if (!profileData?.hackerrank_username) {
      return NextResponse.json(
        { connected: false, error: 'Not found' },
        { status: 404 }
      );
    }

    if (!profileData.ai_analysis) {
      return NextResponse.json(
        {
          connected: true,
          status: 'analyzing',
          hackerrank_username: profileData.hackerrank_username,
          hackerrank_score: profileData.hackerrank_score ?? 0,
        },
        { status: 202 }
      );
    }

    const responseBody = {
      connected: true,
      hackerrank_username: profileData.hackerrank_username,
      hackerrank_score: profileData.hackerrank_score ?? 0,
      ai_analysis: profileData.ai_analysis,
      hr_practice_recommendations: profileData.hr_practice_recommendations,
      hackerrank_analysis: profileData.hackerrank_analysis,
    };
    await withFallback(() => redis.set(cacheKey, responseBody, { ex: HACKERRANK_ANALYSIS_CACHE_TTL }), undefined);
    return NextResponse.json(responseBody);
  } catch (err: any) {
    console.error('[HR Analysis] Unhandled error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
