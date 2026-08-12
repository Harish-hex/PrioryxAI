import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { openai, sanitize } from '@/lib/openai';
import { withFallback, redis } from '@/lib/redis';

export const runtime = 'nodejs';

const PROFILE_CACHE_TTL = 600; // 10 minutes

// Whitelisted fields — never expose email, pro_status, pro_expires_at
const PUBLIC_FIELDS = 'id, name, username, avatar_url, github_username, college, semester';

// Allowlist: usernames are alphanumeric + hyphens only (GitHub convention)
const USERNAME_RE = /^[a-zA-Z0-9-]{1,39}$/;

export async function GET(
  _request: NextRequest,
  { params }: { params: { username: string } }
) {
  const username = params.username;

  // Validate username format to prevent injection / path traversal
  if (!USERNAME_RE.test(username)) {
    return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
  }

  const cacheKey = `profile:${username}`;
  const cached = await withFallback(() => redis.get(cacheKey), null);
  if (cached) {
    return NextResponse.json(cached);
  }

  const supabase = createServiceClient();

  const { data: user, error } = await supabase
    .from('users')
    .select(PUBLIC_FIELDS)
    .eq('username', username)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const [{ data: github }, { data: tasks }, { data: internalContribs }] = await Promise.all([
    supabase
      .from('github_cache')
      .select('repos, languages, last_commit_at, streak_days, health_score, contribution_days')
      .eq('user_id', user.id)
      .single(),
    supabase.from('tasks').select('completed').eq('user_id', user.id),
    supabase.rpc('get_user_daily_activity', {
      p_user_id: user.id,
      p_from: new Date(Date.now() - 126 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }),
  ]);

  let projectBullets: string[] = [];
  const repos: any[] = github?.repos ?? [];
  if (repos.length > 0) {
    const topRepos = repos.slice(0, 3);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `Write one concise resume-style bullet for each of these GitHub repos. Format: "Built X using Y — Z". Return a JSON array of strings only.
Repos: ${JSON.stringify(topRepos.map((r: any) => ({ name: sanitize(r.name), description: sanitize(r.description), language: sanitize(r.language) })))}`,
          },
        ],
        max_tokens: 300,
      });
      const raw = response.choices[0].message.content ?? '[]';
      projectBullets = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      projectBullets = topRepos.map((r: any) => `Built ${sanitize(r.name)}${r.language ? ` using ${r.language}` : ''}`);
    }
  }

  // Strip internal id from the response
  const { id: _id, ...publicUser } = user as typeof user & { id: string };
  const totalTasks = tasks?.length ?? 0;
  const completedTasks = tasks?.filter((task: any) => task.completed).length ?? 0;

  const result = {
    profile: {
      ...publicUser,
      subjects: null,
      github_health_score: github?.health_score ?? 0,
      github_streak_days: github?.streak_days ?? 0,
      top_repos: [...repos]
        .sort((a, b) => (b.stargazerCount ?? b.stars ?? 0) - (a.stargazerCount ?? a.stars ?? 0))
        .slice(0, 6)
        .map((repo: any) => ({
          name: repo.name,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazerCount ?? repo.stars ?? 0,
          url: repo.url,
        })),
      project_bullets: projectBullets,
      contribution_days: (internalContribs ?? [])?.map((row: any) => ({
        date: row.activity_date,
        count: Number(row.count)
      })),
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
    },
  };

  await withFallback(() => redis.set(cacheKey, result, { ex: PROFILE_CACHE_TTL }), undefined);

  return NextResponse.json(result);
}
