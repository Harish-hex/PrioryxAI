import { NextResponse } from 'next/server'
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server'
import { redis } from '@/lib/redis'

export const maxDuration = 15
export const dynamic = 'force-dynamic'

// Generate deterministic 6-char code from user ID
function generateConnectCode(userId: string, displayName: string): string {
  // Use first 3 chars of name + last 3 chars of userId segment
  const namePart = displayName
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, 'X')

  // Take last 6 chars of UUID and uppercase alphanumeric
  const idPart = userId
    .replace(/-/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(-3)
    .padEnd(3, '0')

  return `${namePart}${idPart}`
}

// Ensure uniqueness — append number if collision
async function getUniqueCode(
  db: ReturnType<typeof createServiceRoleClient>,
  userId: string,
  baseName: string
): Promise<string> {
  const baseCode = generateConnectCode(userId, baseName)

  // Check if this code is taken by another user
  const { data: existing } = await db
    .from('peer_profiles')
    .select('user_id')
    .eq('connect_code', baseCode)
    .neq('user_id', userId)
    .maybeSingle()

  if (!existing) return baseCode

  // Collision — append random chars
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const suffix = Array.from({ length: 2 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')

  return `${baseCode.slice(0, 4)}${suffix}`
}

export async function POST() {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cacheKey = `peer-profile:${user.id}`
  try {
    const cached = await redis.get(cacheKey)
    if (cached) {
      return NextResponse.json({ created: false, profile: cached })
    }
  } catch {}

  const db = createServiceRoleClient()

  // Check if profile already exists
  const { data: existing } = await db
    .from('peer_profiles')
    .select('user_id, connect_code, display_name')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    console.log('[EnsureProfile] Profile already exists:', existing.connect_code)
    try { await redis.set(cacheKey, existing, { ex: 300 }) } catch {}
    return NextResponse.json({
      created: false,
      profile: existing
    })
  }

  // Get display name from auth.users metadata (profiles table does not exist)
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User'

  const avatarInitial = displayName.charAt(0).toUpperCase()

  // Generate unique connect code
  const connectCode = await getUniqueCode(db, user.id, displayName)

  console.log('[EnsureProfile] Creating new profile for:', user.id)
  console.log('[EnsureProfile] Display name:', displayName)
  console.log('[EnsureProfile] Connect code:', connectCode)

  // Parse skills from user metadata if available
  const rawSubjects = user.user_metadata?.subjects ?? ''
  const skills = typeof rawSubjects === 'string'
    ? rawSubjects.split(',').map((s: string) => s.trim()).filter(Boolean)
    : Array.isArray(rawSubjects) ? rawSubjects : []

  // Create the peer profile
  const { data: newProfile, error: insertErr } = await db
    .from('peer_profiles')
    .insert({
      user_id: user.id,
      display_name: displayName,
      avatar_initial: avatarInitial,
      connect_code: connectCode,
      stream: user.user_metadata?.stream ?? 'Software Engineering',
      skills: skills,
      is_discoverable: true,
      placement_score: 0,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (insertErr) {
    console.error('[EnsureProfile] Insert error:', insertErr)

    // If it's a unique violation, the profile was created in a race condition
    if (insertErr.code === '23505') {
      const { data: raceWinner } = await db
        .from('peer_profiles')
        .select('user_id, connect_code, display_name')
        .eq('user_id', user.id)
        .single()

      return NextResponse.json({ created: false, profile: raceWinner })
    }

    return NextResponse.json(
      { error: insertErr.message },
      { status: 500 }
    )
  }

  console.log('[EnsureProfile] Created profile with code:', newProfile.connect_code)
  try { await redis.set(cacheKey, newProfile, { ex: 300 }) } catch {}

  return NextResponse.json({
    created: true,
    profile: newProfile
  })
}
