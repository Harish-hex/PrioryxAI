import { NextResponse } from 'next/server'
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server'
import { withFallback, redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'
export const maxDuration = 20

const RESUME_SAVED_CACHE_TTL = 120 // seconds

export async function GET() {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cacheKey = `career-resume-saved:${user.id}`
  const cached = await withFallback(() => redis.get(cacheKey), null)
  if (cached) {
    return NextResponse.json(cached)
  }

  const db = createServiceRoleClient()

  const { data, error } = await db
    .from('user_resumes')
    .select(`
      id,
      user_id,
      parsed_data,
      skill_entities,
      swot,
      extraction_method,
      updated_at,
      created_at
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[Resume Saved GET] DB error:', error)
    return NextResponse.json({ resume: null })
  }

  if (!data) {
    return NextResponse.json({ resume: null })
  }

  console.log('[Resume Saved GET] Found resume for user:', user.id,
    '| skills:', (data.skill_entities as { skills?: string[] })?.skills?.length ?? 0)

  const responseBody = { resume: data }
  await withFallback(() => redis.set(cacheKey, responseBody, { ex: RESUME_SAVED_CACHE_TTL }), undefined)
  return NextResponse.json(responseBody)
}
