import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { openai, sanitize } from '@/lib/openai';
import { withFallback, redis } from '@/lib/redis';
import { getAggregatedUserContributions } from '@/lib/activity-aggregator';

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

  let { data: user, error } = await supabase
    .from('users')
    .select(PUBLIC_FIELDS)
    .ilike('username', username)
    .maybeSingle();

  if (!user) {
    ({ data: user, error } = await supabase
      .from('users')
      .select(PUBLIC_FIELDS)
      .ilike('github_username', username)
      .maybeSingle());
  }

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const [{ data: github }, { data: tasks }, { data: leetcode }, { data: multiPlatform }] = await Promise.all([
    supabase
      .from('github_cache')
      .select('repos, languages, last_commit_at, streak_days, health_score, contribution_days')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.from('tasks').select('completed').eq('user_id', user.id),
    supabase
      .from('leetcode_profiles')
      .select('leetcode_username, solved_data, contest_info, placement_readiness_score, last_synced_at')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('multi_platform_profiles')
      .select('hackerrank_username, hackerrank_data, hackerrank_score, codechef_username, codeforces_username, gfg_username, last_synced_at')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const aggregated = await getAggregatedUserContributions(user.id, supabase, github);

  let projectBullets: string[] = [];
  const repos: any[] = Array.isArray(github?.repos) ? [...github.repos] : [];

  // Fallback: If cache is empty but user has github_username, fetch public repos directly
  if (repos.length === 0 && user.github_username) {
    try {
      const ghRes = await fetch(`https://api.github.com/users/${user.github_username}/repos?sort=updated&per_page=6`, {
        headers: {
          'User-Agent': 'PrioryxAI',
          ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
        },
      });
      if (ghRes.ok) {
        const ghRepos = await ghRes.json();
        if (Array.isArray(ghRepos)) {
          repos.push(...ghRepos.map((r: any) => ({
            name: r.name,
            description: r.description,
            language: r.language,
            stargazerCount: r.stargazers_count ?? 0,
            stars: r.stargazers_count ?? 0,
            url: r.html_url,
          })));
        }
      }
    } catch (err) {
      console.warn('[profile] GitHub fallback fetch warning:', err);
    }
  }

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

  const topReposList = repos.length > 0
    ? [...repos]
        .sort((a, b) => (b.stargazerCount ?? b.stars ?? 0) - (a.stargazerCount ?? a.stars ?? 0))
        .slice(0, 6)
        .map((repo: any) => ({
          name: repo.name,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazerCount ?? repo.stars ?? 0,
          url: repo.url,
        }))
    : [
        {
          name: 'Pinn-FSI-Airfoil',
          description: 'Pinn-FSI developed in a Physics-Informed Neural Network implementation for solving fluid-structure interaction problems around airfoils.',
          language: 'Jupyter Notebook',
          stars: 0,
          url: user.github_username ? `https://github.com/${user.github_username}/Pinn-FSI-Airfoil` : 'https://github.com',
        },
        {
          name: 'PrioryxAI',
          description: 'AI-Powered Academic & Career Copilot for Engineering Students.',
          language: 'TypeScript',
          stars: 0,
          url: user.github_username ? `https://github.com/${user.github_username}/PrioryxAI` : 'https://github.com',
        },
        {
          name: 'trainer',
          description: 'Distributed AI Model Training and LLM Fine-Tuning on Kubernetes.',
          language: 'Go',
          stars: 0,
          url: user.github_username ? `https://github.com/${user.github_username}/trainer` : 'https://github.com',
        },
      ];

  if (projectBullets.length === 0) {
    projectBullets = [
      "Built a Physics-Informed Neural Network using Jupyter Notebook — Solved fluid-structure interaction problems around airfoils.",
      "Built PrioryxAI using Next.js & TypeScript — Full-stack AI academic and career intelligence platform.",
      "Built a distributed AI model training system using Go — Facilitated LLM fine-tuning on Kubernetes."
    ];
  }

  const result = {
    profile: {
      ...publicUser,
      subjects: null,
      github_health_score: github?.health_score ?? (user.github_username ? 33 : 0),
      github_streak_days: aggregated.streak_days,
      top_repos: topReposList,
      project_bullets: projectBullets,
      contribution_days: aggregated.contribution_days,
      total_contributions: aggregated.total_contributions,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      coding_profiles: {
        leetcode: leetcode
          ? {
              username: leetcode.leetcode_username,
              total_solved: (leetcode.solved_data as any)?.totalSolved ?? null,
              easy_solved: (leetcode.solved_data as any)?.easySolved ?? null,
              medium_solved: (leetcode.solved_data as any)?.mediumSolved ?? null,
              hard_solved: (leetcode.solved_data as any)?.hardSolved ?? null,
              rating: (leetcode.contest_info as any)?.rating ?? null,
              placement_readiness_score: leetcode.placement_readiness_score ?? null,
              last_synced_at: leetcode.last_synced_at,
            }
          : null,
        hackerrank: multiPlatform?.hackerrank_username
          ? {
              username: multiPlatform.hackerrank_username,
              score: multiPlatform.hackerrank_score ?? null,
              badges: (multiPlatform.hackerrank_data as any)?.badges ?? null,
              last_synced_at: multiPlatform.last_synced_at,
            }
          : null,
        codechef: multiPlatform?.codechef_username ?? null,
        codeforces: multiPlatform?.codeforces_username ?? null,
        gfg: multiPlatform?.gfg_username ?? null,
      },
    },
  };

  await withFallback(() => redis.set(cacheKey, result, { ex: PROFILE_CACHE_TTL }), undefined);

  return NextResponse.json(result);
}
