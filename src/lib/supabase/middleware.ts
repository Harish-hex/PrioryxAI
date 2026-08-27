import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_HEADER_NAMES, signUserId } from '@/lib/auth-header';
import { createTimeoutFetch } from '@/lib/supabase/fetch-with-timeout';

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

  // Refresh session if expired — required for Server Components. A timed-out
  // or network-failed check must fail closed (treat as unauthenticated) but
  // must NOT throw and crash the whole request — every protected navigation
  // goes through here, so an unhandled rejection here would 500 the entire
  // site on a transient network blip instead of just prompting a re-login.
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (err) {
    console.warn('[middleware] auth.getUser() failed:', err);
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
