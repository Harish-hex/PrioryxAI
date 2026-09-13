import { NextResponse } from 'next/server'
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server'

export const maxDuration = 10
export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceRoleClient()

  const { data: xp } = await db
    .from('peer_xp')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!xp) {
    // Initialize XP row
    const { data: newXp } = await db
      .from('peer_xp')
      .upsert({ user_id: user.id, total_xp: 0, level: 1 }, { onConflict: 'user_id' })
      .select()
      .single()
    return NextResponse.json(newXp ?? { total_xp: 0, level: 1, challenges_won: 0, challenges_completed: 0, win_streak: 0 })
  }

  return NextResponse.json(xp)
}
