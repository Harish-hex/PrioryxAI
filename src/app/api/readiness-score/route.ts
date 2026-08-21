import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  computeReadinessScore,
  ReadinessInputs,
  SCORE_VERSION,
} from '@/lib/scoring/readiness-score';

export const runtime = 'nodejs';

// ── Signal collection ────────────────────────────────────────────────────────
// All fetches are parallel and independently fault-tolerant.

async function gatherInputs(userId: string): Promise<ReadinessInputs> {
  const supabase = createClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const nowISO = new Date().toISOString();

  const [
    githubRes,
    lcRes,
    resumeRes,
    completedRes,
    overdueRes,
    upcomingRes,
  ] = await Promise.allSettled([
    supabase
      .from('github_cache')
      .select('health_score, last_commit_at, repos, contribution_days')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('leetcode_profiles')
      .select('placement_readiness_score, total_solved, ai_analysis')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('user_resumes')
      .select('skill_entities, swot')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Tasks completed in last 7 days
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('updated_at', sevenDaysAgo),
    // Overdue tasks
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', false)
      .lt('due_at', nowISO),
    // Upcoming tasks with deadline in next 14 days
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', false)
      .gte('due_at', nowISO)
      .lte('due_at', new Date(Date.now() + 14 * 86_400_000).toISOString()),
  ]);

  const github  = githubRes.status  === 'fulfilled' ? githubRes.value.data  : null;
  const lc      = lcRes.status      === 'fulfilled' ? lcRes.value.data      : null;
  const resume  = resumeRes.status  === 'fulfilled' ? resumeRes.value.data  : null;

  const repos: Array<{ description?: string }> = (github?.repos as Array<{ description?: string }>) ?? [];
  const reposWithDescription = repos.filter((r) => r.description?.trim()).length;

  // LeetCode stats from ai_analysis if available
  const lcAnalysis = lc?.ai_analysis as {
    total_solved?: number;
    medium_solved?: number;
    hard_solved?: number;
    weekly_solved?: number;
  } | null;
  const totalSolved   = lcAnalysis?.total_solved   ?? 0;
  const mediumSolved  = lcAnalysis?.medium_solved  ?? 0;
  const hardSolved    = lcAnalysis?.hard_solved    ?? 0;
  const mediumHardRatio = totalSolved > 0 ? (mediumSolved + hardSolved) / totalSolved : 0;
  const leetcodeSolvedLast7 = lcAnalysis?.weekly_solved ?? 0;

  const skills: string[] =
    (resume?.skill_entities as { skills?: string[] } | null)?.skills ?? [];
  const swotGenerated = resume?.swot != null && Object.keys(resume.swot).length > 0;

  return {
    github: {
      healthScore: github?.health_score ?? 0,
      reposWithDescription,
      totalRepos: repos.length,
      lastCommitAt: github?.last_commit_at ?? null,
    },
    coding: {
      leetcodeScore: lc?.placement_readiness_score ?? null,
      totalSolved,
      mediumHardRatio,
    },
    resume: {
      uploaded: resume != null,
      skillCount: skills.length,
      swotGenerated,
    },
    tasks: {
      completedLast7Days: completedRes.status === 'fulfilled' ? (completedRes.value.count ?? 0) : 0,
      overdueCount:       overdueRes.status   === 'fulfilled' ? (overdueRes.value.count ?? 0)   : 0,
      upcomingDeadlineCount: upcomingRes.status === 'fulfilled' ? (upcomingRes.value.count ?? 0) : 0,
    },
    streak: {
      contributionDays30: github?.contribution_days ?? 0,
      leetcodeSolvedLast7,
    },
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Gather signals
  const inputs = await gatherInputs(user.id);

  // 2. Compute score deterministically — no LLM involved
  const result = computeReadinessScore(inputs);

  // 3. Fetch last stored score to compute delta + dedup check
  const { data: lastRow } = await supabase
    .from('readiness_scores')
    .select('score, breakdown, score_version, computed_at')
    .eq('user_id', user.id)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const deltaFromLast = lastRow ? result.score - lastRow.score : null;

  // 4. Persist only if score changed meaningfully (>= 1 point) or version changed,
  //    or no row exists yet — avoids spamming identical rows on every request.
  const shouldPersist =
    !lastRow ||
    lastRow.score_version !== SCORE_VERSION ||
    Math.abs(result.score - lastRow.score) >= 1;

  if (shouldPersist) {
    await supabase.from('readiness_scores').insert({
      user_id: user.id,
      score: result.score,
      breakdown: result.breakdown,
      score_version: result.scoreVersion,
      computed_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    score: result.score,
    delta_from_last: deltaFromLast,
    breakdown: result.breakdown,
    score_version: result.scoreVersion,
    computed_at: new Date().toISOString(),
    inputs_snapshot: inputs, // helpful for debugging; strip in production if desired
  });
}
