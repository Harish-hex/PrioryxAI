import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server'

export const maxDuration = 15
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { connectionId?: string; action?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { connectionId, action } = body
  if (!connectionId || (action !== 'accept' && action !== 'decline')) {
    return NextResponse.json({ error: 'connectionId and a valid action are required' }, { status: 400 })
  }

  const db = createServiceRoleClient()

  const { data: connection } = await db
    .from('peer_connections')
    .select('id, requester_id, receiver_id, status')
    .eq('id', connectionId)
    .maybeSingle()

  if (!connection) {
    return NextResponse.json({ error: 'Connection request not found' }, { status: 404 })
  }

  if (connection.receiver_id !== user.id) {
    return NextResponse.json({ error: 'You are not the recipient of this request' }, { status: 403 })
  }

  if (connection.status !== 'pending') {
    return NextResponse.json({ error: 'This request has already been responded to' }, { status: 409 })
  }

  const newStatus = action === 'accept' ? 'accepted' : 'declined'

  const { error: updateErr } = await db
    .from('peer_connections')
    .update(
      newStatus === 'accepted'
        ? { status: newStatus, accepted_at: new Date().toISOString() }
        : { status: newStatus }
    )
    .eq('id', connectionId)

  if (updateErr) {
    return NextResponse.json({ error: 'Failed to update connection request' }, { status: 500 })
  }

  if (newStatus === 'accepted') {
    const { data: myProfile } = await db
      .from('peer_profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .maybeSingle()

    await db.from('peer_notifications').insert({
      user_id: connection.requester_id,
      type: 'connection_accepted',
      title: `${myProfile?.display_name ?? 'Someone'} accepted your connection request!`,
      body: 'You are now connected.',
      action_url: '/career/collab/match',
      related_id: connection.id,
    }).then(res => res, () => {})
  }

  return NextResponse.json({ success: true, status: newStatus })
}
