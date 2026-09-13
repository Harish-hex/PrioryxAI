/**
 * Shared shape of the `actions` table (Next Best Action engine output).
 */

export type ActionCategory =
  | "github"
  | "dsa"
  | "project"
  | "resume"
  | "academic"
  | "application"
  | "interview";

export type ActionStatus = "pending" | "in_progress" | "completed" | "skipped";

export interface Action {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  category: ActionCategory;
  priorityRank: number;
  impactScore: number;
  effortMinutes: number | null;
  reasoning: string | null;
  evidence: Record<string, unknown>;
  status: ActionStatus;
  startedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
