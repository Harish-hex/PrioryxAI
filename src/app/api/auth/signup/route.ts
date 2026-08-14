import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { authRateLimiter, getClientIp } from '@/lib/rate-limiter';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_-]{3,39}$/;

export async function POST(request: NextRequest) {
  // Rate limit signups per IP
  const ip = getClientIp(request);
  try {
    const rl = authRateLimiter.check(`signup:${ip}`);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Try again in a minute.' },
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
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : '';

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  // Derive username from email prefix, sanitised
  const rawUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 39);
  const username = rawUsername.length >= 3 ? rawUsername : `user${Date.now().toString().slice(-6)}`;

  if (!USERNAME_RE.test(username)) {
    return NextResponse.json({ error: 'Could not derive a valid username from this email' }, { status: 400 });
  }

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check username uniqueness via service role (bypasses RLS)
  const { data: existing } = await serviceSupabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  const finalUsername = existing ? `${username}${Date.now().toString().slice(-4)}` : username;

  // Build response so Supabase SSR client can write session cookies onto it
  const response = NextResponse.json({ redirect: '/onboarding' });

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

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: name || null },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  });

  if (signUpError) {
    console.error('[auth/signup]', signUpError.message);
    if (
      signUpError.message.toLowerCase().includes('already registered') ||
      signUpError.message.toLowerCase().includes('already been registered')
    ) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: signUpError.message }, { status: 400 });
  }

  const user = authData.user;

  if (!user) {
    // Should not happen, but guard anyway
    return NextResponse.json({ error: 'Signup failed. Please try again.' }, { status: 500 });
  }

  // Insert user row using service role to bypass RLS on first insert
  const { error: upsertError } = await serviceSupabase.from('users').upsert(
    {
      id: user.id,
      email: user.email!,
      name: name || null,
      username: finalUsername,
      pro_status: false,
      last_active_at: new Date().toISOString(),
    },
    { onConflict: 'id', ignoreDuplicates: false }
  );

  if (upsertError) {
    console.error('[auth/signup] users upsert failed:', upsertError.message);
  }

  // Log auth event (non-fatal — table may not exist yet)
  try {
    await serviceSupabase.from('email_auth_log').insert({
      user_id: user.id,
      event: 'signup',
      ip: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null,
      user_agent: request.headers.get('user-agent') ?? null,
    });
  } catch {}

  // If no session was created (email confirmation required), tell the user
  if (!authData.session) {
    return NextResponse.json(
      { message: 'Check your email to confirm your account, then sign in.' },
      { status: 202 }
    );
  }

  // Session exists — cookies are already set on `response`, return it with correct body
  return new NextResponse(JSON.stringify({ redirect: '/onboarding' }), {
    status: 200,
    headers: response.headers,
  });
}
