import { NextResponse } from 'next/server'
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server'

export const maxDuration = 15
export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceRoleClient()

  const { data: notifications } = await db
    .from('peer_notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const unreadCount = (notifications ?? []).filter(n => !n.read).length

  return NextResponse.json({ notifications: notifications ?? [], unreadCount })
}

export async function PATCH() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceRoleClient()

  await db
    .from('peer_notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  return NextResponse.json({ success: true })
}
