import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_-]{3,39}$/;

export async function POST(request: NextRequest) {
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

  const supabase = createClient();

  // Check username uniqueness
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  const finalUsername = existing ? `${username}${Date.now().toString().slice(-4)}` : username;

  // Sign up via Supabase Auth
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: name || null },
      // Skip email confirmation in dev — set SUPABASE_AUTH_EMAIL_CONFIRM=false in Supabase dashboard
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  });

  if (signUpError) {
    // Supabase returns a generic message for duplicate emails to prevent enumeration,
    // but we surface the real error server-side only.
    console.error('[auth/signup]', signUpError.message);
    if (signUpError.message.toLowerCase().includes('already registered')) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: signUpError.message }, { status: 400 });
  }

  const user = authData.user;
  if (!user) {
    // Email confirmation required — Supabase didn't return a session
    return NextResponse.json(
      { message: 'Check your email to confirm your account, then sign in.' },
      { status: 202 }
    );
  }

  // Insert user row using service role to bypass RLS on first insert
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await serviceClient.from('users').upsert(
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

  // Log auth event
  await serviceClient.from('email_auth_log').insert({
    user_id: user.id,
    event: 'signup',
    ip: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null,
    user_agent: request.headers.get('user-agent') ?? null,
  });

  return NextResponse.json({ redirect: '/onboarding' });
}
