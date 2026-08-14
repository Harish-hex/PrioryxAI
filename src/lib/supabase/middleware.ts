import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired — required for Server Components
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users away from protected routes
  const protectedPaths = ['/feed', '/assistant', '/onboarding', '/settings', '/profile', '/admin', '/career'];
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p));

  if (!user && isProtected) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users away from login page
  if (user && request.nextUrl.pathname === '/login') {
    const feedUrl = request.nextUrl.clone();
    feedUrl.pathname = '/feed';
    return NextResponse.redirect(feedUrl);
  }

  // Admin routes: restrict to allowlisted admin emails only
  const ADMIN_EMAILS = ["yugendhars06@gmail.com"];
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const isAdmin = ADMIN_EMAILS.includes(user?.email?.toLowerCase() ?? "");
    if (!isAdmin) {
      const feedUrl = request.nextUrl.clone();
      feedUrl.pathname = user ? '/feed' : '/login';
      return NextResponse.redirect(feedUrl);
    }
  }

  return supabaseResponse;
}
