import { UnifiedUserContext } from '@/lib/context/user-context';

export interface DeadlineRiskItem {
  entityType: 'task' | 'exam' | 'application' | 'project';
  entityId: string | null;
  title: string;
  dueAt: string | null;
  estimatedMinutes: number;
  risk: 'none' | 'low' | 'medium' | 'high' | 'overdue';
  reason: string;
}

export interface WorkloadPlanSummary {
  availableMinutesToday: number | null;
  estimatedPendingMinutes: number;
  dueSoonCount: number;
  overdueCount: number;
  overloadRisk: 'low' | 'medium' | 'high';
  deadlineRisks: DeadlineRiskItem[];
  recommendations: string[];
}

function minutesForTask(task: Record<string, unknown>): number {
  if (typeof task.estimated_minutes === 'number') return task.estimated_minutes;
  if (task.type === 'exam') return 180;
  if (task.type === 'assignment') return 90;
  if (task.type === 'job') return 30;
  return 45;
}

function classifyRisk(dueAt: string | null, estimatedMinutes: number): DeadlineRiskItem['risk'] {
  if (!dueAt) return 'none';
  const hours = (new Date(dueAt).getTime() - Date.now()) / 3_600_000;
  if (Number.isNaN(hours)) return 'none';
  if (hours < 0) return 'overdue';
  if (hours <= Math.max(8, estimatedMinutes / 30)) return 'high';
  if (hours <= 72) return 'medium';
  if (hours <= 14 * 24) return 'low';
  return 'none';
}

function itemFromTask(task: Record<string, unknown>): DeadlineRiskItem {
  const dueAt = typeof task.deadline === 'string'
    ? task.deadline
    : typeof task.due_at === 'string'
      ? task.due_at
      : null;
  const estimatedMinutes = minutesForTask(task);
  const risk = classifyRisk(dueAt, estimatedMinutes);
  return {
    entityType: 'task',
    entityId: typeof task.id === 'string' ? task.id : null,
    title: typeof task.title === 'string' ? task.title : 'Task',
    dueAt,
    estimatedMinutes,
    risk,
    reason: risk === 'overdue'
      ? 'deadline has passed'
      : risk === 'high'
        ? 'deadline is close relative to estimated effort'
        : risk === 'medium'
          ? 'deadline is within the next 72 hours'
          : 'no immediate deadline risk',
  };
}

export function buildWorkloadPlan(context: UnifiedUserContext): WorkloadPlanSummary {
  const availableMinutesToday = context.workCapacity.availableHoursPerWeek
    ? Math.round((context.workCapacity.availableHoursPerWeek * 60) / 7)
    : null;

  const taskRisks = context.tasks.pending.map(itemFromTask);
  const examRisks: DeadlineRiskItem[] = context.academic.upcomingExams.map((exam) => {
    const date = typeof exam.date === 'string' ? exam.date : null;
    const title = String(exam.title ?? exam.subject_name ?? 'Exam');
    const estimatedMinutes = 180;
    const risk = classifyRisk(date, estimatedMinutes);
    return {
      entityType: 'exam',
      entityId: typeof exam.id === 'string' ? exam.id : null,
      title,
      dueAt: date,
      estimatedMinutes,
      risk,
      reason: risk === 'high' ? 'exam is close and requires revision time' : 'exam schedule tracked',
    };
  });

  const deadlineRisks = [...taskRisks, ...examRisks]
    .filter((item) => item.risk !== 'none')
    .sort((a, b) => {
      const order = { overdue: 0, high: 1, medium: 2, low: 3, none: 4 };
      return order[a.risk] - order[b.risk];
    })
    .slice(0, 12);

  const estimatedPendingMinutes = taskRisks.reduce((sum, item) => sum + item.estimatedMinutes, 0);
  const capacity = availableMinutesToday ?? 240;
  const pressure = estimatedPendingMinutes / Math.max(capacity, 1);
  const hasHighDeadline = deadlineRisks.some((item) => item.risk === 'overdue' || item.risk === 'high');
  const overloadRisk: WorkloadPlanSummary['overloadRisk'] =
    pressure >= 2 || (hasHighDeadline && pressure >= 1.2)
      ? 'high'
      : pressure >= 1 || hasHighDeadline
        ? 'medium'
        : 'low';

  const recommendations: string[] = [];
  if (deadlineRisks[0]) {
    recommendations.push(`Start with "${deadlineRisks[0].title}" because ${deadlineRisks[0].reason}.`);
  }
  if (availableMinutesToday && estimatedPendingMinutes > availableMinutesToday) {
    recommendations.push(`Limit today to the top ${overloadRisk === 'high' ? '2-3' : '3-5'} items; current pending estimate exceeds daily capacity.`);
  }
  if (context.tasks.overdueCount > 0) {
    recommendations.push(`Resolve or reschedule ${context.tasks.overdueCount} overdue item(s) before adding new work.`);
  }

  return {
    availableMinutesToday,
    estimatedPendingMinutes,
    dueSoonCount: context.tasks.dueSoonCount,
    overdueCount: context.tasks.overdueCount,
    overloadRisk,
    deadlineRisks,
    recommendations,
  };
}
