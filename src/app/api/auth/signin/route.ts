import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
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

  const supabase = createClient();

  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    // Don't reveal whether the email exists — same message for both cases
    return NextResponse.json(
      { error: 'Incorrect email or password.' },
      { status: 401 }
    );
  }

  const user = authData.user;

  // Check if user row exists (first email login after account creation)
  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  const isNew = !userRow;

  if (isNew) {
    // Create the users row if it somehow doesn't exist (e.g. signup had email confirmation)
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const rawUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 39);
    const username = rawUsername.length >= 3 ? rawUsername : `user${Date.now().toString().slice(-6)}`;

    await serviceClient.from('users').upsert(
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
    // Update last_active_at
    await supabase
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', user.id);
  }

  // Log auth event using service role (bypasses RLS on email_auth_log)
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  await serviceClient.from('email_auth_log').insert({
    user_id: user.id,
    event: 'signin',
    ip: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null,
    user_agent: request.headers.get('user-agent') ?? null,
  });

  const redirectTo = isNew ? '/onboarding' : next;
  return NextResponse.json({ redirect: redirectTo });
}
