import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server';
import { analyzeHackerRankProfile } from '@/lib/hackerrank/cps-client';
import { generateHRPracticeProblems } from '@/lib/hackerrank/ai-analyzer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 20;

/**
 * Practice recommendations are deterministic (badge-map driven, no external
 * API/AI calls) — safe and fast to (re)compute from already-synced profile
 * data whenever they're missing, instead of depending on them having been
 * generated successfully at connect time.
 */
async function computePracticeRecommendations(
  db: ReturnType<typeof createServiceRoleClient>,
  userId: string
) {
  const { data: profile, error } = await db
    .from('multi_platform_profiles')
    .select('hackerrank_data, stream, target_companies')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!profile?.hackerrank_data) return null;

  const stream = profile.stream || 'SDE';
  const targetCompanies: string[] = profile.target_companies || [];
  const analyzed = analyzeHackerRankProfile(profile.hackerrank_data, stream);
  const earnedBadges = analyzed.raw.badges || [];
  const missingBadges = analyzed.missingBadges || [];

  const recommendations = await generateHRPracticeProblems(stream, missingBadges, earnedBadges, targetCompanies);

  await db.from('multi_platform_profiles')
    .update({ hr_practice_recommendations: recommendations as any })
    .eq('user_id', userId);

  return recommendations;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Service role: the anon cookie client is RLS-bound in production, and
    // `.single()` errors on zero rows instead of returning null — together
    // these made an already-connected profile's plan look permanently empty.
    const db = createServiceRoleClient();

    const { data: recsData, error: recsError } = await db
      .from('multi_platform_profiles')
      .select('hackerrank_username, hr_practice_recommendations')
      .eq('user_id', user.id)
      .maybeSingle();

    if (recsError) {
      console.error('[hackerrank practice GET]', recsError.message);
      return NextResponse.json({ error: 'Failed to load recommendations' }, { status: 500 });
    }

    if (!recsData?.hackerrank_username) {
      return NextResponse.json({ connected: false, recommendations: [], progress: [] });
    }

    let recommendations = recsData.hr_practice_recommendations as any[] | null;

    // Self-heal: if connect-time generation never landed (or this is an
    // older connection from before recommendations existed), compute now
    // instead of surfacing an empty plan with no way to recover.
    if (!recommendations || recommendations.length === 0) {
      try {
        recommendations = await computePracticeRecommendations(db, user.id);
      } catch (e) {
        console.error('[hackerrank practice GET] auto-generate failed:', e);
      }
    }

    const { data: progressData } = await db
      .from('hr_practice_progress')
      .select('*')
      .eq('user_id', user.id)
      .limit(200);

    return NextResponse.json({
      connected: true,
      recommendations: recommendations || [],
      progress: progressData || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = createServiceRoleClient();
    const recommendations = await computePracticeRecommendations(db, user.id);

    if (recommendations === null) {
      return NextResponse.json({ error: 'Connect your HackerRank profile first' }, { status: 400 });
    }

    return NextResponse.json({ success: true, recommendations });
  } catch (err: any) {
    console.error('[hackerrank practice POST]', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = createServiceRoleClient();

    const { domain, subdomain, problems_solved, target_problems } = await req.json();

    if (!domain || typeof problems_solved !== 'number') {
      return NextResponse.json({ error: 'Missing domain or problems_solved' }, { status: 400 });
    }

    const completed = problems_solved >= (target_problems || 0);

    const { data, error } = await db.from('hr_practice_progress').upsert({
      user_id: user.id,
      domain,
      subdomain,
      problems_solved,
      target_problems,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    }, { onConflict: 'user_id,domain,subdomain' }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, progress: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
