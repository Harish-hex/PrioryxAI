// Coding Recommendations API Route
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeTool } from '@/lib/mcp/registry';
import { withFallback, redis } from '@/lib/redis';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Only guards the on-the-fly LLM fallback path (executeTool call below) — the
// persisted-recommendations path is already a fast, indexed query and stays
// uncached so newly generated recommendations show up immediately.
const FALLBACK_CACHE_TTL = 10 * 60; // seconds

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Prefer the persisted, company-tagged recommendations generated from the
  // user's real LeetCode AI analysis (see /api/leetcode/recommendations) —
  // this is real data, not an LLM asked to invent problem URLs on the fly.
  const { data: persisted } = await supabase
    .from('problem_recommendations')
    .select('*')
    .eq('user_id', user.id)
    .order('priority', { ascending: true })
    .order('topic', { ascending: true });

  if (persisted && persisted.length > 0) {
    return NextResponse.json({ recommendations: persisted });
  }

  // Fall back to the on-the-fly LLM path only when no persisted recommendations
  // exist yet (e.g. user hasn't connected LeetCode / run analysis), using real
  // weak topics from their profile where available instead of a hardcoded list.
  const [{ data: profile }, { data: leetcodeProfile }, { data: userProfile }] = await Promise.all([
    supabase.from('coding_profiles').select('weak_topics').eq('user_id', user.id).maybeSingle(),
    supabase.from('leetcode_profiles').select('ai_analysis').eq('user_id', user.id).maybeSingle(),
    supabase.from('users').select('target_companies').eq('id', user.id).maybeSingle(),
  ]);

  const aiWeakTopics: string[] = Array.isArray((leetcodeProfile?.ai_analysis as any)?.priority_topics)
    ? (leetcodeProfile!.ai_analysis as any).priority_topics
        .filter((t: any) => t?.topic && (t.priority === 'CRITICAL' || t.priority === 'HIGH'))
        .map((t: any) => String(t.topic))
    : [];

  const weakTopics = (profile?.weak_topics as string[] | undefined)?.length
    ? (profile!.weak_topics as string[])
    : aiWeakTopics.length > 0
      ? aiWeakTopics
      : ['Arrays', 'Dynamic Programming', 'Graphs'];

  const targetCompanies = (userProfile?.target_companies as string[]) ?? [];

  const cacheKey = `coding_recs_fallback:${user.id}`;
  const cached = await withFallback(() => redis.get(cacheKey), null);
  if (cached) return NextResponse.json(cached);

  const result = await executeTool('research.recommendProblems', {
    weakTopics,
    targetCompanies,
  }, user.id);

  const payload = result.result.data ?? { recommendations: [] };
  await withFallback(() => redis.set(cacheKey, payload, { ex: FALLBACK_CACHE_TTL }), undefined);

  return NextResponse.json(payload);
}
