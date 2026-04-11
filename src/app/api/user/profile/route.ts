import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withFallback, redis } from '@/lib/redis';

export const runtime = 'nodejs';

// Fields the user can read about themselves (includes private fields)
const SELF_FIELDS = 'id, name, username, email, avatar_url, github_username, college, semester, subjects, pro_status, pro_expires_at, last_active_at';

// Fields the user is allowed to update
const UPDATABLE_FIELDS = new Set(['name', 'username', 'college', 'semester', 'subjects', 'github_username']);

// Username: alphanumeric + hyphens, 1–39 chars (GitHub convention)
const USERNAME_RE = /^[a-zA-Z0-9-]{1,39}$/;

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('users')
    .select(SELF_FIELDS)
    .eq('id', user.id)
    .single();

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
      const n = Number(val);
      if (!Number.isInteger(n) || n < 1 || n > 12) {
        return NextResponse.json({ error: 'Semester must be an integer between 1 and 12.' }, { status: 400 });
      }
      updates[key] = n;
      continue;
    }

    if (key === 'subjects') {
      if (!Array.isArray(val) || val.some(s => typeof s !== 'string')) {
        return NextResponse.json({ error: 'Subjects must be an array of strings.' }, { status: 400 });
      }
      updates[key] = (val as string[]).slice(0, 10).map(s => String(s).slice(0, 100));
      continue;
    }

    if (typeof val === 'string') {
      updates[key] = val.slice(0, 200);
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
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

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select(SELF_FIELDS)
    .single();

  if (error) {
    console.error('[user/profile PATCH]', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }

  // Invalidate public profile cache
  if (data?.username) {
    await withFallback(() => redis.del(`profile:${data.username}`), 0);
  }

  return NextResponse.json({ profile: data });
}
