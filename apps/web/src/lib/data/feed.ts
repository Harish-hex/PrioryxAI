// Shared feed data loader — extracted from src/app/api/feed/route.ts so the
// exact same logic (and its Redis cache) can be called both from the /api/feed
// route (client-side revalidation) and directly from a Server Component
// (src/app/feed/page.tsx) to render real data on first paint instead of an
// empty shell that waits for a post-hydration client fetch.
import type { SupabaseClient } from '@supabase/supabase-js';
import { computePriorityScore, getNextMoveReason } from '@/lib/scoring';
import type { TaskType } from '@/lib/scoring';
import { withFallback, redis } from '@/lib/redis';
import { syncInternshalaJobsForUser, deriveJobRoles, buildInternshalaSearchUrl } from '@/lib/job-sync';
import { buildPriorityContext, computeExplainablePriority } from '@/lib/scoring/explainable-priority';
import { normalizeCountryCode } from '@/lib/context/global-config';
import { errorMentionsColumn } from '@/lib/schema-migrations';
import { collectRoadmapSignals } from '@/lib/priority/collectors/roadmap-collector';
import { collectTimetableSignals } from '@/lib/priority/collectors/timetable-collector';
import { collectSubjectSignals } from '@/lib/priority/collectors/subject-collector';
import { collectResumeSignals } from '@/lib/priority/collectors/resume-collector';

const FEED_CACHE_TTL = 180; // 3 minutes for sub-50ms instant response

type StudentProfile = 'no_foundation' | 'academics_first' | 'skills_no_projects' | 'job_ready';
type FeedUserProfile = {
  college?: string | null;
  semester?: number | null;
  subjects?: string[] | null;
  cgpa?: number | null;
  github_username?: string | null;
  pro_status?: boolean | null;
  pro_expires_at?: string | null;
  country?: string | null;
};
type FeedRepo = {
  name?: string;
  description?: string | null;
};
type FeedGitHubCache = {
  repos?: FeedRepo[] | null;
  languages?: Record<string, number> | null;
  health_score?: number | null;
};
type FeedTask = {
  id: string;
  type: TaskType;
  title: string;
  due_at: string | null;
  completed?: boolean;
  weightage?: number | null;
  subject?: string | null;
  stipend?: string | null;
  score?: number;
  legacy_score?: number;
  source?: string;
  estimate?: string;
  action_label?: string;
  action_view?: string;
  action_pro_only?: boolean;
  external_url?: string;
  reason?: string;
  priority?: string;
  priority_factors?: unknown;
  priority_reason?: string;
};

function classifyStudent({
  userProfile,
  githubCache,
}: {
  userProfile: FeedUserProfile | null;
  githubCache: FeedGitHubCache | null;
}): StudentProfile {
  const semester: number = userProfile?.semester ?? 0;
  const subjects: string[] = userProfile?.subjects ?? [];
  const cgpa: number | null = userProfile?.cgpa ?? null;
  const repos: FeedRepo[] = githubCache?.repos ?? [];
  const healthScore: number = githubCache?.health_score ?? 0;
  const languages: Record<string, number> = githubCache?.languages ?? {};

  const reposWithDescription = repos.filter((r) => r.description?.trim());
  const hasBacklog = cgpa !== null && cgpa < 5.0;

  if (hasBacklog && subjects.length < 3 && healthScore < 20) {
    return 'no_foundation';
  }

  if (
    healthScore >= 50 &&
    subjects.length >= 3 &&
    repos.length >= 2 &&
    reposWithDescription.length >= 1
  ) {
    return 'job_ready';
  }

  if (
    (subjects.length > 0 || Object.keys(languages).length > 0) &&
    (repos.length < 2 || reposWithDescription.length === 0)
  ) {
    return 'skills_no_projects';
  }

  if (semester >= 3 && subjects.length < 3 && repos.length < 2) {
    return 'academics_first';
  }

  return 'no_foundation';
}

