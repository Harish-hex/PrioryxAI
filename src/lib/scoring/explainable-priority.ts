import { getRecentFeedbackSignals } from '@/lib/feedback/events';
import { SupabaseClient } from '@supabase/supabase-js';

export type ExplainableTaskType = 'exam' | 'assignment' | 'job' | 'github' | 'manual' | 'learning';

export interface PriorityContext {
  availableHoursPerWeek?: number | null;
  targetRoles?: string[];
  targetCompanies?: string[];
  currentWorkload?: 'low' | 'moderate' | 'high';
  feedback?: {
    completed: number;
    postponed: number;
    dismissed: number;
  };
}

export interface ExplainablePriority {
  score: number;
  urgency: number;
  impact: number;
  effort: number;
  deadlineRisk: 'none' | 'low' | 'medium' | 'high' | 'overdue';
  factors: Array<{
    factor: string;
    impact: number;
    explanation: string;
  }>;
  reasons: string[];
  summary: string;
}

const BASE: Record<ExplainableTaskType, number> = {
  exam: 80,
  assignment: 60,
  job: 55,
  github: 40,
  learning: 38,
  manual: 35,
};

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;
  return (ms - Date.now()) / 86_400_000;
}

export function computeExplainablePriority(
  task: {
    type?: string | null;
    due_at?: string | null;
    deadline?: string | null;
    weightage?: number | null;
    priority?: string | null;
    estimated_minutes?: number | null;
    subject?: string | null;
    title?: string | null;
  },
  context: PriorityContext = {}
): ExplainablePriority {
  const type = (task.type || 'manual') as ExplainableTaskType;
  const factors: ExplainablePriority['factors'] = [];
  let urgency = 0;
  let impactScore = BASE[type] ?? BASE.manual;
  let effort = 50;
  let deadlineRisk: ExplainablePriority['deadlineRisk'] = 'none';
  factors.push({ factor: 'task_type', impact: impactScore, explanation: `${type} baseline priority` });

  const d = daysUntil(task.deadline ?? task.due_at);
  if (d !== null) {
    let urgencyImpact = 0;
    if (d < 0) {
      urgencyImpact = 55;
      deadlineRisk = 'overdue';
    } else if (d <= 1) {
      urgencyImpact = 35;
      deadlineRisk = 'high';
    } else if (d <= 3) {
      urgencyImpact = 28;
      deadlineRisk = 'high';
    } else if (d <= 7) {
      urgencyImpact = 18;
      deadlineRisk = 'medium';
    } else if (d <= 14) {
      urgencyImpact = 10;
      deadlineRisk = 'low';
    } else {
      urgencyImpact = 2;
      deadlineRisk = 'low';
    }
    urgency += urgencyImpact;
    factors.push({
      factor: 'deadline_proximity',
      impact: urgencyImpact,
      explanation: d < 0 ? 'deadline has passed' : `deadline in ${Math.max(0, Math.ceil(d))} day(s)`,
    });
  }

  if (typeof task.weightage === 'number') {
    const impact = Math.min(20, Math.max(0, task.weightage * 0.2));
    impactScore += impact;
    factors.push({ factor: 'importance', impact, explanation: `weightage ${task.weightage}/100` });
  }

  const priorityImpact = task.priority === 'urgent' ? 18 : task.priority === 'high' ? 10 : task.priority === 'low' ? -8 : 0;
  if (priorityImpact !== 0) {
    urgency += priorityImpact;
    factors.push({ factor: 'user_priority', impact: priorityImpact, explanation: `marked ${task.priority}` });
  }

  const estimated = task.estimated_minutes ?? null;
  if (estimated && estimated > 120 && context.currentWorkload === 'high') {
    effort -= 8;
    factors.push({ factor: 'workload_fit', impact: -8, explanation: 'large task while workload is high' });
  } else if (estimated && estimated <= 30) {
    effort += 4;
    factors.push({ factor: 'effort_fit', impact: 4, explanation: 'small task can be completed quickly' });
  }

  if (type === 'job' && context.targetRoles?.some((role) => task.title?.toLowerCase().includes(role.toLowerCase()))) {
    impactScore += 10;
    factors.push({ factor: 'career_goal_match', impact: 10, explanation: 'matches target role' });
  }

  if (context.feedback?.postponed && context.feedback.postponed > context.feedback.completed) {
    effort -= 4;
    factors.push({ factor: 'behavior_signal', impact: -4, explanation: 'recent postponements suggest reducing load' });
  }

  const score = impactScore * 0.45 + urgency * 0.35 + effort * 0.2;
  const finalScore = clamp(score);
  const positive = factors.filter((f) => f.impact > 0).sort((a, b) => b.impact - a.impact);
  const reasons = positive.slice(0, 4).map((f) => f.explanation);
  const summary = reasons.slice(0, 3).join('; ') || 'ranked by baseline priority';
  return {
    score: finalScore,
    urgency: clamp(urgency),
    impact: clamp(impactScore),
    effort: clamp(effort),
    deadlineRisk,
    factors,
    reasons,
    summary,
  };
}

export async function buildPriorityContext(db: SupabaseClient, userId: string): Promise<PriorityContext> {
  const [{ data: user }, feedback] = await Promise.all([
    db.from('users').select('available_hours_per_week, target_roles, target_companies').eq('id', userId).maybeSingle(),
    getRecentFeedbackSignals(db, userId, 30).catch(() => null),
  ]);

  return {
    availableHoursPerWeek: user?.available_hours_per_week ?? null,
    targetRoles: Array.isArray(user?.target_roles) ? user.target_roles : [],
    targetCompanies: Array.isArray(user?.target_companies) ? user.target_companies : [],
    currentWorkload: feedback && feedback.postponed > feedback.completed ? 'high' : 'moderate',
    feedback: feedback
      ? { completed: feedback.completed, postponed: feedback.postponed, dismissed: feedback.dismissed }
      : undefined,
  };
}
