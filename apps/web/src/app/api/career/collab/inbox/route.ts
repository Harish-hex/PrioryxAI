import { NextResponse } from 'next/server'
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server'

export const maxDuration = 15
export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceRoleClient()

  // Pending requests received BY this user
  const { data: incoming } = await db
    .from('peer_connections')
    .select('id, status, message, created_at, requester_id')
    .eq('receiver_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Get requester profiles
  const requesterIds = (incoming ?? []).map(c => c.requester_id)
  let requesterProfiles: Record<string, {
    display_name: string
    avatar_initial: string
    connect_code: string
    stream: string
    skills: string[]
  }> = {}

  if (requesterIds.length > 0) {
    const { data: profiles } = await db
      .from('peer_profiles')
      .select('user_id, display_name, avatar_initial, connect_code, stream, skills')
      .in('user_id', requesterIds)

    requesterProfiles = Object.fromEntries(
      (profiles ?? []).map(p => [p.user_id, p])
    )
  }

  const requests = (incoming ?? []).map(conn => ({
    connectionId: conn.id,
    requesterId: conn.requester_id,
    message: conn.message ?? '',
    createdAt: conn.created_at,
    profile: requesterProfiles[conn.requester_id] ?? null
  }))

  // Pending requests SENT by this user
  const { data: outgoing } = await db
    .from('peer_connections')
    .select('id, status, receiver_id, created_at')
    .eq('requester_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const receiverIds = (outgoing ?? []).map(c => c.receiver_id)
  let receiverProfiles: Record<string, { display_name: string; connect_code: string }> = {}

  if (receiverIds.length > 0) {
    const { data: rProfiles } = await db
      .from('peer_profiles')
      .select('user_id, display_name, connect_code')
      .in('user_id', receiverIds)

    receiverProfiles = Object.fromEntries(
      (rProfiles ?? []).map(p => [p.user_id, p])
    )
  }

  const sentRequests = (outgoing ?? []).map(conn => ({
    connectionId: conn.id,
    receiverId: conn.receiver_id,
    createdAt: conn.created_at,
    profile: receiverProfiles[conn.receiver_id] ?? null
  }))

  return NextResponse.json({
    incoming: requests,
    outgoing: sentRequests,
    incomingCount: requests.length
  })
}