function buildSetupTasks({
  userProfile,
  githubCache,
  existingTasks,
}: {
  userProfile: FeedUserProfile | null;
  githubCache: FeedGitHubCache | null;
  existingTasks: FeedTask[];
}) {
  const setupTasks: FeedTask[] = [];
  const hasExamDates = existingTasks.some(
    (task) => ['exam', 'assignment'].includes(task.type) && task.due_at
  );
  const hasGithubUsername = Boolean(userProfile?.github_username);
  const hasGithubRepos = Boolean(githubCache?.repos?.length);
  const hasSubjects = Array.isArray(userProfile?.subjects) && userProfile.subjects.length > 0;

  if (!hasExamDates) {
    setupTasks.push({
      id: 'setup-exams',
      type: 'manual',
      title: 'Add your exam dates or upload your timetable',
      due_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      completed: false,
      score: 160,
      source: 'system',
      estimate: '5 min',
      action_label: 'Open settings',
      action_view: 'settings',
      reason: 'PrioryxAI needs your exam dates to rank your real next step correctly.',
    });
  }

  if (!hasGithubUsername) {
    setupTasks.push({
      id: 'setup-github-username',
      type: 'manual',
      title: 'Add your GitHub username so PrioryxAI can pull your repos',
      due_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      completed: false,
      score: 145,
      source: 'system',
      estimate: '3 min',
      action_label: 'Connect GitHub',
      action_view: 'settings',
      reason: 'Connecting GitHub lets the app track repos, streaks, and recruiter-facing proof of work.',
    });
  } else if (!hasGithubRepos) {
    setupTasks.push({
      id: 'setup-github-repos',
      type: 'manual',
      title: 'Sync your GitHub repos and identify the projects you want to improve',
      due_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      completed: false,
      score: 135,
      source: 'system',
      estimate: '3 min',
      action_label: 'Refresh GitHub',
      action_view: 'settings',
      reason: 'Your profile works best when PrioryxAI can see your repos and recent activity.',
    });
  }

  if (!hasSubjects) {
    setupTasks.push({
      id: 'setup-skills',
      type: 'manual',
      title: 'Add your subjects and technical skills so PrioryxAI can track relevant internships',
      due_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      completed: false,
      score: 125,
      source: 'system',
      estimate: '4 min',
      action_label: 'Update skills',
      action_view: 'settings',
      reason: 'Skill signals are used to rank academic, coding, and career tasks in the feed.',
    });
  }

  // Region-aware opportunity setup. India gets Internshala; other regions use the normalized opportunity feed.
  {
    const subjects: string[] = userProfile?.subjects ?? [];
    const languages: Record<string, number> = githubCache?.languages ?? {};
    const primaryRoles = deriveJobRoles(subjects, languages);
    const primaryRole = primaryRoles[0] ?? 'software developer';
    const roleLabel = primaryRole.replace(/\b\w/g, (c) => c.toUpperCase());
    const country = normalizeCountryCode(userProfile?.country) ?? 'IN';
    const isIndia = country === 'IN';

    setupTasks.push({
      id: isIndia ? 'browse-internshala' : 'browse-opportunities',
      type: 'job',
      title: isIndia
        ? `Browse ${roleLabel} openings on Internshala matched to your profile`
        : `Review ${roleLabel} opportunities matched to your region and skills`,
      due_at: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
      completed: false,
      score: 115,
      source: 'system',
      estimate: '5 min',
      action_label: isIndia ? 'Browse openings' : 'Update goals',
      action_view: isIndia ? 'external' : 'settings',
      action_pro_only: isIndia,
      external_url: isIndia ? buildInternshalaSearchUrl(primaryRole) : undefined,
      reason: isIndia
        ? 'Direct Internshala search filtered to your skill profile. Pro users get full access.'
        : 'The normalized opportunity feed can rank jobs and internships using your country, skills, and target roles.',
    });
  }

  // Profile-based guidance card
  const profile = classifyStudent({ userProfile, githubCache });
  const profileCards: Record<StudentProfile, FeedTask | null> = {
    no_foundation: {
      id: 'profile-guidance',
      type: 'manual',
      title: 'Set a study plan to strengthen your academic foundation',
      due_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      completed: false,
      score: 108,
      source: 'system',
      estimate: '10 min',
      action_label: 'Plan with AI',
      action_view: 'assistant',
      reason: 'A steady academic foundation makes every later step — projects, internships, placements — easier to build on.',
    },
    academics_first: {
      id: 'profile-guidance',
      type: 'manual',
      title: 'Good marks — now build one project to show you can execute',
      due_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      completed: false,
      score: 108,
      source: 'system',
      estimate: '10 min',
      action_label: 'Plan with AI',
      action_view: 'assistant',
      reason: 'Your academics are strong but recruiters also want proof of execution. One shipped project changes the conversion rate.',
    },
    skills_no_projects: {
      id: 'profile-guidance',
      type: 'manual',
      title: `You know the skills — build a portfolio project to prove it before internship season`,
      due_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      completed: false,
      score: 108,
      source: 'system',
      estimate: '10 min',
      action_label: 'Plan with AI',
      action_view: 'assistant',
      reason: 'Skills listed on a resume are unverifiable. A public GitHub project with a live demo is what converts an interview invite.',
    },
    job_ready: null, // job_ready users get Internshala deep link from the setup-jobs task instead
  };

  const profileCard = profileCards[profile];
  if (profileCard) {
    setupTasks.push(profileCard);
  }

  return setupTasks;
}

