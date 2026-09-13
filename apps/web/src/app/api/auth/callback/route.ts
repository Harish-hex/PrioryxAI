import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { syncGithubForUser } from '@/lib/github-sync';
import { resolveTrustedBaseUrl } from '@/lib/auth-redirect';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const providerError = searchParams.get('error');
  const providerErrorDescription = searchParams.get('error_description');
  let next = searchParams.get('next') ?? '/feed';

  if (!next.startsWith('/')) {
    next = '/feed';
  }

  if (providerError || providerErrorDescription) {
    console.error('[auth/callback] Provider returned an error', {
      providerError,
      providerErrorDescription,
    });
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  const isLocalEnv = process.env.NODE_ENV === 'development';
  const baseUrl = isLocalEnv
    ? origin
    : resolveTrustedBaseUrl(forwardedHost, forwardedProto, origin);

  // Prepare a redirect response so Supabase can write session cookies onto it.
  // We keep the final response object and move cookies onto the final destination explicitly.
  const cookieCarrier = NextResponse.next();

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
            cookieCarrier.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
            });
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const provider = user.app_metadata?.provider ?? 'github';
  const meta = user.user_metadata ?? {};
  const githubUsername =
    provider === 'github'
      ? (meta.user_name ?? meta.preferred_username ?? null)
      : null;

  const name = meta.full_name ?? meta.name ?? null;
  const avatarUrl = meta.avatar_url ?? meta.picture ?? null;

  const username =
    githubUsername ??
    (user.email ? user.email.split('@')[0].replace(/[^a-zA-Z0-9-]/g, '') : null);

  const { data: existing } = await supabase
    .from('users')
    .select('id, github_username')
    .eq('id', user.id)
    .single();

  const isNew = !existing;

  await supabase.from('users').upsert(
    {
      id: user.id,
      email: user.email!,
      name,
      username: existing?.id ? undefined : username,
      avatar_url: avatarUrl,
      ...(githubUsername ? { github_username: githubUsername } : {}),
      last_active_at: new Date().toISOString(),
    },
    { onConflict: 'id', ignoreDuplicates: false }
  );

  if (githubUsername) {
    try {
      await syncGithubForUser(user.id, githubUsername);
    } catch (syncError) {
      console.error('[auth/callback] GitHub sync failed:', syncError);
    }
  }

  // New users (OAuth signup) go to onboarding; returning users go to `next`.
  // `next` is also used by the onboarding flow itself: after connecting GitHub during
  // onboarding, we pass next=/onboarding?step=3 so they jump back into the wizard.
  const destination = isNew ? '/onboarding' : next;
  const finalRedirect = NextResponse.redirect(`${baseUrl}${destination}`);

  cookieCarrier.cookies.getAll().forEach((cookie) => {
    finalRedirect.cookies.set(cookie);
  });

  return finalRedirect;
}
