import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  computeReadinessScore,
  ReadinessInputs,
  SCORE_VERSION,
} from '@/lib/scoring/readiness-score';
import { explainReadinessScore } from '@/lib/scoring/explain-score';

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
      // `total_solved` is not a real column on this table (it never existed —
      // confirmed against the migration) — selecting it made this entire
      // query fail on every request, silently marking Coding Practice
      // "unavailable" for every user regardless of whether LeetCode was
      // actually connected. Real solved counts live in `solved_data`
      // (a SolvedStats blob), and calendar_data carries the daily submission
      // history needed for the weekly-solved streak signal.
      .select('placement_readiness_score, solved_data, calendar_data, ai_analysis')
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

  // `contribution_days` is an array of { date, count } entries (up to 182
  // days), not a number — passing the array straight through as a count
  // (as this used to do) coerces to NaN in arithmetic below and corrupts
  // the entire final score to NaN for any GitHub-connected user. Compute
  // the actual "active days in the last 30 days" count instead.
  const contributionEntries: Array<{ date: string; count: number }> =
    (github?.contribution_days as Array<{ date: string; count: number }>) ?? [];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);
  const contributionDays30 = contributionEntries.filter(
    (d) => d.count > 0 && new Date(d.date) >= thirtyDaysAgo
  ).length;

  // Real solved counts live in solved_data (a SolvedStats blob written at
  // connect/sync time) — ai_analysis never contained these fields, so they
  // were always 0/undefined regardless of actual LeetCode activity.
  const solvedData = lc?.solved_data as {
    solvedProblem?: number;
    mediumSolved?: number;
    hardSolved?: number;
  } | null;
  const totalSolved  = solvedData?.solvedProblem ?? 0;
  const mediumSolved = solvedData?.mediumSolved ?? 0;
  const hardSolved   = solvedData?.hardSolved ?? 0;
  const mediumHardRatio = totalSolved > 0 ? (mediumSolved + hardSolved) / totalSolved : 0;

  // Weekly solve count from the submission calendar (a stringified JSON map
  // of unix-day-timestamp -> submission count for that day).
  let leetcodeSolvedLast7 = 0;
  const rawCalendar = (lc?.calendar_data as { submissionCalendar?: string } | null)?.submissionCalendar;
  if (rawCalendar) {
    try {
      const parsed = JSON.parse(rawCalendar) as Record<string, number>;
      const sevenDaysAgoUnix = Math.floor(Date.now() / 1000) - 7 * 86_400;
      leetcodeSolvedLast7 = Object.entries(parsed)
        .filter(([ts]) => Number(ts) >= sevenDaysAgoUnix)
        .reduce((sum, [, count]) => sum + count, 0);
    } catch {
      // Malformed/missing calendar data — leave at 0 rather than fail the request.
    }
  }

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
      contributionDays30,
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

  // 5. Generate LLM explanation (cached — never blocks on identical score state)
  const lcProfile = await supabase
    .from('leetcode_profiles')
    .select('ai_analysis')
    .eq('user_id', user.id)
    .maybeSingle();
  const lcAnalysis = lcProfile.data?.ai_analysis as {
    priority_topics?: Array<{ topic: string; priority: string }>;
  } | null;
  const weakTopics = lcAnalysis?.priority_topics
    ?.filter((t) => t.priority === 'CRITICAL' || t.priority === 'HIGH')
    .map((t) => t.topic) ?? [];

  const explanation = await explainReadinessScore(user.id, result, {
    weakTopics,
  });

  return NextResponse.json({
    score: result.score,
    delta_from_last: deltaFromLast,
    breakdown: result.breakdown,
    score_version: result.scoreVersion,
    computed_at: new Date().toISOString(),
    explanation: {
      summary: explanation.summary,
      next_actions: explanation.nextActions,
      cached: explanation.cached,
    },
    inputs_snapshot: inputs,
  });
}
