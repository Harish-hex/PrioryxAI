/**
 * Shared shape of the `career_graph` table (Digital Twin), matching the
 * additive migration introduced alongside the spec's new schema.
 * Kept intentionally separate from apps/web/src/lib/scoring/readiness-score.ts,
 * which is the existing pure scoring engine's own input/output types.
 */

export interface SkillEvidence {
  score: number;
  evidence: string[];
  lastDemonstrated?: string | null;
  trajectory?: "improving" | "stable" | "declining";
}

export interface GitHubState {
  username: string | null;
  healthScore: number | null;
  data: Record<string, unknown>;
  lastSyncedAt: string | null;
}

export interface DSAState {
  leetcodeUsername: string | null;
  hackerrankUsername: string | null;
  score: number | null;
  data: Record<string, unknown>;
}

export interface ResumeState {
  url: string | null;
  parsedAt: string | null;
  skills: string[];
  score: number | null;
  data: Record<string, unknown>;
}

export interface CareerGraph {
  id: string;
  userId: string;
  skills: Record<string, SkillEvidence>;
  github: GitHubState;
  dsa: DSAState;
  resume: ResumeState;
  academicData: Record<string, unknown>;
  careerState: Record<string, unknown>;
  behaviorData: Record<string, unknown>;
  readinessScore: number | null;
  scoreBreakdown: Record<string, number>;
  scoreLastCalculatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
