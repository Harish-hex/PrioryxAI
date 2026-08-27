import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'
import { createClient as createServerClientSSR, createServiceClient as createServiceClientSSR } from '@/lib/supabase/server'
import { createTimeoutFetch } from '@/lib/supabase/fetch-with-timeout'
import { cookies } from 'next/headers'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL) console.error('[SUPABASE ERROR] NEXT_PUBLIC_SUPABASE_URL not set')
if (!SUPABASE_ANON_KEY) console.error('[SUPABASE ERROR] NEXT_PUBLIC_SUPABASE_ANON_KEY not set')
if (!SUPABASE_SERVICE_KEY) console.error('[SUPABASE ERROR] SUPABASE_SERVICE_ROLE_KEY not set')

/**
 * Service role client - bypasses ALL RLS.
 * Use for server-side DB operations.
 * Does NOT use cookies - safe for any runtime.
 */
export function createServiceRoleClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error(
      'Supabase service role not configured. ' +
      'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local'
    )
  }
  return createSupabaseJsClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: { fetch: createTimeoutFetch() },
  })
}

/**
 * Auth-aware client that reads session from cookies using modern @supabase/ssr.
 * Use ONLY to verify user identity in API routes.
 */
export function createAuthClient() {
  return createServerClientSSR()
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

    // 1. Primary: Standard SSR cookie client
    const client = createServerClientSSR()
    const { data: { user }, error } = await client.auth.getUser()
    if (user) return user

    if (error) {
      console.warn('[Auth] Primary getUser error:', error.message)
    }

    // 2. Fallback: Parse chunked Supabase auth cookies manually
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()
    const authCookies = allCookies
      .filter((c) => c.name.includes('-auth-token'))
      .sort((a, b) => a.name.localeCompare(b.name))

    if (authCookies.length > 0 && SUPABASE_SERVICE_KEY) {
      try {
        const combined = authCookies.map((c) => c.value).join('')
        const rawVal = combined.startsWith('base64-')
          ? Buffer.from(combined.replace('base64-', ''), 'base64').toString('utf-8')
          : combined
        const parsed = JSON.parse(rawVal)
        const token = parsed?.access_token || (Array.isArray(parsed) ? parsed[0] : null)
        if (token) {
          const service = createServiceRoleClient()
          const { data: { user: jwtUser } } = await service.auth.getUser(token)
          if (jwtUser) return jwtUser
        }
      } catch (cookieErr) {
        console.warn('[Auth] Manual cookie decode fallback failed:', cookieErr)
      }
    }

    return null
  } catch (e) {
    console.error('[Auth] Unexpected error in getAuthUser:', String(e))
    return null
  }
}
