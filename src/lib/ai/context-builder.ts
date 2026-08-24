import { buildAIContextSummary, UnifiedUserContext } from '@/lib/context/user-context';
import { buildWorkloadPlan } from '@/lib/planning/temporal';
import { analyzeSkillGaps } from '@/lib/skills/skill-gap';

export type AIContextScope =
  | 'assistant'
  | 'priority'
  | 'opportunity'
  | 'resume'
  | 'learning'
  | 'global';

export function buildScopedAIContext(context: UnifiedUserContext, scope: AIContextScope): string {
  const workload = buildWorkloadPlan(context);
  const gaps = analyzeSkillGaps(context);
  const base = buildAIContextSummary(context);

  const regional = [
    `Country/region: ${context.locale.country}${context.locale.region ? `/${context.locale.region}` : ''}`,
    `Locale/timezone/currency: ${context.locale.locale}, ${context.locale.timezone}, ${context.locale.currency}`,
    `Academic model: ${context.academic.academicSystem}; term=${context.academic.termSystem}; grading=${context.academic.gradingSystem}`,
  ].join('\n');

  const workloadText = [
    `Workload risk: ${workload.overloadRisk}`,
    `Estimated pending minutes: ${workload.estimatedPendingMinutes}`,
    `Available minutes today: ${workload.availableMinutesToday ?? 'unknown'}`,
    `Top deadline risks: ${workload.deadlineRisks.slice(0, 4).map((r) => `${r.title} (${r.risk})`).join(', ') || 'none'}`,
  ].join('\n');

  if (scope === 'assistant') {
    return [regional, base, workloadText].join('\n\n');
  }

  if (scope === 'priority') {
    return [
      regional,
      workloadText,
      `Missing goal skills: ${gaps.missingSkills.slice(0, 8).join(', ') || 'none inferred'}`,
      `Recent feedback events: ${context.feedback.recentEvents.slice(0, 8).map((e) => e.event_type).join(', ') || 'none'}`,
    ].join('\n');
  }

  if (scope === 'opportunity') {
    return [
      regional,
      `Target roles: ${context.profile.targetRoles.join(', ') || 'not set'}`,
      `Target companies: ${context.profile.targetCompanies.join(', ') || 'not set'}`,
      `Current skills: ${context.career.skills.slice(0, 20).join(', ') || 'none detected'}`,
      `Missing skills: ${gaps.missingSkills.slice(0, 10).join(', ') || 'none inferred'}`,
    ].join('\n');
  }

  return [regional, base].join('\n\n');
}
