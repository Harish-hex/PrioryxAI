import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { fetchFullLeetCodeProfile, fetchSolved, fetchProfile } from '@/lib/leetcode/alfa-api';
import { computePlacementReadinessScore, analyzeProfile } from '@/lib/leetcode/ai-analyzer';
import { saveMockProfile } from '@/lib/mock-db';
import { UserStream } from '@/lib/leetcode/types';

export const maxDuration = 60;
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The alfa-leetcode API is hosted on Render and cold-starts, so validation can
 * time out for a user who is already connected. Failing with a 404 in that
 * case wipes the UI's connection state and forces a needless reconnect, so we
 * fall back to whatever is already persisted for this user.
 */
async function getCachedLeetCodeProfile(
  userId: string,
  db: ReturnType<typeof createServiceRoleClient>
) {
  const { data, error } = await db
    .from('leetcode_profiles')
    .select('leetcode_username, profile_data, placement_readiness_score, last_synced_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[leetcode connect] cached read failed:', error.message);
    return null;
  }
  return data?.leetcode_username ? data : null;
}

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
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
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
          }),
          signal: controller.signal
        });
        clearTimeout(timeout);
        const gqlData = await gqlRes.json();
        if (gqlData?.data?.matchedUser?.username === username) {
          isValid = true;
        }
      } catch (e) {
        console.error('[LeetCode Fallback] GraphQL check failed:', e);
      }
    }

    // Service role: the anon cookie client is RLS-bound and these upserts were
    // being rejected in production, so the profile never persisted and the UI
    // fell back to asking the user to reconnect.
    const db = createServiceRoleClient();

    if (!isValid) {
      // Can't tell "bad username" from "Render cold-start timeout" here, so if
      // this user already has a stored profile, serve it rather than reporting
      // the account as missing.
      const cached = await getCachedLeetCodeProfile(user.id, db);
      if (cached) {
        console.warn(
          '[leetcode connect] validation failed but cached profile exists — serving cache for',
          cached.leetcode_username
        );
        return NextResponse.json({
          success: true,
          stale: true,
          quickScore: cached.placement_readiness_score ?? 0,
          username: cached.leetcode_username,
          profile: cached.profile_data,
          message:
            'LeetCode is slow to respond right now — showing your last synced data. Try syncing again in a minute.',
        });
      }
      return NextResponse.json({ error: 'Username not found on LeetCode' }, { status: 404 });
    }

    // 2. Fetch all data in parallel
    const fullData = await fetchFullLeetCodeProfile(username);

    // 3. Fast deterministic score
    const quickScore = computePlacementReadinessScore(fullData, stream);

    // 4. Upsert into leetcode_profiles (service-role `db` created above).
    const { error: dbError } = await db.from('leetcode_profiles').upsert({
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
    const { error: ucpError } = await db.from('user_coding_profiles').upsert({
      user_id: user.id,
      platform: 'leetcode',
      username: username,
      data: fullData,
      connected: true,
      last_synced: new Date().toISOString()
    }, { onConflict: 'user_id,platform' });
    if (ucpError) console.warn('user_coding_profiles upsert warn:', ucpError.message);

    // 5. AI analysis.
    // This used to be fire-and-forget. On Vercel the serverless instance is
    // frozen the moment the response is returned, so the analysis was killed
    // mid-flight and `ai_analysis` never landed — it only ever worked locally.
    // The profile and score are already persisted above, so a failure here
    // degrades gracefully rather than failing the connection.
    try {
      const analysis = await analyzeProfile(fullData, stream, targetCompanies);

      await Promise.all([
        db.from('leetcode_ai_analyses').insert({
          user_id: user.id,
          analysis_type: 'full',
          analysis_data: analysis,
        }),
        db.from('leetcode_profiles')
          .update({ ai_analysis: analysis })
          .eq('user_id', user.id),
      ]);
    } catch (e) {
      console.error('[leetcode connect] AI analysis failed (profile still saved):', e);
    }

    // Invalidate the public/unified profile cache so the newly connected
    // platform data shows up immediately instead of waiting out the TTL.
    try {
      const { withFallback, redis } = await import('@/lib/redis');
      const { data: userRow } = await db.from('users').select('username').eq('id', user.id).maybeSingle();
      if (userRow?.username) {
        await withFallback(() => redis.del(`profile:${userRow.username}`), 0);
      }
      await withFallback(() => redis.del(`user-profile:${user.id}`), 0);
      await withFallback(() => redis.del(`leetcode-profile:${user.id}`), 0);
      await withFallback(() => redis.del(`leetcode-analysis:${user.id}`), 0);
      await withFallback(() => redis.del(`leetcode-recommendations:${user.id}`), 0);
    } catch (e) {
      console.warn('[leetcode connect] profile cache invalidation warn:', e);
    }

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
