import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { authRateLimiter, getClientIp } from '@/lib/rate-limiter';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  // Rate limit signin attempts per IP
  const ip = getClientIp(request);
  try {
    const rl = authRateLimiter.check(`signin:${ip}`);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many signin attempts. Try again in a minute.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
      );
    }
  } catch {}

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const next = typeof body.next === 'string' ? body.next : '/feed';

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ error: 'Password is required' }, { status: 400 });
  }

  // Build a response object so Supabase can write session cookies onto it
  const response = NextResponse.json({ redirect: next });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return NextResponse.json(
      { error: 'Incorrect email or password.' },
      { status: 401 }
    );
  }

  const user = authData.user;

  // Check if user row exists
  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  const isNew = !userRow;

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (isNew) {
    const rawUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 39);
    const username = rawUsername.length >= 3 ? rawUsername : `user${Date.now().toString().slice(-6)}`;

    await serviceSupabase.from('users').upsert(
      {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name ?? null,
        username,
        pro_status: false,
        last_active_at: new Date().toISOString(),
      },
      { onConflict: 'id', ignoreDuplicates: true }
    );
  } else {
    await serviceSupabase
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', user.id);
  }

  // Log auth event
  try {
    await serviceSupabase.from('email_auth_log').insert({
      user_id: user.id,
      event: 'signin',
      ip: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null,
      user_agent: request.headers.get('user-agent') ?? null,
    });
  } catch {} // non-fatal if email_auth_log table doesn't exist yet

  const redirectTo = isNew ? '/onboarding' : next;

  // Rewrite the redirect value into the already-constructed response
  // (cookies are already attached; we just need to update the body)
  return new NextResponse(JSON.stringify({ redirect: redirectTo }), {
    status: 200,
    headers: response.headers,
  });
}
