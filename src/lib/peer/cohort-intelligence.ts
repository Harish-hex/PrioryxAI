/**
 * Cohort Intelligence — Phase 5
 *
 * Anonymized, aggregate-only benchmarking across the user cohort.
 *
 * PRIVACY RULES (non-negotiable):
 * 1. Minimum cohort size = 20. Return null if fewer than 20 users qualify.
 * 2. Never expose individual user data — only aggregates (avg, count, top N%).
 * 3. Uses service role client to read across users (RLS bypass) — never expose
 *    individual PII in the returned object.
 * 4. No user identifiers in the response — only statistical summaries.
 */

import { createServiceClient } from '@/lib/supabase/server';

const MIN_COHORT_SIZE = 20;

export interface CohortBenchmark {
  cohortSize: number;
  avgPlacementScore: number;
  /** User's percentile within the cohort (0-100). null if no placement score */
  userPercentile: number | null;
  topSkills: string[];
  /** e.g. "In top 25% of your cohort" — null if cohort too small */
  benchmarkLabel: string | null;
}

/**
 * Returns anonymized cohort benchmarks for the user's peer group
 * (same college or similar semester range).
 *
 * Returns null if the cohort is below the minimum size threshold.
 */
export async function getCohortBenchmark(
  userId: string,
  userPlacementScore: number | null,
  userCollege: string | null
): Promise<CohortBenchmark | null> {
  try {
    const supabaseAdmin = createServiceClient();

    // Build cohort filter: same college (if set) OR broad bucket
    let query = supabaseAdmin
      .from('users')
      .select('id')
      .neq('id', userId);

    if (userCollege) {
      query = query.eq('college', userCollege);
    }

    const { data: cohortUsers, error } = await query.limit(500);

    if (error || !cohortUsers) return null;
    if (cohortUsers.length < MIN_COHORT_SIZE) return null;

    const cohortIds = cohortUsers.map((u: { id: string }) => u.id);

    // Fetch placement scores for cohort (aggregate only)
    const { data: scoreDatas } = await supabaseAdmin
      .from('leetcode_profiles')
      .select('placement_readiness_score')
      .in('user_id', cohortIds)
      .not('placement_readiness_score', 'is', null);

    const scores = (scoreDatas ?? [])
      .map((s: { placement_readiness_score: number }) => s.placement_readiness_score)
      .filter((s) => typeof s === 'number');

    if (scores.length < MIN_COHORT_SIZE) return null;

    const avgPlacementScore = Math.round(
      scores.reduce((sum, s) => sum + s, 0) / scores.length
    );

    // Calculate user's percentile
    let userPercentile: number | null = null;
    if (userPlacementScore !== null) {
      const below = scores.filter((s) => s < userPlacementScore).length;
      userPercentile = Math.round((below / scores.length) * 100);
    }

    // Top skills: aggregate from resumes — count skill occurrences
    const { data: skillDatas } = await supabaseAdmin
      .from('user_resumes')
      .select('skill_entities')
      .in('user_id', cohortIds.slice(0, 100)); // limit to 100 for perf

    const skillCounts: Record<string, number> = {};
    for (const row of skillDatas ?? []) {
      const skills = (row.skill_entities as { skills?: string[] } | null)?.skills ?? [];
      for (const skill of skills.slice(0, 20)) {
        skillCounts[skill] = (skillCounts[skill] ?? 0) + 1;
      }
    }
    const topSkills = Object.entries(skillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([skill]) => skill);

    // Benchmark label
    let benchmarkLabel: string | null = null;
    if (userPercentile !== null) {
      if (userPercentile >= 75) benchmarkLabel = `Top 25% of your cohort (${cohortUsers.length} students)`;
      else if (userPercentile >= 50) benchmarkLabel = `Top 50% of your cohort`;
      else benchmarkLabel = `Below cohort median — focus on DSA to close the gap`;
    }

    return {
      cohortSize: cohortUsers.length,
      avgPlacementScore,
      userPercentile,
      topSkills,
      benchmarkLabel,
    };
  } catch (err) {
    console.error('[CohortIntelligence] Error (non-fatal):', err);
    return null;
  }
}
