import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server';
import { fetchMultiPlatformProfiles, analyzeHackerRankProfile } from '@/lib/hackerrank/cps-client';
import { analyzeHackerRankWithAI, generateHRPracticeProblems } from '@/lib/hackerrank/ai-analyzer';
import { saveMockProfile } from '@/lib/mock-db';

export const maxDuration = 60;
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The coding-profile-service is Render-hosted and cold-starts, so a fetch can
 * time out for an already-connected user. Reporting "profile not found" in
 * that case drops the UI's connection state, so fall back to stored data.
 */
async function getCachedHackerRankProfile(
  userId: string,
  db: ReturnType<typeof createServiceRoleClient>
) {
  const { data, error } = await db
    .from('multi_platform_profiles')
    .select('hackerrank_username, hackerrank_score, hackerrank_data, last_synced_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[hackerrank connect] cached read failed:', error.message);
    return null;
  }
  return data?.hackerrank_username ? data : null;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Service role for all writes — RLS on the anon cookie client was
    // rejecting these upserts in production.
    const supabase = createServiceRoleClient();

    const body = await req.json();
    const { codechef_username, gfg_username, codeforces_username, stream, targetCompanies } = body;
    let { hackerrank_username } = body;

    if (!hackerrank_username || !stream || !targetCompanies) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    hackerrank_username = hackerrank_username.trim().replace(/\s+/g, '');

    const fetchedData = await fetchMultiPlatformProfiles({
      hackerrank: hackerrank_username,
      codechef: codechef_username,
      gfg: gfg_username,
      codeforces: codeforces_username,
    });

    if (!fetchedData.hackerrank) {
      // Indistinguishable from a CPS cold-start timeout, so prefer stored data
      // over telling an already-connected user their profile is missing.
      const cached = await getCachedHackerRankProfile(user.id, supabase);
      if (cached) {
        console.warn(
          '[hackerrank connect] fetch failed but cached profile exists — serving cache for',
          cached.hackerrank_username
        );
        const cachedData = cached.hackerrank_data as
          | { badges?: unknown; certifications?: unknown }
          | null;
        return NextResponse.json({
          success: true,
          stale: true,
          quickScore: cached.hackerrank_score ?? 0,
          badges: cachedData?.badges ?? [],
          certifications: cachedData?.certifications ?? [],
          message:
            'HackerRank is slow to respond right now — showing your last synced data. Try syncing again in a minute.',
        });
      }
      return NextResponse.json({ error: 'HackerRank username not found or profile is private' }, { status: 404 });
    }

    const analyzedHR = analyzeHackerRankProfile(fetchedData.hackerrank, stream);

    // Upsert into multi_platform_profiles
    const { error: dbError } = await supabase.from('multi_platform_profiles').upsert({
      user_id: user.id,
      hackerrank_username,
      hackerrank_data: fetchedData.hackerrank as any,
      hackerrank_analysis: analyzedHR as any,
      hackerrank_score: analyzedHR.totalScore,
      codechef_username: codechef_username || null,
      codechef_data: fetchedData.codechef as any,
      gfg_username: gfg_username || null,
      gfg_data: fetchedData.gfg as any,
      codeforces_username: codeforces_username || null,
      codeforces_data: fetchedData.codeforces as any,
      stream,
      target_companies: targetCompanies,
      last_synced_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (dbError) {
      if (dbError.code === 'PGRST205' || dbError.message?.includes('could not find the table')) {
        console.warn('multi_platform_profiles table missing! Using local mock db fallback.');
        saveMockProfile('hackerrank', user.id, {
          hackerrank_username,
          hackerrank_data: fetchedData.hackerrank,
          hackerrank_analysis: analyzedHR,
          hackerrank_score: analyzedHR.totalScore,
          stream,
          target_companies: targetCompanies,
        });
      } else {
        console.error('DB Error:', dbError);
        return NextResponse.json({ error: 'Failed to save profile data' }, { status: 500 });
      }
    }

    // 4.5. Also upsert to unified user_coding_profiles table
    await supabase.from('user_coding_profiles').upsert({
      user_id: user.id,
      platform: 'hackerrank',
      username: hackerrank_username,
      data: fetchedData.hackerrank,
      connected: true,
      last_synced: new Date().toISOString()
    }, { onConflict: 'user_id,platform' }).then(res => res, (e: any) => console.warn('user_coding_profiles upsert warn:', e.message));

    // AI analysis — previously fire-and-forget, which never completed on
    // Vercel because the serverless instance freezes as soon as the response
    // is returned. The profile is already saved above, so a failure here
    // degrades gracefully instead of failing the connection.
    try {
      const aiAnalysis = await analyzeHackerRankWithAI(analyzedHR, stream, targetCompanies);

      const earnedBadges = analyzedHR.raw.badges || [];
      const missingBadges = analyzedHR.missingBadges || [];
      const practiceRecs = await generateHRPracticeProblems(stream, missingBadges, earnedBadges, targetCompanies);

      await supabase.from('multi_platform_profiles').update({
        ai_analysis: aiAnalysis as any,
        hr_practice_recommendations: practiceRecs as any,
      }).eq('user_id', user.id);
    } catch (e) {
      console.error('[hackerrank connect] AI analysis failed (profile still saved):', e);
    }

    return NextResponse.json({
      success: true,
      quickScore: analyzedHR.totalScore,
      badges: fetchedData.hackerrank.badges,
      certifications: fetchedData.hackerrank.certifications,
    });
  } catch (err: any) {
    console.error('Connect Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
