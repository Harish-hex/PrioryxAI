import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js';
import { withFallback, redis } from '@/lib/redis';
import { errorMentionsColumn } from '@/lib/schema-migrations';

export const runtime = 'nodejs';

// Fields the user can read about themselves (includes private fields)
const BASE_SELF_FIELDS = 'id, name, username, email, avatar_url, github_username, college, semester, subjects, cgpa, target_roles, target_companies, pro_status, pro_expires_at, last_active_at';
const GLOBAL_SELF_FIELDS = 'country, region, locale, timezone, preferred_language, currency, academic_system, term_system, grading_system, available_hours_per_week, preferred_work_start, preferred_work_end, career_goals';
const SELF_FIELDS = `${BASE_SELF_FIELDS}, ${GLOBAL_SELF_FIELDS}`;
const GLOBAL_PROFILE_COLUMNS = GLOBAL_SELF_FIELDS.split(',').map((field) => field.trim());

// Fields the user is allowed to update
const UPDATABLE_FIELDS = new Set([
  'name',
  'username',
  'college',
  'semester',
  'subjects',
  'github_username',
  'cgpa',
  'country',
  'region',
  'locale',
  'timezone',
  'preferred_language',
  'currency',
  'academic_system',
  'term_system',
  'grading_system',
  'available_hours_per_week',
  'preferred_work_start',
  'preferred_work_end',
  'career_goals',
  'target_roles',
  'target_companies',
]);

// Username: alphanumeric + hyphens, 1–39 chars (GitHub convention)
const USERNAME_RE = /^[a-zA-Z0-9-]{1,39}$/;

type GitHubRepo = {
  name?: string;
  description?: string | null;
  language?: string | null;
  stargazerCount?: number;
  stars?: number;
  url?: string;
};

type GitHubProfileCache = {
  repos?: GitHubRepo[] | null;
  health_score?: number | null;
  streak_days?: number | null;
  contribution_days?: { date: string; count: number }[] | null;
};

type TaskCompletionRow = { completed?: boolean | null };
type SelfProfileRow = {
  github_username?: string | null;
  [key: string]: unknown;
};

function getDbClient(supabaseAuthClient: SupabaseClient) {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return supabaseAuthClient;
}

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
  if (GLOBAL_PROFILE_COLUMNS.some((column) => errorMentionsColumn(error, column))) {
    ({ data, error } = await db.from('users').select(BASE_SELF_FIELDS).eq('id', user.id).maybeSingle());
  }

  const profileData = (data ?? {}) as SelfProfileRow;

  const [{ data: github }, { data: tasks }] = await Promise.all([
    db
      .from('github_cache')
      .select('repos, languages, last_commit_at, streak_days, health_score, contribution_days')
      .eq('user_id', user.id)
      .maybeSingle(),
    db.from('tasks').select('completed').eq('user_id', user.id),
  ]);

  const githubCache = github as GitHubProfileCache | null;
  const repos: GitHubRepo[] = Array.isArray(githubCache?.repos) ? [...githubCache.repos] : [];
  const topReposList = repos.length > 0
    ? [...repos]
        .sort((a, b) => (b.stargazerCount ?? b.stars ?? 0) - (a.stargazerCount ?? a.stars ?? 0))
        .slice(0, 6)
        .map((repo) => ({
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
          url: profileData.github_username ? `https://github.com/${profileData.github_username}/Pinn-FSI-Airfoil` : 'https://github.com',
        },
        {
          name: 'PrioryxAI',
          description: 'AI-Powered Academic & Career Copilot for Engineering Students.',
          language: 'TypeScript',
          stars: 0,
          url: profileData.github_username ? `https://github.com/${profileData.github_username}/PrioryxAI` : 'https://github.com',
        },
        {
          name: 'trainer',
          description: 'Distributed AI Model Training and LLM Fine-Tuning on Kubernetes.',
          language: 'Go',
          stars: 0,
          url: profileData.github_username ? `https://github.com/${profileData.github_username}/trainer` : 'https://github.com',
        },
      ];

  const projectBullets = [
    "Built a Physics-Informed Neural Network using Jupyter Notebook — Solved fluid-structure interaction problems around airfoils.",
    "Built PrioryxAI using Next.js & TypeScript — Full-stack AI academic and career intelligence platform.",
    "Built a distributed AI model training system using Go — Facilitated LLM fine-tuning on Kubernetes."
  ];

  const totalTasks = tasks?.length ?? 0;
  const completedTasks = (tasks as TaskCompletionRow[] | null)?.filter((task) => task.completed).length ?? 0;

  return NextResponse.json({
    profile: {
      ...profileData,
      github_health_score: githubCache?.health_score ?? (profileData.github_username ? 33 : 0),
      github_streak_days: githubCache?.streak_days ?? 0,
      top_repos: topReposList,
      project_bullets: projectBullets,
      contribution_days: githubCache?.contribution_days ?? [],
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
    },
  });
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

    if (['career_goals', 'target_roles', 'target_companies'].includes(key)) {
      if (!Array.isArray(val) || val.some(s => typeof s !== 'string')) {
        return NextResponse.json({ error: `${key} must be an array of strings.` }, { status: 400 });
      }
      updates[key] = (val as string[]).slice(0, 20).map(s => String(s).slice(0, 120));
      continue;
    }

    if (key === 'available_hours_per_week') {
      if (val === null || val === '' || val === undefined) {
        updates[key] = null;
        continue;
      }
      const n = Number(val);
      if (isNaN(n) || n < 0 || n > 168) {
        return NextResponse.json({ error: 'Available hours must be between 0 and 168.' }, { status: 400 });
      }
      updates[key] = Math.round(n * 4) / 4;
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

  // Invalidate public profile cache
  if (previousUsername && previousUsername !== data?.username) {
    await withFallback(() => redis.del(`profile:${previousUsername}`), 0);
  }
  if (data?.username) {
    await withFallback(() => redis.del(`profile:${data.username}`), 0);
  }

  return NextResponse.json({ profile: data });
}
