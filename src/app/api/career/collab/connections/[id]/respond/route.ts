import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server'

export const maxDuration = 15
export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action } = await req.json() as { action: 'accept' | 'decline' }
  if (!['accept', 'decline'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const db = createServiceRoleClient()

  // Verify this user is the receiver
  const { data: conn } = await db
    .from('peer_connections')
    .select('id, requester_id, receiver_id, status')
    .eq('id', params.id)
    .eq('receiver_id', user.id)
    .eq('status', 'pending')
    .single()

  if (!conn) {
    return NextResponse.json({ error: 'Connection request not found' }, { status: 404 })
  }

  const newStatus = action === 'accept' ? 'accepted' : 'declined'

  await db
    .from('peer_connections')
    .update({
      status: newStatus,
      accepted_at: action === 'accept' ? new Date().toISOString() : null
    })
    .eq('id', params.id)

  if (action === 'accept') {
    // Initialize XP for both users
    await Promise.allSettled([
      db.from('peer_xp').upsert(
        { user_id: user.id, total_xp: 0 },
        { onConflict: 'user_id', ignoreDuplicates: true }
      ),
      db.from('peer_xp').upsert(
        { user_id: conn.requester_id, total_xp: 0 },
        { onConflict: 'user_id', ignoreDuplicates: true }
      ),
    ])

    const { data: receiverProfile } = await db
      .from('peer_profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .single()

    await db.from('peer_notifications').insert({
      user_id: conn.requester_id,
      type: 'connection_accepted',
      title: `${receiverProfile?.display_name ?? 'Someone'} accepted your connection!`,
      body: 'You can now challenge each other and collaborate.',
      action_url: '/career/collab/match',
      related_id: params.id
    })
  }

  return NextResponse.json({ success: true, status: newStatus })
}
