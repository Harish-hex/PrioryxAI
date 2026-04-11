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
      reason: 'DeadlineOS needs your exam dates to rank your real next step correctly.',
    });
  }

  if (!hasGithubUsername) {
    setupTasks.push({
      id: 'setup-github-username',
      type: 'manual',
      title: 'Add your GitHub username so DeadlineOS can pull your repos',
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
      reason: 'Your profile works best when DeadlineOS can see your repos and recent activity.',
    });
  }

  if (!hasSubjects) {
    setupTasks.push({
      id: 'setup-skills',
      type: 'manual',
      title: 'Add your subjects and technical skills so DeadlineOS can track relevant internships',
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
      type: 'manual',
      title: 'Review the latest Internshala openings matched to your skill profile',
      due_at: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
      completed: false,
      score: 115,
      source: 'system',
      estimate: '5 min',
      action_label: 'Open settings',
      action_view: 'settings',
      reason: 'No live internship openings are in your feed yet, so the next step is to refresh that lane.',
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

  const scored = (tasks ?? [])
    .map(t => ({ ...t, score: computePriorityScore(t) }))
    .filter(t => t.score > 0);

  const repoGuidanceTask = await buildRepoGuidanceTask({ githubCache, userProfile });

  const combined = [
    ...buildSetupTasks({ userProfile, githubCache, existingTasks: tasks ?? [] }),
    ...(repoGuidanceTask ? [repoGuidanceTask] : []),
    ...scored,
  ]
    .sort((a, b) => b.score - a.score);

  const nextMove = combined[0]
    ? { task: combined[0], reason: combined[0].reason ?? getNextMoveReason(combined[0]) }
    : null;

  const isPro =
    userProfile?.pro_status &&
    (!userProfile.pro_expires_at || new Date(userProfile.pro_expires_at) > new Date());

  const FREE_TASK_LIMIT = 25;
  const hasMore = !isPro && combined.length > FREE_TASK_LIMIT;
  const feed = isPro ? combined : combined.slice(0, FREE_TASK_LIMIT);

  const result = { feed, nextMove, hasMore };

  // Cache for 1 minute
  await withFallback(() => redis.set(cacheKey, result, { ex: FEED_CACHE_TTL }), undefined);

  return NextResponse.json(result);
}