async function buildRepoGuidanceTask({
  userId,
  githubCache,
  userProfile,
}: {
  userId?: string;
  githubCache: FeedGitHubCache | null;
  userProfile: FeedUserProfile | null;
}) {
  // Only skip if GitHub isn't connected at all (no username)
  if (!userProfile?.github_username) {
    return null;
  }

  const repos: FeedRepo[] = githubCache?.repos ?? [];

  // Fast heuristic step or cached step to prevent blocking GET /api/feed
  let repoStep: { title: string; reason: string; estimate: string } | null = null;
  if (userId) {
    repoStep = await withFallback(() => redis.get(`repo_guidance:${userId}`), null, 200);
  }

  if (!repoStep) {
    const firstRepoWithDesc = repos.find((r) => r.description?.trim()) || repos[0];
    if (firstRepoWithDesc) {
      repoStep = {
        title: `Ship one visible improvement in ${firstRepoWithDesc.name}`,
        reason: `${firstRepoWithDesc.name} is connected. Turn that signal into stronger proof of execution with a demo-worthy improvement.`,
        estimate: '45 min',
      };
    } else {
      const topSkill = userProfile?.subjects?.[0] || 'Web';
      repoStep = {
        title: `Build a ${topSkill} project with authentication & live demo`,
        reason: 'A deployed project with a live URL signals execution ability to recruiters.',
        estimate: '2–3 weeks',
      };
    }

    if (userId) {
      withFallback(() => redis.set(`repo_guidance:${userId}`, repoStep, { ex: 7200 }), undefined);
    }
  }

  return {
    id: 'repo-next-step',
    type: 'manual',
    title: repoStep.title,
    due_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    completed: false,
    score: 110,
    source: 'system',
    estimate: repoStep.estimate,
    action_label: 'Plan with AI',
    action_view: 'assistant',
    reason: repoStep.reason,
  };
}

/** One "what to learn next" task from the roadmap that best matches the
 * user's stream/resume skills — see collectRoadmapSignals. */
async function buildRoadmapGuidanceTask(supabase: SupabaseClient, userId: string): Promise<FeedTask | null> {
  try {
    const [signal] = await collectRoadmapSignals(supabase, userId);
    if (!signal) return null;
    return {
      id: `roadmap-${signal.topicId}`,
      type: 'manual',
      title: `Roadmap: ${signal.topicTitle}`,
      due_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      completed: false,
      score: 100,
      source: 'system',
      estimate: '45 min',
      action_label: 'Open Roadmap',
      external_url: `/career/roadmap/${signal.roadmapId}`,
      reason: `Next step on your ${signal.roadmapLabel} roadmap journey — ${signal.sectionTitle}.`,
    };
  } catch {
    return null;
  }
}

/** One subject study-hour task, preferring the user's actual class timetable
 * over a generic profile subject — see collectTimetableSignals. */
async function buildSubjectStudyTask(supabase: SupabaseClient, userId: string): Promise<FeedTask | null> {
  try {
    const timetableSignals = await collectTimetableSignals(supabase, userId);
    const [signal] = timetableSignals.length > 0 ? timetableSignals : await collectSubjectSignals(supabase, userId);
    if (!signal) return null;
    return {
      id: `subject-${signal.subject}`,
      type: 'manual',
      title: signal.actionTitle,
      due_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      completed: false,
      score: 95,
      source: 'system',
      estimate: `${signal.estimatedMinutes} min`,
      action_label: 'View Syllabus',
      action_view: 'settings',
      reason: signal.actionDescription,
    };
  } catch {
    return null;
  }
}

/** One "improve this skill" task from the user's resume SWOT critical gaps —
 * see collectResumeSignals. Distinct from the one-time setup nudges. */
