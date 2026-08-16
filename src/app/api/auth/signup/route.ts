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

  let user: any = null;

  // Try creating confirmed user via Admin API to bypass email confirmation delays
  const { data: adminData, error: adminError } = await serviceSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: name || null },
  });

  if (adminError) {
    const isAlreadyRegistered =
      adminError.message.toLowerCase().includes('already registered') ||
      adminError.message.toLowerCase().includes('already been registered') ||
      adminError.message.toLowerCase().includes('duplicate') ||
      adminError.message.toLowerCase().includes('exists');

    if (isAlreadyRegistered) {
      // Find existing user in auth.users and update password / confirmation
      try {
        const { data: userList } = await serviceSupabase.auth.admin.listUsers();
        const existingUser = userList?.users?.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase()
        );

        if (existingUser) {
          const { data: updatedUserData, error: updateErr } = await serviceSupabase.auth.admin.updateUserById(
            existingUser.id,
            {
              password,
              email_confirm: true,
              user_metadata: {
                ...(existingUser.user_metadata || {}),
                ...(name ? { name } : {}),
              },
            }
          );
          if (!updateErr && updatedUserData?.user) {
            user = updatedUserData.user;
          } else {
            user = existingUser;
          }
        }
      } catch (err: any) {
        console.error('[auth/signup] Existing user recovery error:', err?.message);
      }
    }

    if (!user) {
      // Fallback to standard signUp if admin API is restricted
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
        // Attempt direct sign in with password in case account exists
        const { data: directSignIn } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (directSignIn?.session) {
          return new NextResponse(JSON.stringify({ redirect: '/feed' }), {
            status: 200,
            headers: response.headers,
          });
        }

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

      user = authData.user;
    }
  } else {
    user = adminData.user;
  }

  if (!user) {
    return NextResponse.json({ error: 'Signup failed. Please try again.' }, { status: 500 });
  }

  // Insert user row into users and profiles tables using service role
  try {
    await serviceSupabase.from('users').upsert(
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
  } catch (err: any) {
    console.error('[auth/signup] users upsert:', err?.message);
  }

  try {
    await serviceSupabase.from('profiles').upsert(
      {
        id: user.id,
        email: user.email!,
        full_name: name || null,
        subscription_status: 'free',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id', ignoreDuplicates: false }
    );
  } catch {}

  // Automatically sign in the user to establish real session cookies
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !signInData.session) {
    // If session could not be established immediately, redirect to login
    return NextResponse.json(
      { message: 'Account created! Please sign in with your password.', redirect: '/login' },
      { status: 200 }
    );
  }

  // Session exists — cookies are written onto `response`
  return new NextResponse(JSON.stringify({ redirect: '/onboarding' }), {
    status: 200,
    headers: response.headers,
  });
}
