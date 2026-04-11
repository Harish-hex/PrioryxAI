import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withFallback, redis } from '@/lib/redis';
import { ensureSchemaMigrations, errorMentionsColumn } from '@/lib/schema-migrations';

export const runtime = 'nodejs';

// Fields the user can read about themselves (includes private fields)
const SELF_FIELDS = 'id, name, username, email, avatar_url, github_username, college, semester, subjects, cgpa, pro_status, pro_expires_at, last_active_at';

// Fields the user is allowed to update
const UPDATABLE_FIELDS = new Set(['name', 'username', 'college', 'semester', 'subjects', 'github_username', 'cgpa']);

// Username: alphanumeric + hyphens, 1–39 chars (GitHub convention)
const USERNAME_RE = /^[a-zA-Z0-9-]{1,39}$/;

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let { data, error } = await supabase
    .from('users')
    .select(SELF_FIELDS)
    .eq('id', user.id)
    .single();

  if (errorMentionsColumn(error, 'cgpa')) {
    try {
      await ensureSchemaMigrations();
      ({ data, error } = await supabase.from('users').select(SELF_FIELDS).eq('id', user.id).single());
    } catch {
      const safeFields = SELF_FIELDS.replace(/, cgpa/, '');
      ({ data, error } = await supabase.from('users').select(safeFields).eq('id', user.id).single());
    }
  }

  if (error || !data) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ profile: data });
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
      const n = Number(val);
      if (val === null || val === '' || val === undefined) {
        updates[key] = null;
        continue;
      }
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

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
  }

  const requestedCgpaUpdate = Object.prototype.hasOwnProperty.call(updates, 'cgpa');
  let previousUsername: string | null = null;

  if (updates.username) {
    const { data: currentUser } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .single();

    previousUsername = currentUser?.username ?? null;
  }

  // Check username uniqueness if being changed
  if (updates.username) {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', updates.username)
      .neq('id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Username already taken.' }, { status: 409 });
    }
  }

  updates.last_active_at = new Date().toISOString();

  let { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select(SELF_FIELDS)
    .single();

  if (errorMentionsColumn(error, 'cgpa')) {
    try {
      await ensureSchemaMigrations();
      ({ data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select(SELF_FIELDS)
        .single());
    } catch (migrationError) {
      console.warn('[user/profile PATCH] auto-migration failed', migrationError);
    }
  }

  if (errorMentionsColumn(error, 'cgpa') && requestedCgpaUpdate) {
    return NextResponse.json(
      { error: 'CGPA could not be saved because the profile schema is still updating. Please retry once.' },
      { status: 503 }
    );
  }

  if (errorMentionsColumn(error, 'cgpa')) {
    const safeFields = SELF_FIELDS.replace(/, cgpa/, '');
    const safeUpdates = { ...updates };
    delete safeUpdates.cgpa;
    ({ data, error } = await supabase
      .from('users')
      .update(safeUpdates)
      .eq('id', user.id)
      .select(safeFields)
      .single());
  }

  if (error) {
    console.error('[user/profile PATCH]', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
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
