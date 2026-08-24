import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const ALLOWED_PROVIDERS = ['github', 'google'] as const;
type Provider = typeof ALLOWED_PROVIDERS[number];

function getRequestBaseUrl(request: NextRequest, origin: string) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '');
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const originHost = new URL(origin).hostname;

  if (originHost === 'localhost' || originHost === '127.0.0.1') {
    return origin;
  }

  // Only trust X-Forwarded-Host when it matches the configured app host — this
  // URL feeds the OAuth redirectTo, so an unvalidated forwarded header here
  // would let a spoofed request redirect the OAuth flow to an attacker origin.
  let configuredHost: string | null = null;
  if (configuredAppUrl) {
    try {
      configuredHost = new URL(configuredAppUrl).hostname.toLowerCase();
    } catch {
      configuredHost = null;
    }
  }

  if (forwardedHost && configuredHost && forwardedHost.split(':')[0].toLowerCase() === configuredHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  if (configuredAppUrl?.startsWith('https://')) {
    return configuredAppUrl.replace(/\/$/, '');
  }

  return origin;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const provider = searchParams.get('provider') as Provider | null;
  const popup = searchParams.get('popup') === '1';
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

  const baseUrl = getRequestBaseUrl(request, origin);
  const callbackParams = new URLSearchParams({ next });
  if (popup) {
    callbackParams.set('popup', '1');
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${baseUrl}/api/auth/callback?${callbackParams.toString()}`,
      scopes: provider === 'github' ? 'read:user user:email' : 'openid email profile',
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  return NextResponse.redirect(data.url);
}
