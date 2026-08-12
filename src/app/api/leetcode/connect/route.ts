import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchFullLeetCodeProfile, fetchSolved, fetchProfile } from '@/lib/leetcode/alfa-api';
import { computePlacementReadinessScore, analyzeProfile } from '@/lib/leetcode/ai-analyzer';
import { saveMockProfile } from '@/lib/mock-db';
import { UserStream } from '@/lib/leetcode/types';

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await (await supabase).auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { username: rawUsername, stream, targetCompanies } = await req.json() as { username: string, stream: UserStream, targetCompanies: string[] };
    const username = rawUsername.trim().replace(/\s+/g, '');

    // 1. Validate username exists by checking solved endpoint first
    const solvedData = await fetchSolved(username);
    let isValid = false;

    if (solvedData && typeof solvedData.solvedProblem === 'number') {
      isValid = true;
    } else {
      // Fallback: Direct GraphQL query
      try {
        const gqlRes = await fetch('https://leetcode.com/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `query userPublicProfile($username: String!) {
              matchedUser(username: $username) {
                username
              }
            }`,
            variables: { username }
          })
        });
        const gqlData = await gqlRes.json();
        if (gqlData?.data?.matchedUser?.username === username) {
          isValid = true;
        }
      } catch (e) {
        console.error('[LeetCode Fallback] GraphQL check failed:', e);
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Username not found on LeetCode' }, { status: 404 });
    }

    // 2. Fetch all data in parallel
    const fullData = await fetchFullLeetCodeProfile(username);

    // 3. Fast deterministic score
    const quickScore = computePlacementReadinessScore(fullData, stream);

    // 4. Upsert into leetcode_profiles
    const { error: dbError } = await (await supabase).from('leetcode_profiles').upsert({
      user_id: user.id,
      leetcode_username: username,
      profile_data: fullData.profile,
      solved_data: fullData.solved,
      skill_stats: fullData.skillStats,
      contest_info: fullData.contestInfo,
      contest_history: fullData.contestHistory,
      calendar_data: fullData.calendar,
      language_stats: fullData.languageStats,
      badges: fullData.badges,
      placement_readiness_score: quickScore,
      last_synced_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    if (dbError) {
      if (dbError.code === 'PGRST205' || dbError.message?.includes('could not find the table')) {
        console.warn('leetcode_profiles table missing! Using local mock db fallback.');
        saveMockProfile('leetcode', user.id, fullData);
      } else {
        throw dbError;
      }
    }

    // 4.5. Also upsert to unified user_coding_profiles table
    await (await supabase).from('user_coding_profiles').upsert({
      user_id: user.id,
      platform: 'leetcode',
      username: username,
      data: fullData,
      connected: true,
      last_synced: new Date().toISOString()
    }, { onConflict: 'user_id,platform' }).then(res => res, e => console.warn('user_coding_profiles upsert warn:', e.message));

    // 5. Trigger background analysis (Fire and forget)
    // We don't await this so the UI can proceed immediately
    analyzeProfile(fullData, stream, targetCompanies).then(async (analysis) => {
      // Store the result
      const client = await createClient();
      await client.from('leetcode_ai_analyses').insert({
        user_id: user.id,
        analysis_type: 'full',
        analysis_data: analysis
      });
      // Update the profile with latest analysis cache
      await client.from('leetcode_profiles').update({ ai_analysis: analysis }).eq('user_id', user.id);
    }).catch(e => console.error("Background analysis failed:", e));

    // 6. Return success
    return NextResponse.json({
      success: true,
      quickScore,
      username,
      profile: fullData.profile
    });
  } catch (error) {
    console.error('[leetcode connect] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
