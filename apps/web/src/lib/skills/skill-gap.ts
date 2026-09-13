import { UnifiedUserContext } from '@/lib/context/user-context';

export interface SkillGapResult {
  currentSkills: string[];
  requiredSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  evidence: Record<string, string[]>;
  recommendedActions: Array<{
    skill: string;
    reason: string;
    action: string;
  }>;
}

function normalize(skill: string): string {
  return skill.toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ').trim();
}

export function inferRequiredSkillsFromGoals(context: UnifiedUserContext): string[] {
  const roleMap: Record<string, string[]> = {
    frontend: ['javascript', 'typescript', 'react', 'html', 'css', 'git'],
    backend: ['node.js', 'sql', 'rest api', 'docker', 'git'],
    fullstack: ['javascript', 'typescript', 'react', 'node.js', 'sql', 'git'],
    data: ['python', 'sql', 'pandas', 'machine learning'],
    machine: ['python', 'machine learning', 'pytorch', 'tensorflow', 'sql'],
    android: ['kotlin', 'android', 'java', 'git'],
    ios: ['swift', 'ios', 'git'],
    devops: ['linux', 'docker', 'kubernetes', 'aws', 'git'],
  };

  const text = [
    ...context.profile.targetRoles,
    ...context.profile.careerGoals,
    context.profile.stream ?? '',
  ].join(' ').toLowerCase();

  const required = new Set<string>();
  for (const [key, skills] of Object.entries(roleMap)) {
    if (text.includes(key)) skills.forEach((skill) => required.add(skill));
  }

  context.profile.targetCompanies.forEach(() => {
    required.add('data structures');
    required.add('algorithms');
  });

  context.career.opportunityInteractions
    .filter((interaction) => ['saved', 'applied', 'viewed'].includes(String(interaction.event_type ?? interaction.outcome ?? '')))
    .forEach((interaction) => {
      const opportunity = interaction.opportunities;
      if (!opportunity || typeof opportunity !== 'object') return;
      const row = opportunity as { required_skills?: unknown; preferred_skills?: unknown };
      [...asSkillList(row.required_skills), ...asSkillList(row.preferred_skills).slice(0, 5)]
        .forEach((skill) => required.add(normalize(skill)));
    });

  return Array.from(required);
}

function asSkillList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((skill): skill is string => typeof skill === 'string') : [];
}

export function analyzeSkillGaps(
  context: UnifiedUserContext,
  explicitRequiredSkills: string[] = []
): SkillGapResult {
  const current = new Set(context.career.skills.map(normalize).filter(Boolean));
  const required = new Set([...inferRequiredSkillsFromGoals(context), ...explicitRequiredSkills.map(normalize)].filter(Boolean));
  const matched = Array.from(required).filter((skill) => current.has(skill));
  const missing = Array.from(required).filter((skill) => !current.has(skill));
  const evidence: Record<string, string[]> = {};

  for (const skill of Array.from(current)) {
    evidence[skill] = [];
    if (context.career.skills.map(normalize).includes(skill)) evidence[skill].push('resume/profile/projects');
    const languages = context.coding.github?.languages as Record<string, number> | undefined;
    if (languages && Object.keys(languages).some((lang) => normalize(lang) === skill)) evidence[skill].push('github');
    const projects = context.career.projects;
    if (projects.some((project) => Array.isArray(project.tech_stack) && project.tech_stack.some((tech) => typeof tech === 'string' && normalize(tech) === skill))) {
      evidence[skill].push('project');
    }
  }

  const recommendedActions = missing.slice(0, 8).map((skill) => ({
    skill,
    reason: `Target role or goal requires ${skill}, but no current evidence was found in resume, projects, or coding signals.`,
    action: `Create or update a project/resume bullet that demonstrates ${skill} with concrete output.`,
  }));

  return {
    currentSkills: Array.from(current),
    requiredSkills: Array.from(required),
    matchedSkills: matched,
    missingSkills: missing,
    evidence,
    recommendedActions,
  };
}
