import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server'

export const maxDuration = 20
export const dynamic = 'force-dynamic'

const XP_REWARDS: Record<string, number> = {
  leetcode_duel: 100,
  streak_war: 150,
  badge_race: 120,
  solve_count: 80,
  project_phase: 200,
}

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceRoleClient()

  const { data: challenges } = await db
    .from('peer_challenges')
    .select('*')
    .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(100)

  // Get peer profiles for challenge participants
  const peerIds = new Set<string>()
  challenges?.forEach(c => {
    if (c.creator_id !== user.id) peerIds.add(c.creator_id)
    if (c.opponent_id !== user.id) peerIds.add(c.opponent_id)
  })

  let profilesMap: Record<string, { display_name: string; avatar_initial: string }> = {}
  if (peerIds.size > 0) {
    const { data: profiles } = await db
      .from('peer_profiles')
      .select('user_id, display_name, avatar_initial')
      .in('user_id', Array.from(peerIds))
    profilesMap = Object.fromEntries((profiles ?? []).map(p => [p.user_id, p]))
  }

  const enriched = (challenges ?? []).map(c => {
    const peerId = c.creator_id === user.id ? c.opponent_id : c.creator_id
    return { ...c, peerProfile: profilesMap[peerId] ?? null, isCreator: c.creator_id === user.id }
  })

  return NextResponse.json({ challenges: enriched })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    opponentId: string
    challengeType: string
    targetValue: string
    deadline: string
    title: string
    description?: string
    stake?: string
  }

  const db = createServiceRoleClient()

  // Verify they are connected friends
  const { data: conn } = await db
    .from('peer_connections')
    .select('id')
    .eq('status', 'accepted')
    .or(
      `and(requester_id.eq.${user.id},receiver_id.eq.${body.opponentId}),` +
      `and(requester_id.eq.${body.opponentId},receiver_id.eq.${user.id})`
    )
    .maybeSingle()

  if (!conn) {
    return NextResponse.json(
      { error: 'You can only challenge connected friends.' },
      { status: 403 }
    )
  }

  const { data: challenge, error } = await db
    .from('peer_challenges')
    .insert({
      creator_id: user.id,
      opponent_id: body.opponentId,
      title: body.title,
      description: body.description ?? '',
      challenge_type: body.challengeType,
      target_value: body.targetValue,
      deadline: body.deadline,
      stake: body.stake ?? 'Bragging rights',
      xp_reward: XP_REWARDS[body.challengeType] ?? 50,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: creatorProfile } = await db
    .from('peer_profiles')
    .select('display_name')
    .eq('user_id', user.id)
    .single()

  await db.from('peer_notifications').insert({
    user_id: body.opponentId,
    type: 'challenge_received',
    title: `${creatorProfile?.display_name ?? 'A peer'} challenged you!`,
    body: `Challenge: ${body.title}`,
    action_url: '/career/collab/match',
    related_id: challenge.id,
  })

  return NextResponse.json({ success: true, challenge })
}
