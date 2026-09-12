import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_HEADER_NAMES, signUserId, signPayload, verifyPayload } from '@/lib/auth-header';
import { createTimeoutFetch } from '@/lib/supabase/fetch-with-timeout';

// How long a real getUser() revalidation is trusted for, keyed to the exact
// access-token hash it was performed on. Bounds the network round-trip to at
// most once per this window per session instead of once per navigation, while
// keeping the revocation/deletion window this small (unlike getSession(),
// which never re-checks with Supabase at all).
const VERIFIED_CACHE_TTL_MS = 45_000;
const VERIFIED_COOKIE_NAME = 'sb-verified-cache';

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function shouldUseSecureCookies(request: NextRequest) {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  return forwardedProto === 'https' || request.nextUrl.protocol === 'https:';
}

// Only trust a forwarded/host header for building redirect URLs when it matches
// a known-good host. Otherwise a spoofed Host or X-Forwarded-Host header could
// steer authenticated/unauthenticated redirects to an attacker-chosen origin.
function isTrustedHost(host: string): boolean {
  const hostname = host.split(':')[0].toLowerCase();
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;

  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (configuredAppUrl) {
    try {
      if (hostname === new URL(configuredAppUrl).hostname.toLowerCase()) return true;
    } catch {
      // Malformed NEXT_PUBLIC_APP_URL — ignore and fall through to untrusted.
    }
  }

  return false;
}

function getRequestOrigin(request: NextRequest) {
  try {
    const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
    const host = forwardedHost || request.headers.get('host');

    if (!host || !isTrustedHost(host)) {
      return request.nextUrl.origin;
    }

    const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
    const protocol = forwardedProto || request.nextUrl.protocol.replace(':', '');
    return `${protocol}://${host}`;
  } catch {
    // A malformed header should never take down the whole request.
    return request.nextUrl.origin;
  }
}

function redirectToPath(request: NextRequest, pathname: string) {
  const url = new URL(pathname, getRequestOrigin(request));
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  const secureCookie = shouldUseSecureCookies(request);

  // Auth cookies Supabase wants written on the response, collected here
  // instead of building a NextResponse per setAll() call — we need to set a
  // request header (for requireAppUser, see below) AFTER getUser() resolves,
  // and rebuilding NextResponse.next({ request }) at that point would silently
  // drop any response cookies attached to an earlier NextResponse instance.
  // Collecting writes and applying them once, to one final response, avoids that.
  let pendingCookies: { name: string; value: string; options?: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Without this, a stalled connection to Supabase's Auth server hangs
      // this getUser() call indefinitely — and since this runs on EVERY
      // navigation to a protected route, that stalls every single page load
      // app-wide, not just one route. Bound it so a network hiccup fails
      // fast instead of hanging the whole site.
      global: { fetch: createTimeoutFetch() },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          pendingCookies = cookiesToSet;
        },
      },
    }
  );

  // getUser() re-validates the token against Supabase's Auth server on every
  // call — doing that on EVERY navigation to EVERY protected route (feed,
  // career/*, learning, ...) was what caused multi-second (up to the 15s
  // timeout) delays on every sidebar click. getSession() alone would fix the
  // latency but never re-checks revocation/deletion with Supabase at all, so
  // instead: decode the local session (no network) to get the access token,
  // and only pay for a real getUser() network round-trip once per
  // VERIFIED_CACHE_TTL_MS per exact token — cached in a signed, tamper-proof
  // cookie so a client can never forge or extend its own verified window.
  type AuthUser = NonNullable<Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user']>;
  let user: AuthUser | null = null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (accessToken) {
      const tokenHash = await sha256Hex(accessToken);
      const cached = request.cookies.get(VERIFIED_COOKIE_NAME)?.value;
      let trustedCache = false;

      if (cached) {
        const [payloadB64, sig] = cached.split('.');
        if (payloadB64 && sig && (await verifyPayload(payloadB64, sig))) {
          try {
            const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))) as {
              tokenHash: string; verifiedAt: number; id: string; email: string | null;
            };
            if (payload.tokenHash === tokenHash && Date.now() - payload.verifiedAt < VERIFIED_CACHE_TTL_MS) {
              user = { id: payload.id, email: payload.email } as AuthUser;
              trustedCache = true;
            }
          } catch {
            // Malformed/tampered cache payload — fall through to a real check.
          }
        }
      }

      if (!trustedCache) {
        const result = await supabase.auth.getUser();
        user = result.data.user;
        if (user) {
          const payload = { tokenHash, verifiedAt: Date.now(), id: user.id, email: user.email ?? null };
          const payloadB64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
          const sig = await signPayload(payloadB64);
          if (sig) {
            pendingCookies.push({
              name: VERIFIED_COOKIE_NAME,
              value: `${payloadB64}.${sig}`,
              options: { maxAge: VERIFIED_CACHE_TTL_MS / 1000 },
            });
          }
        }
      }
    } else {
      // No local session at all — nothing to verify; fall through as anonymous.
      user = null;
    }
  } catch (err) {
    console.warn('[middleware] auth check failed:', err);
  }

  // Forward the already-verified user id to Server Components via a signed
  // request header, so page-level code (see requireAppUser in app-user.ts)
  // doesn't have to call getUser() a second time — that was a full extra
  // Supabase Auth round trip on every single page navigation. The header is
  // HMAC-signed (src/lib/auth-header.ts) so it can't be forged by a client
  // request that never went through this getUser() check — an unsigned id
  // would be trivially spoofable (`x-user-id: <victim-id>`). Always strip any
  // inbound copies of these headers first, whether or not `user` resolved, so
  // a request can never smuggle its own id/signature past this point.
  request.headers.delete(AUTH_HEADER_NAMES.id);
  request.headers.delete(AUTH_HEADER_NAMES.sig);
  if (user) {
    const sig = await signUserId(user.id);
    if (sig) {
      request.headers.set(AUTH_HEADER_NAMES.id, user.id);
      request.headers.set(AUTH_HEADER_NAMES.sig, sig);
    }
  }

  // Build the response once, now that `request` carries its final headers,
  // then replay any cookie writes Supabase queued during getUser() onto it.
  let supabaseResponse = NextResponse.next({ request });
  pendingCookies.forEach(({ name, value, options }) =>
    supabaseResponse.cookies.set(name, value, {
      ...options,
      httpOnly: true,
      secure: secureCookie,
      sameSite: 'lax',
    })
  );

  // Redirect unauthenticated users away from protected routes
  const protectedPaths = ['/feed', '/assistant', '/onboarding', '/settings', '/profile', '/admin', '/career', '/learning'];
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p));

  if (!user && isProtected) {
    const loginUrl = new URL('/login', getRequestOrigin(request));
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users away from login page
  if (user && request.nextUrl.pathname === '/login') {
    return redirectToPath(request, '/feed');
  }

  // Admin routes: restrict to allowlisted admin emails only
  const ADMIN_EMAILS = Array.from(
    new Set(
      (process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase()) : []).concat([
        'yugendhars06@gmail.com',
      ])
    )
  );
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const isAdmin = ADMIN_EMAILS.includes(user?.email?.toLowerCase() ?? "");
    if (!isAdmin) {
      return redirectToPath(request, user ? '/feed' : '/login');
    }
  }

  return supabaseResponse;
}
