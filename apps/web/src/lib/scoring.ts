// Single source of truth for priority scoring
// Used by /api/feed and any client-side display logic

export type TaskType = 'exam' | 'assignment' | 'job' | 'github' | 'manual';

export function computePriorityScore(task: {
  type: TaskType;
  due_at: string | null;
  weightage: number | null;
}): number {
  const BASE_WEIGHTS: Record<TaskType, number> = {
    exam: 100,
    job: 80,
    assignment: 70,
    manual: 50,
    github: 40,
  };
  const base = BASE_WEIGHTS[task.type] ?? 50;
  if (!task.due_at) return base;
  const hoursRemaining = (new Date(task.due_at).getTime() - Date.now()) / 3_600_000;
  if (hoursRemaining < 0) return 0;
  const urgencyDecay = Math.exp(-hoursRemaining / 48);
  const consequence = task.weightage ? task.weightage * 0.5 : 0;
  return base * urgencyDecay + consequence;
}

export function getNextMoveReason(task: { type: TaskType; due_at: string | null }): string {
  const hoursRemaining = task.due_at
    ? (new Date(task.due_at).getTime() - Date.now()) / 3_600_000
    : null;

  const timeHint =
    hoursRemaining !== null
      ? hoursRemaining < 24
        ? ' — due in less than 24 hours'
        : hoursRemaining < 72
        ? ` — due in ${Math.round(hoursRemaining / 24)} days`
        : ''
      : '';

  const reasons: Record<TaskType, string> = {
    exam: `Exam coming up${timeHint}`,
    job: `Application deadline${timeHint}`,
    assignment: `Assignment due${timeHint}`,
    manual: `You marked this urgent${timeHint}`,
    github: `Commit streak at risk${timeHint}`,
  };
  return reasons[task.type] ?? `Task due${timeHint}`;
}
