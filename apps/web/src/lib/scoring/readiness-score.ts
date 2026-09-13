/**
 * Readiness Score — pure deterministic function.
 *
 * SCORE_VERSION must be incremented any time the formula, weights, or
 * component definitions change, so historical rows in `readiness_scores`
 * can be compared only within the same version.
 *
 * No I/O inside this file. All inputs are pre-fetched by the caller.
 * The function is fully unit-testable with plain objects.
 */

export const SCORE_VERSION = 3;

// ─────────────────────────────────────────────────────────────────────────────
// Input types
// ─────────────────────────────────────────────────────────────────────────────

export interface GitHubInputs {
  /** 0-100 GitHub health/portfolio score from github_cache or github_analysis */
  healthScore: number;
  /** Number of repos with a non-empty description */
  reposWithDescription: number;
  /** Total repos */
  totalRepos: number;
  /** ISO timestamp of last commit, or null */
  lastCommitAt: string | null;
}

export interface CodingInputs {
  /** 0-100 placement readiness score from leetcode_profiles.placement_readiness_score */
  leetcodeScore: number | null;
  /** Total problems solved on LeetCode */
  totalSolved: number;
  /** Percentage of medium+hard problems in solved set */
  mediumHardRatio: number;
}

export interface ResumeInputs {
  /** Whether a resume has been uploaded at all */
  uploaded: boolean;
  /** Number of skills extracted from the resume */
  skillCount: number;
  /** Whether the AI SWOT analysis has been run */
  swotGenerated: boolean;
}

export interface TaskInputs {
  /** Number of tasks completed in the last 7 days */
  completedLast7Days: number;
  /** Number of overdue tasks (past due_at and not completed) */
  overdueCount: number;
  /** Number of tasks with a deadline in the next 14 days */
  upcomingDeadlineCount: number;
}

export interface StreakInputs {
  /** GitHub contribution days in the past 30 days */
  contributionDays30: number;
  /** LeetCode problems solved in the past 7 days */
  leetcodeSolvedLast7: number;
}