async function buildSkillGapTask(supabase: SupabaseClient, userId: string): Promise<FeedTask | null> {
  try {
    const [signal] = await collectResumeSignals(supabase, userId, []);
    if (!signal) return null;
    return {
      id: `skill-gap-${signal.gapSkill}`,
      type: 'manual',
      title: `Improve: ${signal.gapSkill}`,
      due_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      completed: false,
      score: 90,
      source: 'system',
      estimate: `${signal.estimatedMinutes} min`,
      action_label: 'View Resume Gaps',
      external_url: signal.actionUrl,
      reason: signal.whyNow,
    };
  } catch {
    return null;
  }
}

function buildJobReason(task: FeedTask, userSubjects: string[]): string {
  const skills: string[] = task.subject
    ? task.subject.split(',').map((s: string) => s.trim()).filter(Boolean)
    : [];

  // Find which skills the user actually has
  const matched = skills.filter(skill =>
    userSubjects.some(subj =>
      subj.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(subj.toLowerCase())
    )
  );

  const skillText =
    matched.length > 0
      ? `Matched on ${matched.slice(0, 2).join(' + ')}`
      : skills.length > 0
        ? `Requires ${skills.slice(0, 2).join(' + ')}`
        : 'Matches your skill profile';

  const stipendText = task.stipend ? ` · ${task.stipend}/mo` : '';

  const daysLeft = task.due_at
    ? Math.ceil((new Date(task.due_at).getTime() - Date.now()) / 86_400_000)
    : null;
  const urgencyText =
    daysLeft !== null
      ? daysLeft <= 0
        ? ' · Deadline today'
        : daysLeft <= 3
          ? ` · ${daysLeft}d left to apply`
          : daysLeft <= 14
            ? ` · ${daysLeft} days left`
            : ''
      : '';

  return `${skillText}${stipendText}${urgencyText}`;
}

export interface FeedDataOptions {
  /** Page/limit are only applied when explicitly requested (matches the
   * original route's "pagination mode only kicks in with an explicit
   * ?limit=" behavior) — the SSR initial load omits both, same as the
   * client's default fetch("/api/feed") with no query string. */
  page?: number;
  limit?: number;
}

