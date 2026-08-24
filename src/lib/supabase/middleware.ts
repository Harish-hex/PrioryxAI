import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

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
  let supabaseResponse = NextResponse.next({ request });
  const secureCookie = shouldUseSecureCookies(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: secureCookie,
              sameSite: 'lax',
            })
          );
        },
      },
    }
  );

  // Refresh session if expired — required for Server Components
  const { data: { user } } = await supabase.auth.getUser();

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