export interface ReadinessInputs {
  github: GitHubInputs;
  coding: CodingInputs;
  resume: ResumeInputs;
  tasks: TaskInputs;
  streak: StreakInputs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Output types
// ─────────────────────────────────────────────────────────────────────────────

export interface ComponentScore {
  /** Human-readable name of this scoring dimension */
  name: string;
  /** Raw score for this component, 0-100 */
  raw: number;
  /** Weight applied to this component (should sum to 1.0 across all components) */
  weight: number;
  /** Weighted contribution to the total (raw * weight) */
  weighted: number;
  /** One-sentence human-readable explanation of why this component scored this way */
  explanation: string;
  /**
   * True when the user simply hasn't connected/used this signal at all
   * (no GitHub repos, no LeetCode connection, no resume). Unavailable
   * components are excluded from the weighted total (with remaining
   * weights renormalized) instead of being counted as a failing 0 —
   * a user who hasn't connected LeetCode shouldn't score the same as
   * one who connected it and solved nothing.
   */
  unavailable: boolean;
}

export interface ReadinessScoreResult {
  /** Final blended score, 0-100, rounded to nearest integer */
  score: number;
  /** Version of the formula used to produce this score */
  scoreVersion: number;
  /** Per-component breakdown — used by the LLM explanation layer and UI */
  breakdown: Record<string, ComponentScore>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Formula
// Weights must sum to exactly 1.0
// ─────────────────────────────────────────────────────────────────────────────

const WEIGHTS = {
  github:  0.25,
  coding:  0.25,
  resume:  0.20,
  tasks:   0.20,
  streak:  0.10,
} as const;

/** Clamp a value to [0, 100] */
function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}

/** Days since an ISO timestamp, or Infinity if null */
function daysSince(isoTimestamp: string | null): number {
  if (!isoTimestamp) return Infinity;
  return (Date.now() - new Date(isoTimestamp).getTime()) / 86_400_000;
}

// ── Component scorers ────────────────────────────────────────────────────────

function scoreGitHub(g: GitHubInputs): { raw: number; explanation: string; unavailable: boolean } {
  if (g.totalRepos === 0) {
    return {
      raw: 0,
      unavailable: true,
      explanation: 'No GitHub repos connected — connect GitHub to unlock this component.',
    };
  }

  // Base: health score is already 0-100 from the collector
  let raw = clamp(g.healthScore);

  // Bonus: repos with descriptions (up to +10)
  const descRatio = g.totalRepos > 0 ? g.reposWithDescription / g.totalRepos : 0;
  raw += descRatio * 10;

  // Recency penalty: if last commit > 14 days ago, decay by up to -15
  const age = daysSince(g.lastCommitAt);
  if (age > 14) raw -= Math.min(15, (age - 14) * 0.5);

  raw = clamp(raw);

  let explanation: string;
  if (raw >= 75) {
    explanation = `GitHub health ${g.healthScore}/100 — active and well-described repos.`;
  } else if (age > 30) {
    explanation = `GitHub last commit was ${Math.round(age)} days ago — recruiter visibility is dropping.`;
  } else {
    explanation = `GitHub health ${g.healthScore}/100 — ${Math.round(descRatio * 100)}% of repos have descriptions.`;
  }

  return { raw, explanation, unavailable: false };
}

function scoreCoding(c: CodingInputs): { raw: number; explanation: string; unavailable: boolean } {
  // If LeetCode not connected, exclude this component rather than scoring it 0 —
  // "never connected" and "connected with 0 problems solved" are not the same signal.
  if (c.leetcodeScore === null) {
    return {
      raw: 0,
      unavailable: true,
      explanation: 'LeetCode not connected — link your account to score this component.',
    };
  }

  // Base: LeetCode placement readiness (already 0-100)
  let raw = clamp(c.leetcodeScore);

  // Bonus: depth (medium+hard ratio, up to +10)
  raw += c.mediumHardRatio * 10;

  // Bonus: volume — every 50 solved = +5, capped at +15
  raw += Math.min(15, Math.floor(c.totalSolved / 50) * 5);

  raw = clamp(raw);

  const explanation =
    c.leetcodeScore < 40
      ? `LeetCode score ${c.leetcodeScore}/100 — below 40 is below OA pass threshold for most companies.`
      : c.leetcodeScore < 65
      ? `LeetCode score ${c.leetcodeScore}/100 — on track, target 75+ for top product companies.`
      : `LeetCode score ${c.leetcodeScore}/100 — strong. ${c.totalSolved} problems solved.`;

  return { raw, explanation, unavailable: false };
}

function scoreResume(r: ResumeInputs): { raw: number; explanation: string; unavailable: boolean } {
  if (!r.uploaded) {
    return {
      raw: 0,
      unavailable: true,
      explanation: 'No resume uploaded — upload to unlock job matching and SWOT analysis.',
    };
  }

  let raw = 30; // Base for having uploaded at all

  // Skill count: 5 skills = +10, 10 skills = +20, 15+ skills = +30
  raw += Math.min(30, Math.floor(r.skillCount / 5) * 10);

  // SWOT generated: +40
  if (r.swotGenerated) raw += 40;

  raw = clamp(raw);

  let explanation: string;
  if (!r.swotGenerated) {
    explanation = `Resume uploaded with ${r.skillCount} skills, but SWOT analysis not yet run — re-upload or trigger analysis.`;
  } else if (r.skillCount < 5) {
    explanation = `Resume uploaded but only ${r.skillCount} skills detected — a clearer PDF extracts more.`;
  } else {
    explanation = `Resume has ${r.skillCount} skills + SWOT analysis complete.`;
  }

  return { raw, explanation, unavailable: false };
}

function scoreTasks(t: TaskInputs): { raw: number; explanation: string; unavailable: boolean } {
  if (t.completedLast7Days === 0 && t.overdueCount === 0 && t.upcomingDeadlineCount === 0) {
    return {
      raw: 0,
      unavailable: true,
      explanation: 'No tasks created yet — add tasks to your feed to score this component.',
    };
  }

  let raw = 50; // Neutral baseline

  // Completed tasks in last 7 days: +5 per task, capped at +35
  raw += Math.min(35, t.completedLast7Days * 5);

  // Overdue penalty: -8 per overdue task, capped at -40
  raw -= Math.min(40, t.overdueCount * 8);

  // Upcoming deadlines handled: no bonus/penalty (just informational)

  raw = clamp(raw);

  let explanation: string;
  if (t.completedLast7Days === 0 && t.overdueCount > 0) {
    explanation = `${t.overdueCount} overdue task${t.overdueCount > 1 ? 's' : ''} and no completions this week — priority execution is lagging.`;
  } else if (t.completedLast7Days === 0) {
    explanation = 'No tasks completed in the last 7 days — start marking tasks complete to improve this.';
  } else {
    explanation = `${t.completedLast7Days} task${t.completedLast7Days > 1 ? 's' : ''} completed this week${t.overdueCount > 0 ? `, ${t.overdueCount} overdue` : ''}.`;
  }

  return { raw, explanation, unavailable: false };
}

function scoreStreak(s: StreakInputs): { raw: number; explanation: string; unavailable: boolean } {
  if (s.contributionDays30 === 0 && s.leetcodeSolvedLast7 === 0) {
    return {
      raw: 0,
      unavailable: true,
      explanation: 'No GitHub or LeetCode activity yet — connect and stay active to score this component.',
    };
  }

  // GitHub contribution days: up to 60 points (2 pts per day, max 30 days)
  const githubContrib = Math.min(60, s.contributionDays30 * 2);

  // LeetCode weekly: up to 40 points (8 pts per solve, max 5 in a week)
  const lcWeekly = Math.min(40, s.leetcodeSolvedLast7 * 8);

  const raw = clamp(githubContrib + lcWeekly);

  let explanation: string;
  if (s.contributionDays30 === 0 && s.leetcodeSolvedLast7 === 0) {
    explanation = 'No GitHub activity or LeetCode submissions in the past week — consistency is critical.';
  } else {
    explanation = `${s.contributionDays30} GitHub active days (last 30) + ${s.leetcodeSolvedLast7} LeetCode solves this week.`;
  }

  return { raw, explanation, unavailable: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export function computeReadinessScore(inputs: ReadinessInputs): ReadinessScoreResult {
  const gh = scoreGitHub(inputs.github);
  const cd = scoreCoding(inputs.coding);
  const rs = scoreResume(inputs.resume);
  const tk = scoreTasks(inputs.tasks);
  const st = scoreStreak(inputs.streak);

  const components: Record<string, { raw: number; explanation: string; weight: number; name: string; unavailable: boolean }> = {
    github: { name: 'GitHub Portfolio',       ...gh, weight: WEIGHTS.github },
    coding: { name: 'Coding Practice',        ...cd, weight: WEIGHTS.coding },
    resume: { name: 'Resume Completeness',    ...rs, weight: WEIGHTS.resume },
    tasks:  { name: 'Task Execution',         ...tk, weight: WEIGHTS.tasks  },
    streak: { name: 'Consistency & Streak',   ...st, weight: WEIGHTS.streak },
  };

  // Components the user hasn't connected/used at all are excluded from the
  // weighted average (rather than counted as a failing 0), and the remaining
  // weights are renormalized to sum back to 1.0 — so an unconnected signal
  // doesn't unfairly drag down the score of an otherwise-strong profile.
  const availableWeightSum = Object.values(components)
    .filter(c => !c.unavailable)
    .reduce((sum, c) => sum + c.weight, 0);
  const renormalize = availableWeightSum > 0 ? 1 / availableWeightSum : 0;

  let total = 0;
  const breakdown: Record<string, ComponentScore> = {};

  for (const [key, c] of Object.entries(components)) {
    const effectiveWeight = c.unavailable ? 0 : c.weight * renormalize;
    const weighted = c.raw * effectiveWeight;
    total += weighted;
    breakdown[key] = {
      name: c.name,
      raw: Math.round(c.raw),
      weight: c.weight,
      weighted: Math.round(weighted * 10) / 10,
      explanation: c.explanation,
      unavailable: c.unavailable,
    };
  }

  return {
    score: Math.round(clamp(total)),
    scoreVersion: SCORE_VERSION,
    breakdown,
  };
}
