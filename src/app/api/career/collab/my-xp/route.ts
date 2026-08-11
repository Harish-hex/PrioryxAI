import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const authClient = createClient()
  const { data: { user }, error: authErr } = await authClient.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

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
