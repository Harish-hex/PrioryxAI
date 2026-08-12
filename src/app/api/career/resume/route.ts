import { NextResponse } from 'next/server'
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server'

export const maxDuration = 20

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Was reading `career_resumes` — a table nothing else in the codebase writes
  // to. Every other call site (20+) uses `user_resumes`, including the upload
  // route, so saves succeeded while this read always came back empty.
  // `.single()` also errors on zero rows; `.maybeSingle()` returns null.
  const { data, error } = await createServiceRoleClient()
    .from('user_resumes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[Resume GET] Query failed:', error.message, error.code)
    return NextResponse.json({ error: 'Could not load resume' }, { status: 500 })
  }

  return NextResponse.json({ data: data || null })
}