export async function getFeedData(
  supabase: SupabaseClient,
  userId: string,
  options: FeedDataOptions = {}
) {
  const cacheKey = `feed:${userId}`;
  const cached = await withFallback(() => redis.get(cacheKey), null);
  if (cached) {
    return cached;
  }

  const userProfileQuery = supabase
    .from('users')
    .select('college, semester, subjects, cgpa, github_username, pro_status, pro_expires_at, country')
    .eq('id', userId)
    .maybeSingle();

  const [userProfileResult, { data: githubCache }, { data: tasks, error }] = await Promise.all([
    userProfileQuery,
    supabase
      .from('github_cache')
      .select('languages, repos')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .limit(200),
  ]);
  let userProfile = userProfileResult.data as FeedUserProfile | null;
  if (errorMentionsColumn(userProfileResult.error, 'country')) {
    const { data } = await supabase
      .from('users')
      .select('college, semester, subjects, cgpa, github_username, pro_status, pro_expires_at')
      .eq('id', userId)
      .maybeSingle();
    userProfile = data as FeedUserProfile | null;
  }

  if (error) {
    console.error('[feed] DB error:', error);
    throw new Error('Failed to load feed');
  }

  const isPro = Boolean(userProfile?.pro_status) &&
    (!userProfile?.pro_expires_at || new Date(userProfile.pro_expires_at) > new Date());

  const shouldSyncJobs =
    Boolean(process.env.APIFY_TOKEN) &&
    (normalizeCountryCode(userProfile?.country) ?? 'IN') === 'IN' &&
    ((userProfile?.subjects?.length ?? 0) > 0 || Object.keys(githubCache?.languages ?? {}).length > 0);

  if (shouldSyncJobs) {
    // Non-blocking fire-and-forget sync to ensure feed returns in milliseconds
    syncInternshalaJobsForUser({
      userId,
      subjects: userProfile?.subjects ?? [],
      college: userProfile?.college ?? null,
      languages: githubCache?.languages ?? null,
    }).catch(() => null);
  }

  const userSubjects: string[] = userProfile?.subjects ?? [];
  // These two do independent I/O (Supabase + Redis respectively) and neither
  // depends on the other's result — they were previously awaited one after
  // another, paying two network round-trips in series for no reason.
  const [priorityContext, repoGuidanceTask, roadmapGuidanceTask, subjectStudyTask, skillGapTask] = await Promise.all([
    buildPriorityContext(supabase, userId).catch(() => ({})),
    buildRepoGuidanceTask({ userId, githubCache, userProfile }),
    buildRoadmapGuidanceTask(supabase, userId),
    buildSubjectStudyTask(supabase, userId),
    buildSkillGapTask(supabase, userId),
  ]);

  // Enrich job tasks with a specific match reason (skills + stipend + urgency)
  // so the Next Move Card and feed cards show concrete context, not a generic label.
  const scored = (tasks ?? [])
    .map(t => {
      const explainable = computeExplainablePriority(t, priorityContext);
      const enriched = {
        ...t,
        legacy_score: computePriorityScore(t),
        score: explainable.score,
        priority_factors: explainable.factors,
        priority_reason: explainable.summary,
      };
      if (t.type === 'job' && !t.reason) {
        enriched.reason = buildJobReason(t, userSubjects);
      }
      return enriched;
    })
    .filter(t => t.score > 0);

  // Real feed: actual work tasks + one each of the daily system-generated
  // variety (GitHub fix, roadmap next-step, subject study block, skill gap).
  // Setup nudges are returned separately so they never displace real next moves.
  const realFeed = [
    ...(repoGuidanceTask ? [repoGuidanceTask] : []),
    ...(roadmapGuidanceTask ? [roadmapGuidanceTask] : []),
    ...(subjectStudyTask ? [subjectStudyTask] : []),
    ...(skillGapTask ? [skillGapTask] : []),
    ...scored,
  ].sort((a, b) => b.score - a.score);

  // Setup items: what the user still needs to configure (shown as a strip, not the hero card)
  const setup = buildSetupTasks({ userProfile, githubCache, existingTasks: tasks ?? [] });

  const page = options.page ? Math.max(1, options.page) : 1;
  const hasLimitParam = options.limit !== undefined;
  const limit = hasLimitParam ? Math.min(50, Math.max(1, options.limit!)) : 20;

  const FREE_LIMIT = 5;
  const totalCount = realFeed.length;
  const hasMore = !isPro && totalCount > FREE_LIMIT;
  const baseFeed = isPro ? realFeed : realFeed.slice(0, FREE_LIMIT);
  const offset = (page - 1) * limit;
  const feed = hasLimitParam ? baseFeed.slice(offset, offset + limit) : baseFeed;

  // Build hiddenPreview so the blur wall can show a specific tease (job title, breakdown)
  let hiddenPreview: { count: number; topJobTitle: string | null; breakdown: string | null } | null = null;
  if (!isPro && totalCount > FREE_LIMIT) {
    const hiddenTasks = realFeed.slice(FREE_LIMIT);
    const topJob = hiddenTasks.find((t) => t.type === 'job');
    const examCount = hiddenTasks.filter((t) => t.type === 'exam').length;
    const assignmentCount = hiddenTasks.filter((t) => t.type === 'assignment').length;
    const jobCount = hiddenTasks.filter((t) => t.type === 'job').length;
    const parts: string[] = [];
    if (examCount > 0) parts.push(`${examCount} exam${examCount > 1 ? 's' : ''}`);
    if (assignmentCount > 0) parts.push(`${assignmentCount} assignment${assignmentCount > 1 ? 's' : ''}`);
    if (jobCount > 0) parts.push(`${jobCount} internship${jobCount > 1 ? 's' : ''}`);
    hiddenPreview = {
      count: totalCount - FREE_LIMIT,
      topJobTitle: topJob?.title ?? null,
      breakdown: parts.length > 0 ? parts.join(', ') : null,
    };
  }

  const nextMove = feed[0]
    ? { task: feed[0], reason: feed[0].reason ?? getNextMoveReason(feed[0]) }
    : null;

  const result = {
    feed,
    setup,
    nextMove,
    hasMore,
    hiddenPreview,
    totalCount,
    ...(hasLimitParam ? {
      pagination: {
        page,
        limit,
        total: baseFeed.length,
        totalPages: Math.ceil(baseFeed.length / limit),
        hasMore: offset + limit < baseFeed.length,
      }
    } : {})
  };

  // Cache for 1 minute
  await withFallback(() => redis.set(cacheKey, result, { ex: FEED_CACHE_TTL }), undefined);

  return result;
}
