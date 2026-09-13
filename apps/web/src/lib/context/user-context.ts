import { SupabaseClient } from '@supabase/supabase-js';
import { normalizeCountryCode, resolveAcademicSystem } from './global-config';

export interface UnifiedUserContext {
  userId: string;
  profile: {
    name: string | null;
    college: string | null;
    stream: string | null;
    semester: number | null;
    subjects: string[];
    cgpa: number | null;
    targetRoles: string[];
    targetCompanies: string[];
    careerGoals: string[];
  };
  locale: {
    country: string;
    region: string | null;
    locale: string;
    timezone: string;
    language: string;
    currency: string;
  };
  academic: {
    academicSystem: string;
    termSystem: string;
    gradingSystem: string;
    activeTerms: Array<Record<string, unknown>>;
    courses: Array<Record<string, unknown>>;
    upcomingExams: Array<Record<string, unknown>>;
  };
  workCapacity: {
    availableHoursPerWeek: number | null;
    preferredWorkStart: string | null;
    preferredWorkEnd: string | null;
  };
  tasks: {
    pending: Array<Record<string, unknown>>;
    recentlyCompleted: Array<Record<string, unknown>>;
    overdueCount: number;
    dueSoonCount: number;
  };
  coding: {
    github: Record<string, unknown> | null;
    leetcode: Record<string, unknown> | null;
    hackerrank: Record<string, unknown> | null;
  };
  career: {
    latestResume: Record<string, unknown> | null;
    projects: Array<Record<string, unknown>>;
    applications: Array<Record<string, unknown>>;
    opportunityInteractions: Array<Record<string, unknown>>;
    skills: string[];
  };
  feedback: {
    recentEvents: Array<Record<string, unknown>>;
  };
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function buildAIContextSummary(ctx: UnifiedUserContext): string {
  const upcoming = ctx.academic.upcomingExams
    .slice(0, 3)
    .map((exam) => `${exam.title ?? exam.subject_name ?? 'Exam'} on ${exam.date ?? 'unknown date'}`)
    .join('; ') || 'none';

  const weakTopics = ((ctx.coding.leetcode?.ai_analysis as { priority_topics?: Array<{ topic: string; priority: string }> } | undefined)
    ?.priority_topics ?? [])
    .filter((t) => t.priority === 'CRITICAL' || t.priority === 'HIGH')
    .map((t) => t.topic)
    .slice(0, 4)
    .join(', ') || 'unknown';

  return [
    `Locale: ${ctx.locale.country}, ${ctx.locale.timezone}, ${ctx.locale.language}, ${ctx.locale.currency}`,
    `Academic system: ${ctx.academic.academicSystem} (${ctx.academic.termSystem}, ${ctx.academic.gradingSystem})`,
    `Profile: semester ${ctx.profile.semester ?? 'unknown'}, stream ${ctx.profile.stream ?? 'unknown'}, CGPA ${ctx.profile.cgpa ?? 'unknown'}`,
    `Targets: roles ${ctx.profile.targetRoles.slice(0, 4).join(', ') || 'none'}, companies ${ctx.profile.targetCompanies.slice(0, 4).join(', ') || 'none'}`,
    `Capacity: ${ctx.workCapacity.availableHoursPerWeek ?? 'unknown'} hours/week`,
    `Tasks: ${ctx.tasks.pending.length} pending, ${ctx.tasks.overdueCount} overdue, ${ctx.tasks.dueSoonCount} due soon`,
    `Upcoming exams: ${upcoming}`,
    `Skills: ${ctx.career.skills.slice(0, 10).join(', ') || 'none detected'}`,
    `LeetCode weak topics: ${weakTopics}`,
  ].join('\n');
}

export async function buildUserContext(
  db: SupabaseClient,
  userId: string,
  options: { taskLimit?: number; includeFeedback?: boolean } = {}
): Promise<UnifiedUserContext> {
  const now = new Date();
  const nowISO = now.toISOString();
  const soonISO = new Date(now.getTime() + 14 * 86_400_000).toISOString();
  const historyISO = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  const todayISO = nowISO.split('T')[0];
  const taskLimit = options.taskLimit ?? 25;

  const [
    userRes,
    termRes,
    courseRes,
    examRes,
    pendingRes,
    completedTasksRes,
    overdueRes,
    dueSoonRes,
    githubRes,
    leetcodeRes,
    hackerrankRes,
    resumeRes,
    projectRes,
    applicationRes,
    opportunityInteractionRes,
    skillRes,
    eventRes,
  ] = await Promise.allSettled([
    db.from('users').select('*').eq('id', userId).maybeSingle(),
    db.from('academic_terms').select('*').eq('user_id', userId).order('start_date', { ascending: false }).limit(3),
    db.from('courses').select('*').eq('user_id', userId).limit(30),
    db.from('schedule_exams').select('*').eq('user_id', userId).gte('date', todayISO).order('date').limit(10),
    db.from('tasks').select('*').eq('user_id', userId).eq('completed', false).order('due_at', { ascending: true, nullsFirst: false }).limit(taskLimit),
    db.from('tasks').select('id, title, type, due_at, deadline, priority, subject, weightage, updated_at').eq('user_id', userId).eq('completed', true).gte('updated_at', historyISO).order('updated_at', { ascending: false }).limit(30),
    db.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('completed', false).lt('due_at', nowISO),
    db.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('completed', false).gte('due_at', nowISO).lte('due_at', soonISO),
    db.from('github_cache').select('*').eq('user_id', userId).maybeSingle(),
    db.from('leetcode_profiles').select('*').eq('user_id', userId).maybeSingle(),
    db.from('multi_platform_profiles').select('*').eq('user_id', userId).eq('platform', 'hackerrank').maybeSingle(),
    db.from('user_resumes').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    db.from('user_projects').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
    db.from('job_applications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
    db
      .from('user_opportunity_interactions')
      .select('*, opportunities(title, company, required_skills, preferred_skills)')
      .eq('user_id', userId)
      .order('occurred_at', { ascending: false })
      .limit(30),
    db.from('user_skills').select('skill, normalized_skill, source, confidence').eq('user_id', userId).order('confidence', { ascending: false }).limit(50),
    options.includeFeedback
      ? db.from('recommendation_events').select('*').eq('user_id', userId).order('occurred_at', { ascending: false }).limit(25)
      : Promise.resolve({ data: [] }),
  ]);

  const user = userRes.status === 'fulfilled' ? userRes.value.data : null;
  const country = normalizeCountryCode(typeof user?.country === 'string' ? user.country : null) ?? 'IN';
  const academicConfig = resolveAcademicSystem(user?.academic_system, country);
  const locale = String(user?.locale || academicConfig.defaultLocale);
  const timezone = String(user?.timezone || academicConfig.defaultTimezone);
  const language = String(user?.preferred_language || locale.split('-')[0] || 'en');
  const currency = String(user?.currency || academicConfig.defaultCurrency);
  const resume = resumeRes.status === 'fulfilled' ? resumeRes.value.data : null;
  const explicitSkills = skillRes.status === 'fulfilled'
    ? (skillRes.value.data ?? []).map((s: { skill?: string }) => s.skill).filter((s): s is string => Boolean(s))
    : [];
  const resumeSkills = asStringArray((resume?.skill_entities as { skills?: unknown } | null)?.skills);
  const github = githubRes.status === 'fulfilled' ? githubRes.value.data : null;
  const githubLanguageSkills = github?.languages && typeof github.languages === 'object'
    ? Object.keys(github.languages as Record<string, number>)
    : [];
  const leetcode = leetcodeRes.status === 'fulfilled' ? leetcodeRes.value.data : null;
  const leetcodeLanguageSkills = asStringArray((leetcode?.language_stats as { languages?: unknown } | null)?.languages);
  const projects = projectRes.status === 'fulfilled' ? (projectRes.value.data ?? []) : [];
  const projectSkills = projects.flatMap((project: Record<string, unknown>) => asStringArray(project.tech_stack));
  const subjectSkills = asStringArray(user?.subjects);
  const skills = Array.from(new Set([
    ...explicitSkills,
    ...resumeSkills,
    ...githubLanguageSkills,
    ...leetcodeLanguageSkills,
    ...projectSkills,
    ...subjectSkills,
  ].filter(Boolean)));

  return {
    userId,
    profile: {
      name: user?.name ?? user?.display_name ?? null,
      college: user?.college ?? null,
      stream: user?.stream ?? null,
      semester: numberOrNull(user?.semester),
      subjects: asStringArray(user?.subjects),
      cgpa: numberOrNull(user?.cgpa),
      targetRoles: asStringArray(user?.target_roles),
      targetCompanies: asStringArray(user?.target_companies),
      careerGoals: asStringArray(user?.career_goals),
    },
    locale: {
      country,
      region: user?.region ?? null,
      locale,
      timezone,
      language,
      currency,
    },
    academic: {
      academicSystem: String(user?.academic_system || academicConfig.key),
      termSystem: String(user?.term_system || academicConfig.termSystem),
      gradingSystem: String(user?.grading_system || academicConfig.gradingSystem),
      activeTerms: termRes.status === 'fulfilled' ? (termRes.value.data ?? []) : [],
      courses: courseRes.status === 'fulfilled' ? (courseRes.value.data ?? []) : [],
      upcomingExams: examRes.status === 'fulfilled' ? (examRes.value.data ?? []) : [],
    },
    workCapacity: {
      availableHoursPerWeek: numberOrNull(user?.available_hours_per_week),
      preferredWorkStart: user?.preferred_work_start ?? null,
      preferredWorkEnd: user?.preferred_work_end ?? null,
    },
    tasks: {
      pending: pendingRes.status === 'fulfilled' ? (pendingRes.value.data ?? []) : [],
      recentlyCompleted: completedTasksRes.status === 'fulfilled' ? (completedTasksRes.value.data ?? []) : [],
      overdueCount: overdueRes.status === 'fulfilled' ? (overdueRes.value.count ?? 0) : 0,
      dueSoonCount: dueSoonRes.status === 'fulfilled' ? (dueSoonRes.value.count ?? 0) : 0,
    },
    coding: {
      github,
      leetcode,
      hackerrank: hackerrankRes.status === 'fulfilled' ? hackerrankRes.value.data : null,
    },
    career: {
      latestResume: resume,
      projects,
      applications: applicationRes.status === 'fulfilled' ? (applicationRes.value.data ?? []) : [],
      opportunityInteractions: opportunityInteractionRes.status === 'fulfilled' ? (opportunityInteractionRes.value.data ?? []) : [],
      skills,
    },
    feedback: {
      recentEvents: eventRes.status === 'fulfilled' ? (eventRes.value.data ?? []) : [],
    },
  };
}
