import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { fetchMultiPlatformProfiles, analyzeHackerRankProfile } from '@/lib/hackerrank/cps-client';
import { analyzeHackerRankWithAI, generateHRPracticeProblems } from '@/lib/hackerrank/ai-analyzer';
import { saveMockProfile } from '@/lib/mock-db';

export const maxDuration = 30;

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

    const body = await req.json();
    let { hackerrank_username, codechef_username, gfg_username, codeforces_username, stream, targetCompanies } = body;

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

    // Fire-and-forget: AI Analysis
    (async () => {
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
        console.error('Background AI task failed', e);
      }
    })();

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
