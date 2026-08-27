import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { fetchMultiPlatformProfiles, analyzeHackerRankProfile } from '@/lib/hackerrank/cps-client';
import { analyzeHackerRankWithAI, generateHRPracticeProblems } from '@/lib/hackerrank/ai-analyzer';

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch existing profile
    const { data: profile, error: fetchError } = await supabase
      .from('multi_platform_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Rate limiting: 6 hours (matching CPS HackerRank TTL)
    const lastSynced = new Date(profile.last_synced_at || 0).getTime();
    const now = Date.now();
    const hoursSinceSync = (now - lastSynced) / (1000 * 60 * 60);

    if (hoursSinceSync < 6) {
      const nextSyncIn = Math.ceil((6 - hoursSinceSync) * 60); // minutes
      return NextResponse.json({ success: true, updated: false, nextSyncIn });
    }

    const fetchedData = await fetchMultiPlatformProfiles({
      hackerrank: profile.hackerrank_username,
      codechef: profile.codechef_username,
      gfg: profile.gfg_username,
      codeforces: profile.codeforces_username,
    });

    if (!fetchedData.hackerrank) {
      return NextResponse.json({ error: 'HackerRank username not found' }, { status: 404 });
    }

    const analyzedHR = analyzeHackerRankProfile(fetchedData.hackerrank, profile.stream);

    // Upsert new data
    await supabase.from('multi_platform_profiles').update({
      hackerrank_data: fetchedData.hackerrank as any,
      hackerrank_analysis: analyzedHR as any,
      hackerrank_score: analyzedHR.totalScore,
      codechef_data: fetchedData.codechef as any,
      gfg_data: fetchedData.gfg as any,
      codeforces_data: fetchedData.codeforces as any,
      last_synced_at: new Date().toISOString(),
    }).eq('user_id', user.id);

    // Re-run AI analysis if data changed significantly (for simplicity, we just run it here if sync passes)
    (async () => {
      try {
        const aiAnalysis = await analyzeHackerRankWithAI(analyzedHR, profile.stream, profile.target_companies);
        const earnedBadges = analyzedHR.raw.badges || [];
        const missingBadges = analyzedHR.missingBadges || [];
        const practiceRecs = await generateHRPracticeProblems(profile.stream, missingBadges, earnedBadges, profile.target_companies);
        
        await supabase.from('multi_platform_profiles').update({
          ai_analysis: aiAnalysis as any,
          hr_practice_recommendations: practiceRecs as any,
        }).eq('user_id', user.id);
      } catch (e) {
        console.error('Background AI task failed', e);
      }
    })();

    return NextResponse.json({ success: true, updated: true });
  } catch (err: any) {
    console.error('Sync Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
