import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { computePriorityScore, getNextMoveReason } from '@/lib/scoring';
import { withFallback, redis } from '@/lib/redis';
import { syncInternshalaJobsForUser } from '@/lib/job-sync';
import { generateRepoNextStep } from '@/lib/repo-next-step';

export const runtime = 'nodejs';

const FEED_CACHE_TTL = 60; // 1 minute

function buildSetupTasks({
  userProfile,
  githubCache,
  existingTasks,
}: {
  userProfile: any;
  githubCache: any;
  existingTasks: any[];
}) {
  const setupTasks: any[] = [];
  const hasExamDates = existingTasks.some(
    (task) => ['exam', 'assignment'].includes(task.type) && task.due_at
  );
  const hasGithubUsername = Boolean(userProfile?.github_username);
  const hasGithubRepos = Boolean(githubCache?.repos?.length);
  const hasSubjects = Array.isArray(userProfile?.subjects) && userProfile.subjects.length > 0;
  const hasJobs = existingTasks.some((task) => task.type === 'job');

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
      reason: 'Skill signals are used to monitor Internshala roles and rank career tasks in the feed.',
    });
  } else if (!hasJobs) {
    setupTasks.push({
      id: 'setup-jobs',
      type: 'job',
      title: 'Browse Internshala openings matched to your skill profile',
      due_at: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
      completed: false,
      score: 115,
      source: 'system',
      estimate: '5 min',
      action_label: 'Browse openings',
      action_view: 'external',
      external_url: 'https://internshala.com/internships',
      reason: 'No live internship openings have synced yet. Browse Internshala directly or reconnect GitHub to trigger auto-matching.',
    });
  }

  return setupTasks;
}

async function buildRepoGuidanceTask({
  githubCache,
  userProfile,
}: {
  githubCache: any;
  userProfile: any;
}) {
  const repos: any[] = githubCache?.repos ?? [];
  if (repos.length === 0) {
    return null;
  }

  const repoStep = await generateRepoNextStep({
    repos,
    subjects: userProfile?.subjects ?? [],
  });

  if (!repoStep) {
    return null;
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

function buildJobReason(task: any, userSubjects: string[]): string {
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

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Try cache first
  const cacheKey = `feed:${user.id}`;
  const cached = await withFallback(() => redis.get(cacheKey), null);
  if (cached) {
    return NextResponse.json(cached);
  }

  const [{ data: userProfile }, { data: githubCache }] = await Promise.all([
    supabase
      .from('users')
      .select('college, semester, subjects, github_username, pro_status, pro_expires_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('github_cache')
      .select('languages, repos')
      .eq('user_id', user.id)
      .single(),
  ]);

  const isPro = Boolean(userProfile?.pro_status) &&
    (!userProfile?.pro_expires_at || new Date(userProfile.pro_expires_at) > new Date());

  const shouldSyncJobs =
    Boolean(process.env.APIFY_TOKEN) &&
    ((userProfile?.subjects?.length ?? 0) > 0 || Object.keys(githubCache?.languages ?? {}).length > 0);

  if (shouldSyncJobs) {
    await withFallback(
      () =>
        syncInternshalaJobsForUser({
          userId: user.id,
          subjects: userProfile?.subjects ?? [],
          college: userProfile?.college ?? null,
          languages: githubCache?.languages ?? null,
        }),
      null
    );
  }

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('completed', false)
    .limit(200);

  if (error) {
    console.error('[feed] DB error:', error);
    return NextResponse.json({ error: 'Failed to load feed' }, { status: 500 });
  }

  const userSubjects: string[] = userProfile?.subjects ?? [];

  // Enrich job tasks with a specific match reason (skills + stipend + urgency)
  // so the Next Move Card and feed cards show concrete context, not a generic label.
  const scored = (tasks ?? [])
    .map(t => {
      const enriched = { ...t, score: computePriorityScore(t) };
      if (t.type === 'job' && !t.reason) {
        enriched.reason = buildJobReason(t, userSubjects);
      }
      return enriched;
    })
    .filter(t => t.score > 0);

  const repoGuidanceTask = await buildRepoGuidanceTask({ githubCache, userProfile });

  // Real feed: only actual work tasks + AI repo guidance.
  // Setup nudges are returned separately so they never displace real next moves.
  const realFeed = [
    ...(repoGuidanceTask ? [repoGuidanceTask] : []),
    ...scored,
  ].sort((a, b) => b.score - a.score);

  // Setup items: what the user still needs to configure (shown as a strip, not the hero card)
  const setup = buildSetupTasks({ userProfile, githubCache, existingTasks: tasks ?? [] });

  const FREE_LIMIT = 25;
  const totalCount = realFeed.length;
  const hasMore = !isPro && totalCount > FREE_LIMIT;
  const feed = isPro ? realFeed : realFeed.slice(0, FREE_LIMIT);

  const nextMove = feed[0]
    ? { task: feed[0], reason: feed[0].reason ?? getNextMoveReason(feed[0]) }
    : null;

  const result = { feed, setup, nextMove, hasMore, totalCount };

  // Cache for 1 minute
  await withFallback(() => redis.set(cacheKey, result, { ex: FEED_CACHE_TTL }), undefined);

  return NextResponse.json(result);
}
