import { NextResponse } from 'next/server';
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server';
import { analyzeProfile, generateProblemRecommendations } from '@/lib/leetcode/ai-analyzer';
import { FullLeetCodeData, PriorityTopic, UserStream } from '@/lib/leetcode/types';
import { withFallback, redis } from '@/lib/redis';

const RECOMMENDATIONS_CACHE_TTL = 120; // seconds

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PRIORITY_RANK: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cacheKey = `leetcode-recommendations:${user.id}`;
  const cached = await withFallback(() => redis.get(cacheKey), null);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Service role: the anon cookie client is RLS-bound in production, which
  // was making an already-generated plan look empty on this page.
  const db = createServiceRoleClient();

  const { data, error } = await db
    .from('problem_recommendations')
    .select('*')
    .eq('user_id', user.id)
    .limit(200);

  if (error) {
    console.error('[recommendations GET]', error);
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
  }

  const sorted = (data || []).sort((a, b) => {
    const rankDiff = (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
    if (rankDiff !== 0) return rankDiff;
    return (a.topic || '').localeCompare(b.topic || '');
  });

  const responseBody = { data: sorted };
  await withFallback(() => redis.set(cacheKey, responseBody, { ex: RECOMMENDATIONS_CACHE_TTL }), undefined);
  return NextResponse.json(responseBody);
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceRoleClient();

  try {
    const { regenerate } = await req.json().catch(() => ({ regenerate: false }));

    if (regenerate) {
      await db.from('problem_recommendations').delete().eq('user_id', user.id);
    } else {
      const { count } = await db
        .from('problem_recommendations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (count && count > 0) {
        return NextResponse.json({ message: 'Recommendations already exist' });
      }
    }

    const { data: profile, error: profileError } = await db
      .from('leetcode_profiles')
      .select('profile_data, solved_data, skill_stats, contest_info, contest_history, calendar_data, language_stats, badges, ai_analysis')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[recommendations POST] profile query error:', profileError.message);
    }

    if (!profile) {
      return NextResponse.json({ error: 'Connect your LeetCode profile first' }, { status: 400 });
    }

    const { data: userRow } = await db
      .from('users')
      .select('target_roles, target_companies')
      .eq('id', user.id)
      .maybeSingle();

    const stream = (userRow?.target_roles?.[0] as UserStream) || 'SDE';
    const targetCompanies: string[] = userRow?.target_companies || [];

    let analysis = profile.ai_analysis as any;

    // The AI analysis normally runs during /connect, but it can be missing
    // (an older connection, or the connect-time call failed/timed out). Rather
    // than dead-ending the user with "AI Analysis required first" and no way
    // to recover, generate it here on demand from the already-synced profile.
    if (!analysis || !analysis.priority_topics?.length) {
      const fullData: FullLeetCodeData = {
        profile: profile.profile_data,
        solved: profile.solved_data,
        skillStats: profile.skill_stats,
        contestInfo: profile.contest_info,
        contestHistory: profile.contest_history,
        calendar: profile.calendar_data,
        languageStats: profile.language_stats,
        badges: profile.badges,
      };

      try {
        analysis = await analyzeProfile(fullData, stream, targetCompanies);
        await db.from('leetcode_profiles').update({ ai_analysis: analysis }).eq('user_id', user.id);
      } catch (e) {
        console.error('[recommendations POST] on-demand AI analysis failed:', e);
        return NextResponse.json(
          { error: 'Could not analyze your LeetCode profile right now. Please try again in a minute.' },
          { status: 502 }
        );
      }
    }

    const topics: PriorityTopic[] = analysis.priority_topics || [];
    if (topics.length === 0) {
      return NextResponse.json(
        { error: 'Not enough solved problems yet to build a study plan — solve a few more on LeetCode and try again.' },
        { status: 400 }
      );
    }

    const recommendations = await generateProblemRecommendations(stream, topics, targetCompanies);

    if (recommendations.length === 0) {
      // The problem-fetch API (Alfa LeetCode API) or the AI selection step
      // failed for every priority topic — don't report success on an empty
      // plan, since that leaves the page silently stuck on the empty state.
      return NextResponse.json(
        { error: 'Could not fetch problems for your priority topics right now. This is usually a temporary issue with the problem database — try again in a minute.' },
        { status: 502 }
      );
    }

    const inserts = recommendations.map(r => ({
      user_id: user.id,
      ...r
    }));
    const { error: insertError } = await db.from('problem_recommendations').insert(inserts);
    if (insertError) {
      console.error('[recommendations POST] insert error:', insertError.message);
      return NextResponse.json({ error: 'Failed to save the generated study plan' }, { status: 500 });
    }

    await withFallback(() => redis.del(`leetcode-recommendations:${user.id}`), 0);
    return NextResponse.json({ success: true, count: recommendations.length });

  } catch (error) {
    console.error('[recommendations POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
