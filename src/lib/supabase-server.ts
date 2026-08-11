import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * SERVICE ROLE client — bypasses RLS.
 * Use for all server-side DB writes in API routes.
 * NEVER expose to client.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error('[Supabase] Missing env vars:', {
      url: !!url,
      serviceKey: !!key
    })
    throw new Error('Missing Supabase service role configuration')
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

/**
 * AUTH client — reads user from cookies.
 * Use to verify auth.getUser() in API routes.
 */
export function createAuthClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},    // read-only in middleware
        remove: () => {}
      }
    }
  )
}

/**
 * Get authenticated user from API route request.
 * Returns null if not authenticated.
 */
export async function getAuthUser() {
  try {
    const client = createAuthClient()
    const { data: { user }, error } = await client.auth.getUser()
    if (error) {
      console.error('[Auth] getUser error:', error.message)
      return null
    }
    return user
  } catch (e) {
    console.error('[Auth] getUser threw:', e)
    return null
  }
}
