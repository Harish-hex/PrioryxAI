import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const ALLOWED_PROVIDERS = ['github', 'google'] as const;
type Provider = typeof ALLOWED_PROVIDERS[number];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const provider = searchParams.get('provider') as Provider | null;
  let next = searchParams.get('next') ?? '/feed';

  if (!next.startsWith('/')) {
    next = '/feed';
  }

  if (!provider || !ALLOWED_PROVIDERS.includes(provider)) {
    return NextResponse.json(
      { error: `Invalid provider. Must be one of: ${ALLOWED_PROVIDERS.join(', ')}` },
      { status: 400 }
    );
  }

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  const baseUrl =
    process.env.NODE_ENV === 'development' || !forwardedHost
      ? origin
      : `${forwardedProto}://${forwardedHost}`;

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${baseUrl}/api/auth/callback?next=${encodeURIComponent(next)}`,
      scopes: provider === 'github' ? 'read:user user:email' : 'openid email profile',
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  return NextResponse.redirect(data.url);
}
