import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { createTimeoutFetch } from '@/lib/supabase/fetch-with-timeout';

function shouldUseSecureCookies() {
  if (process.env.SUPABASE_COOKIE_SECURE) {
    return process.env.SUPABASE_COOKIE_SECURE === 'true';
  }
  return process.env.NODE_ENV === 'production' && Boolean(process.env.VERCEL);
}

export function createClient() {
  let cookieStore: ReturnType<typeof cookies> | null = null;
  try {
    cookieStore = cookies();
  } catch {
    // Outside of request scope (e.g. background worker, MCP server, testing)
  }

  // Native clients (iOS/Android) have no cookie jar — they authenticate with
  // a plain `Authorization: Bearer <supabase_access_token>` header instead.
  // Cookie-based web sessions are unaffected: this only takes effect when a
  // Bearer header is actually present, and it's forwarded to Supabase's own
  // auth verification (getUser()) rather than trusted directly.
  let bearerToken: string | null = null;
  try {
    const authHeader = headers().get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      bearerToken = authHeader.slice(7).trim();
    }
  } catch {
    // Outside of request scope
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: createTimeoutFetch(),
        ...(bearerToken ? { headers: { Authorization: `Bearer ${bearerToken}` } } : {}),
      },
      cookies: {
        getAll() {
          try {
            return cookieStore ? cookieStore.getAll() : [];
          } catch {
            return [];
          }
        },
        setAll(cookiesToSet) {
          if (!cookieStore) return;
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                httpOnly: true,
                secure: shouldUseSecureCookies(),
                sameSite: 'lax',
              })
            );
          } catch {}
        },
      },
    }
  );
}

// Service role client — bypasses RLS. For administrative and backend agent jobs.
export function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for createServiceClient');
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      global: { fetch: createTimeoutFetch() },
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );
}
