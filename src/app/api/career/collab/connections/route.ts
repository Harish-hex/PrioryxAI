import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const maxDuration = 20

export async function GET(_req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Service role: reads are scoped by the explicit user.id filters below.
    const supabase = createServiceRoleClient()

    // Fetch all connections where user is requester or receiver
    const { data: connections, error } = await supabase
      .from('peer_connections')
      .select(`
        id,
        status,
        message,
        requester_id,
        receiver_id,
        created_at
      `)
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Collab Connections] Error fetching connections:', error)
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 })
    }

    // We need to fetch the peer profiles for these connections
    // Collect all peer user IDs
    const peerIds = new Set<string>()
    connections?.forEach(c => {
      if (c.requester_id !== user.id) peerIds.add(c.requester_id)
      if (c.receiver_id !== user.id) peerIds.add(c.receiver_id)
    })

    const profilesMap: Record<string, any> = {}
    
    if (peerIds.size > 0) {
      const { data: profiles, error: profileErr } = await supabase
        .from('peer_profiles')
        .select('user_id, display_name, avatar_initial, stream, skills, connect_code, placement_score')
        .in('user_id', Array.from(peerIds))

      if (!profileErr && profiles) {
        profiles.forEach(p => {
          profilesMap[p.user_id] = p
        })
      }
    }

    // Categorize connections
    const incoming: any[] = []
    const outgoing: any[] = []
    const accepted: any[] = []

    connections?.forEach(c => {
      const isRequester = c.requester_id === user.id
      const peerId = isRequester ? c.receiver_id : c.requester_id
      const peerProfile = profilesMap[peerId]

      // If peer profile is missing, skip
      if (!peerProfile) return

      const mappedConnection = {
        id: c.id,
        status: c.status,
        message: c.message,
        created_at: c.created_at,
        peer: {
          id: peerProfile.user_id,
          displayName: peerProfile.display_name,
          avatarInitial: peerProfile.avatar_initial,
          stream: peerProfile.stream,
          connectCode: peerProfile.connect_code,
          placementScore: peerProfile.placement_score,
          skills: peerProfile.skills || []
        }
      }

      if (c.status === 'accepted') {
        accepted.push(mappedConnection)
      } else if (c.status === 'pending') {
        if (isRequester) {
          outgoing.push(mappedConnection)
        } else {
          incoming.push(mappedConnection)
        }
      }
    })

    return NextResponse.json({
      incoming,
      outgoing,
      accepted
    })

  } catch (error: any) {
    console.error('[Collab Connections] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
