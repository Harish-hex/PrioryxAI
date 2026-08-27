import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { withFallback, redis } from '@/lib/redis';
import { errorMentionsColumn } from '@/lib/schema-migrations';
import { getAggregatedUserContributions } from '@/lib/activity-aggregator';

export const runtime = 'nodejs';

// Fields the user can read about themselves (includes private fields)
const SELF_FIELDS = 'id, name, username, email, avatar_url, github_username, college, semester, subjects, cgpa, pro_status, pro_expires_at, last_active_at';

// Fields the user is allowed to update
const UPDATABLE_FIELDS = new Set(['name', 'username', 'college', 'semester', 'subjects', 'github_username', 'cgpa']);

// Username: alphanumeric + hyphens, 1–39 chars (GitHub convention)
const USERNAME_RE = /^[a-zA-Z0-9-]{1,39}$/;

function getDbClient(supabaseAuthClient: any) {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return supabaseAuthClient;
}

const SELF_PROFILE_CACHE_TTL = 60; // seconds — short enough to reflect a fresh connect/edit quickly

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cacheKey = `user-profile:${user.id}`;
  const cached = await withFallback(() => redis.get(cacheKey), null);
  if (cached) {
    return NextResponse.json(cached);
  }

  const db = getDbClient(supabase);

  let { data, error } = await db
    .from('users')
    .select(SELF_FIELDS)
    .eq('id', user.id)
    .maybeSingle();

  if (errorMentionsColumn(error, 'cgpa')) {
    const safeFields = SELF_FIELDS.replace(/, cgpa/, '');
    ({ data, error } = await db.from('users').select(safeFields).eq('id', user.id).maybeSingle());
  }

  const [{ data: github }, { data: tasks }, { data: leetcode }, { data: multiPlatform }] = await Promise.all([
    db
      .from('github_cache')
      .select('repos, languages, last_commit_at, streak_days, health_score, contribution_days')
      .eq('user_id', user.id)
      .maybeSingle(),
    db.from('tasks').select('completed').eq('user_id', user.id),
    db
      .from('leetcode_profiles')
      .select('leetcode_username, solved_data, contest_info, placement_readiness_score, last_synced_at')
      .eq('user_id', user.id)
      .maybeSingle(),
    db
      .from('multi_platform_profiles')
      .select('hackerrank_username, hackerrank_data, hackerrank_score, codechef_username, codeforces_username, gfg_username, last_synced_at')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const aggregated = await getAggregatedUserContributions(user.id, db, github);

  const repos: any[] = Array.isArray(github?.repos) ? [...github.repos] : [];
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
          url: data?.github_username ? `https://github.com/${data.github_username}/Pinn-FSI-Airfoil` : 'https://github.com',
        },
        {
          name: 'PrioryxAI',
          description: 'AI-Powered Academic & Career Copilot for Engineering Students.',
          language: 'TypeScript',
          stars: 0,
          url: data?.github_username ? `https://github.com/${data.github_username}/PrioryxAI` : 'https://github.com',
        },
        {
          name: 'trainer',
          description: 'Distributed AI Model Training and LLM Fine-Tuning on Kubernetes.',
          language: 'Go',
          stars: 0,
          url: data?.github_username ? `https://github.com/${data.github_username}/trainer` : 'https://github.com',
        },
      ];

  const projectBullets = [
    "Built a Physics-Informed Neural Network using Jupyter Notebook — Solved fluid-structure interaction problems around airfoils.",
    "Built PrioryxAI using Next.js & TypeScript — Full-stack AI academic and career intelligence platform.",
    "Built a distributed AI model training system using Go — Facilitated LLM fine-tuning on Kubernetes."
  ];

  const totalTasks = tasks?.length ?? 0;
  const completedTasks = tasks?.filter((task: any) => task.completed).length ?? 0;

  const responseBody = {
    profile: {
      ...data,
      github_health_score: github?.health_score ?? (data?.github_username ? 33 : 0),
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

  await withFallback(() => redis.set(cacheKey, responseBody, { ex: SELF_PROFILE_CACHE_TTL }), undefined);

  return NextResponse.json(responseBody);
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDbClient(supabase);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Whitelist — only allow known safe fields to be updated
  const updates: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(body)) {
    if (!UPDATABLE_FIELDS.has(key)) continue;

    if (key === 'username') {
      if (typeof val !== 'string' || !USERNAME_RE.test(val)) {
        return NextResponse.json({ error: 'Invalid username. Use 1–39 alphanumeric characters or hyphens.' }, { status: 400 });
      }
    }

    if (key === 'semester') {
      if (val === null || val === '' || val === undefined) {
        updates[key] = null;
        continue;
      }
      const n = Number(val);
      if (!Number.isInteger(n) || n < 1 || n > 12) {
        return NextResponse.json({ error: 'Semester must be an integer between 1 and 12.' }, { status: 400 });
      }
      updates[key] = n;
      continue;
    }

    if (key === 'cgpa') {
      if (val === null || val === '' || val === undefined) {
        updates[key] = null;
        continue;
      }
      const n = Number(val);
      if (isNaN(n) || n < 0 || n > 10) {
        return NextResponse.json({ error: 'CGPA must be a number between 0 and 10.' }, { status: 400 });
      }
      updates[key] = Math.round(n * 10) / 10; // store with 1 decimal
      continue;
    }

    if (key === 'subjects') {
      if (!Array.isArray(val) || val.some(s => typeof s !== 'string')) {
        return NextResponse.json({ error: 'Subjects must be an array of strings.' }, { status: 400 });
      }
      updates[key] = (val as string[]).slice(0, 10).map(s => String(s).slice(0, 100));
      continue;
    }

    if ((key === 'name' || key === 'college' || key === 'github_username') && (val === null || val === '')) {
      updates[key] = null;
      continue;
    }

    if (typeof val === 'string') {
      updates[key] = val.slice(0, 200);
    }
  }

  let previousUsername: string | null = null;

  // Fetch existing user record to check username change and existence
  const { data: existingUser } = await db
    .from('users')
    .select('id, username')
    .eq('id', user.id)
    .maybeSingle();

  previousUsername = existingUser?.username ?? null;

  if (Object.keys(updates).length === 0) {
    if (existingUser) {
      return NextResponse.json({ profile: existingUser });
    }
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
  }

  // Check username uniqueness if being changed
  if (updates.username && updates.username !== previousUsername) {
    const { data: existing } = await db
      .from('users')
      .select('id')
      .eq('username', updates.username)
      .neq('id', user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Username already taken.' }, { status: 409 });
    }
  }

  const rawUsername = user.email ? user.email.split('@')[0].replace(/[^a-zA-Z0-9-]/g, '') : `user${Date.now().toString().slice(-4)}`;

  const upsertPayload: Record<string, unknown> = {
    id: user.id,
    email: user.email!,
    last_active_at: new Date().toISOString(),
    ...updates,
  };

  if (!existingUser) {
    if (!upsertPayload.username) {
      upsertPayload.username = rawUsername;
    }
    if (!upsertPayload.name && (user.user_metadata?.name || user.user_metadata?.full_name)) {
      upsertPayload.name = user.user_metadata?.name || user.user_metadata?.full_name;
    }
    upsertPayload.pro_status = false;
  }

  let { data, error } = await db
    .from('users')
    .upsert(upsertPayload, { onConflict: 'id' })
    .select(SELF_FIELDS)
    .single();

  // If cgpa column doesn't exist yet (migration not run), silently retry without it
  if (errorMentionsColumn(error, 'cgpa')) {
    console.warn('[user/profile PATCH] cgpa column missing — saving without it.');
    const safeFields = SELF_FIELDS.replace(/, cgpa/, '');
    const safePayload = { ...upsertPayload };
    delete safePayload.cgpa;
    ({ data, error } = await db
      .from('users')
      .upsert(safePayload, { onConflict: 'id' })
      .select(safeFields)
      .single());
  }

  if (error) {
    console.error('[user/profile PATCH] DB Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 });
  }

  // Invalidate public + self profile caches
  if (previousUsername && previousUsername !== data?.username) {
    await withFallback(() => redis.del(`profile:${previousUsername}`), 0);
  }
  if (data?.username) {
    await withFallback(() => redis.del(`profile:${data.username}`), 0);
  }
  await withFallback(() => redis.del(`user-profile:${user.id}`), 0);

  return NextResponse.json({ profile: data });
}
