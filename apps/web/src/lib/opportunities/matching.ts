import { UnifiedUserContext } from '@/lib/context/user-context';
import { NormalizedOpportunity, OpportunityMatchResult } from './types';

function normalizeSkill(skill: string): string {
  return skill.toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ').trim();
}

export function matchOpportunityToUser(
  opportunity: NormalizedOpportunity,
  context: Pick<UnifiedUserContext, 'career' | 'profile' | 'locale'>
): OpportunityMatchResult {
  const userSkills = new Set(context.career.skills.map(normalizeSkill));
  const targetRoles = context.profile.targetRoles.map(normalizeSkill);
  const targetCompanies = context.profile.targetCompanies.map(normalizeSkill);
  const required = opportunity.requiredSkills.map(normalizeSkill).filter(Boolean);
  const preferred = opportunity.preferredSkills.map(normalizeSkill).filter(Boolean);
  const allOpportunitySkills = Array.from(new Set([...required, ...preferred]));

  const strongMatches = allOpportunitySkills.filter((skill) => userSkills.has(skill));
  const missingSkills = required.filter((skill) => !userSkills.has(skill)).slice(0, 8);
  const relevantProjects = context.career.projects
    .map((project) => {
      const techStack = Array.isArray(project.tech_stack)
        ? project.tech_stack.filter((skill): skill is string => typeof skill === 'string').map(normalizeSkill)
        : [];
      const matchedSkills = techStack.filter((skill) => allOpportunitySkills.includes(skill));
      return {
        id: typeof project.id === 'string' ? project.id : null,
        title: typeof project.title === 'string' ? project.title : 'Project',
        matchedSkills,
      };
    })
    .filter((project) => project.matchedSkills.length > 0)
    .slice(0, 3);

  let score = 20;
  if (allOpportunitySkills.length > 0) {
    score += Math.round((strongMatches.length / allOpportunitySkills.length) * 45);
  }

  const title = opportunity.title.toLowerCase();
  const roleAlignment: OpportunityMatchResult['roleAlignment'] =
    targetRoles.some((role) => role && title.includes(role))
      ? 'high'
      : strongMatches.length >= 4
        ? 'medium'
        : strongMatches.length > 0
          ? 'low'
          : 'none';
  if (roleAlignment === 'high') score += 15;
  else if (roleAlignment === 'medium') score += 8;
  if (targetCompanies.some((company) => company && opportunity.company?.toLowerCase().includes(company))) score += 10;
  if (relevantProjects.length > 0) score += Math.min(10, relevantProjects.length * 4);
  if (opportunity.country && opportunity.country === context.locale.country) score += 5;
  if (opportunity.remotePolicy === 'remote') score += 5;

  if (opportunity.deadline) {
    const days = (new Date(opportunity.deadline).getTime() - Date.now()) / 86_400_000;
    if (days >= 0 && days <= 3) score += 10;
    else if (days > 3 && days <= 14) score += 5;
    else if (days < 0) score -= 30;
  }

  score = Math.max(0, Math.min(100, score));

  const reasons: string[] = [];
  if (strongMatches.length > 0) reasons.push(`Matches ${strongMatches.slice(0, 4).join(', ')}`);
  if (missingSkills.length > 0) reasons.push(`Missing ${missingSkills.slice(0, 4).join(', ')}`);
  if (relevantProjects.length > 0) reasons.push(`Relevant projects: ${relevantProjects.map((p) => p.title).join(', ')}`);
  if (roleAlignment !== 'none') reasons.push(`Role alignment: ${roleAlignment}`);
  if (opportunity.deadline) reasons.push(`Deadline ${new Date(opportunity.deadline).toLocaleDateString(context.locale.locale)}`);
  if (opportunity.remotePolicy) reasons.push(`Remote policy: ${opportunity.remotePolicy}`);

  return {
    opportunity,
    score,
    strongMatches,
    missingSkills,
    relevantProjects,
    roleAlignment,
    reasons,
    recommendedActions: [
      ...missingSkills.slice(0, 3).map((skill) => `Build or document evidence for ${skill}.`),
      ...(relevantProjects.length === 0 && strongMatches.length > 0
        ? ['Attach a relevant project showing the matched skills.']
        : []),
    ].slice(0, 4),
  };
}
