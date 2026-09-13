/**
 * Shared shape of `score_history` rows and the 7-dimension readiness score
 * breakdown used by the ai-service score engine and apps/web dashboard UI.
 */

export type ScoreDimension =
  | "technicalSkills"
  | "codingDsa"
  | "projectsPortfolio"
  | "githubActivity"
  | "resumeQuality"
  | "interviewReadiness"
  | "consistency";

export type ScoreBreakdown = Record<ScoreDimension, number>;

export interface ScoreHistoryEntry {
  id: string;
  userId: string;
  readinessScore: number;
  scoreBreakdown: ScoreBreakdown;
  recordedAt: string;
}
