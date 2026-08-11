import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  console.log('[Collab Connect] === Request received ===')

  // 1. Auth check
  const authClient = createClient()
  const { data: { user }, error: authErr } = await authClient.auth.getUser()

  if (authErr || !user) {
    console.error('[Collab Connect] Auth failed:', authErr?.message)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[Collab Connect] Current user:', user.id)

  // 2. Parse body
  let body: { code?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }

  const rawCode = body.code?.toString().trim() ?? ''
  const code = rawCode.toUpperCase() // normalize to uppercase

  console.log('[Collab Connect] Looking for code:', code)

  if (!code || code.length < 4) {
    return NextResponse.json(
      { error: 'Invalid connect code. Codes are 6 characters long.' },
      { status: 400 }
    )
  }

  // 3. Use SERVICE ROLE to find the peer (bypasses RLS)
  const db = createServiceClient()

  // DIAGNOSTIC: First check if peer_profiles has ANY rows
  const { count: totalRows } = await db
    .from('peer_profiles')
    .select('*', { count: 'exact', head: true })

  console.log('[Collab Connect] Total peer_profiles rows:', totalRows)

  // 4. Look up the code — try exact match first, then case-insensitive
  let peerProfile = null

  // Try 1: exact match (should work if codes are always uppercase)
  const { data: exactMatch, error: exactErr } = await db
    .from('peer_profiles')
    .select('user_id, display_name, avatar_initial, stream, skills, connect_code, placement_score')
    .eq('connect_code', code)
    .maybeSingle()

  console.log('[Collab Connect] Exact match result:', exactMatch?.user_id ?? 'null')
  console.log('[Collab Connect] Exact match error:', exactErr?.message ?? 'none')

  if (exactMatch) {
    peerProfile = exactMatch
  } else {
    // Try 2: case-insensitive using ilike
    const { data: ilikeMatch, error: ilikeErr } = await db
      .from('peer_profiles')
      .select('user_id, display_name, avatar_initial, stream, skills, connect_code, placement_score')
      .ilike('connect_code', code)
      .maybeSingle()

    console.log('[Collab Connect] ilike match result:', ilikeMatch?.user_id ?? 'null')
    console.log('[Collab Connect] ilike error:', ilikeErr?.message ?? 'none')

    if (ilikeMatch) peerProfile = ilikeMatch
  }

  // 5. Handle not found
  if (!peerProfile) {
    console.log('[Collab Connect] No peer found for code:', code)

    // Debug: show what codes DO exist
    const { data: allCodes } = await db
      .from('peer_profiles')
      .select('connect_code, user_id')
      .limit(10)

    console.log('[Collab Connect] Existing codes in DB:',
      allCodes?.map(r => r.connect_code) ?? [])

    return NextResponse.json(
      {
        error: 'No user found with that connect code. Make sure you\'ve entered all 6 characters correctly.',
        debug_code_searched: code,
        debug_total_profiles: totalRows
      },
      { status: 404 }
    )
  }

  // 6. Prevent self-connection
  if (peerProfile.user_id === user.id) {
    return NextResponse.json(
      { error: 'You cannot connect with yourself.' },
      { status: 400 }
    )
  }

  // 7. Check if already connected
  const { data: existing } = await db
    .from('peer_connections')
    .select('id, status')
    .or(`and(requester_id.eq.${user.id},receiver_id.eq.${peerProfile.user_id}),and(requester_id.eq.${peerProfile.user_id},receiver_id.eq.${user.id})`)
    .maybeSingle()

  if (existing) {
    const statusMsg = existing.status === 'accepted'
      ? 'You are already connected with this peer.'
      : 'A connection request to this peer is already pending.'
    return NextResponse.json({ error: statusMsg }, { status: 409 })
  }

  // 8. Create connection request
  const { data: connection, error: connErr } = await db
    .from('peer_connections')
    .insert({
      requester_id: user.id,
      receiver_id: peerProfile.user_id,
      status: 'pending',
      message: `${user.email?.split('@')[0]} wants to collaborate with you!`
    })
    .select()
    .single()

  if (connErr) {
    console.error('[Collab Connect] Insert error:', connErr)
    return NextResponse.json(
      { error: 'Failed to send connection request. Please try again.' },
      { status: 500 }
    )
  }

  console.log('[Collab Connect] Connection created:', connection.id)

  // 9. Return peer info for UI
  return NextResponse.json({
    success: true,
    message: `Connection request sent to ${peerProfile.display_name}!`,
    peer: {
      displayName: peerProfile.display_name,
      avatarInitial: peerProfile.avatar_initial,
      stream: peerProfile.stream,
      connectCode: peerProfile.connect_code,
      placementScore: peerProfile.placement_score
    },
    connectionId: connection.id
  })
}
