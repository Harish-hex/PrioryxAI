import { NextResponse } from 'next/server';
import { syncGithubForUser } from '@/lib/github-sync';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/feed';

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const provider = user.app_metadata?.provider ?? 'github';

    // Extract provider-specific fields
    const meta = user.user_metadata ?? {};
    const githubUsername =
      provider === 'github'
        ? (meta.user_name ?? meta.preferred_username ?? null)
        : null; // Google users have no GitHub username at signup

    const name = meta.full_name ?? meta.name ?? null;
    const avatarUrl = meta.avatar_url ?? meta.picture ?? null;

    // Generate a username slug for Google users: first part of email
    const username =
      githubUsername ??
      (user.email ? user.email.split('@')[0].replace(/[^a-zA-Z0-9-]/g, '') : null);

    // Check if this is a new user (no row yet)
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
        // Only set username on first insert — don't overwrite if user changed it
        username: existing?.id ? undefined : username,
        avatar_url: avatarUrl,
        // Only set github_username if this is a GitHub login
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

    // New users go to onboarding; returning users go to feed (or next param)
    const redirectTo = isNew ? `${origin}/onboarding` : `${origin}${next}`;
    return NextResponse.redirect(redirectTo);
  }

  return NextResponse.redirect(`${origin}/feed`);
}
