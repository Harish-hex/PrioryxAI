import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL) console.error('❌ NEXT_PUBLIC_SUPABASE_URL not set')
if (!SUPABASE_ANON_KEY) console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not set')
if (!SUPABASE_SERVICE_KEY) console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set')

/**
 * Service role client - bypasses ALL RLS.
 * Use for server-side DB operations.
 * Does NOT use cookies - safe for any runtime.
 */
export function createServiceRoleClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error(
      'Supabase service role not configured. ' +
      'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.'
    )
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

/**
 * Auth-aware client that reads session from cookies.
 * Use ONLY to verify user identity in API routes.
 */
export function createAuthClient() {
  const cookieStore = cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set() {},    // read-only in API routes
      remove() {},
    },
  })
}

/**
 * Get the authenticated user from the current request.
 * Returns null if not authenticated or if auth fails.
 */
export async function getAuthUser() {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('[Auth] Supabase not configured')
      return null
    }
    const client = createAuthClient()
    const { data: { user }, error } = await client.auth.getUser()
    if (error) {
      console.error('[Auth] getUser error:', error.message)
      return null
    }
    return user
  } catch (e) {
    console.error('[Auth] Unexpected error:', String(e))
    return null
  }
}
