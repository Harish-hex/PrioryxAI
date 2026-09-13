import { NextResponse } from 'next/server'
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server'

export const maxDuration = 20
export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceRoleClient()

  // 1. Fetch current user's profile and XP
  let { data: myProfile } = await db
    .from('peer_profiles')
    .select('user_id, display_name, avatar_initial, connect_code, stream, skills, placement_score')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!myProfile) {
    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'User'
    const namePart = displayName.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 3).padEnd(3, 'X')
    const idPart = user.id.replace(/-/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-3).padEnd(3, '0')
    const connectCode = `${namePart}${idPart}`

    const { data: inserted } = await db
      .from('peer_profiles')
      .insert({
        user_id: user.id,
        display_name: displayName,
        avatar_initial: displayName.charAt(0).toUpperCase(),
        connect_code: connectCode,
        stream: user.user_metadata?.stream ?? 'Software Engineering',
        skills: [],
        is_discoverable: true,
        placement_score: 0,
      })
      .select()
      .maybeSingle()

    myProfile = inserted || {
      user_id: user.id,
      display_name: displayName,
      avatar_initial: displayName.charAt(0).toUpperCase(),
      connect_code: connectCode,
      stream: 'Software Engineering',
      skills: [],
      placement_score: 0,
    }
  }

  const { data: myXpData } = await db
    .from('peer_xp')
    .select('total_xp, level, challenges_won, challenges_completed, win_streak')
    .eq('user_id', user.id)
    .maybeSingle()

  const myXp = myXpData || {
    total_xp: 0,
    level: 1,
    challenges_won: 0,
    challenges_completed: 0,
    win_streak: 0,
  }

  // 2. Fetch incoming and outgoing pending requests
  const [{ data: incomingConns }, { data: outgoingConns }, { data: topXp }] = await Promise.all([
    db.from('peer_connections').select('id, requester_id, message, created_at').eq('receiver_id', user.id).eq('status', 'pending'),
    db.from('peer_connections').select('id, receiver_id, created_at').eq('requester_id', user.id).eq('status', 'pending'),
    db.from('peer_xp').select('user_id, total_xp, challenges_won, win_streak').order('total_xp', { ascending: false }).limit(10),
  ])

  const pendingRequesterIds = (incomingConns ?? []).map(c => c.requester_id)
  const pendingReceiverIds = (outgoingConns ?? []).map(c => c.receiver_id)
  const allPendingIds = Array.from(new Set([...pendingRequesterIds, ...pendingReceiverIds]))

  let pendingProfiles: Record<string, any> = {}
  if (allPendingIds.length > 0) {
    const { data: pData } = await db.from('peer_profiles').select('user_id, display_name, connect_code, avatar_initial, stream, skills').in('user_id', allPendingIds)
    pendingProfiles = Object.fromEntries((pData ?? []).map(p => [p.user_id, p]))
  }

  const inbox = (incomingConns ?? []).map(c => ({
    connectionId: c.id,
    requesterId: c.requester_id,
    message: c.message ?? '',
    createdAt: c.created_at,
    profile: pendingProfiles[c.requester_id] ?? null,
  }))

  const outgoing = (outgoingConns ?? []).map(c => ({
    connectionId: c.id,
    receiverId: c.receiver_id,
    createdAt: c.created_at,
    profile: pendingProfiles[c.receiver_id] ?? null,
  }))

  const topXpUserIds = (topXp ?? []).map(x => x.user_id)
  let leaderboardProfiles: Record<string, any> = {}
  if (topXpUserIds.length > 0) {
    const { data: lData } = await db.from('peer_profiles').select('user_id, display_name').in('user_id', topXpUserIds)
    leaderboardProfiles = Object.fromEntries((lData ?? []).map(p => [p.user_id, p.display_name]))
  }

  const leaderboard = (topXp ?? []).map(x => ({
    name: leaderboardProfiles[x.user_id] || (x.user_id === user.id ? myProfile?.display_name || 'You' : 'Anonymous'),
    xp: x.total_xp,
    won: x.challenges_won,
    streak: x.win_streak,
    isMe: x.user_id === user.id,
  }))

  // 3. Get all accepted connections for this user
  const { data: connections } = await db
    .from('peer_connections')
    .select('id, requester_id, receiver_id, accepted_at')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)

  if (!connections?.length) {
    return NextResponse.json({
      myProfile,
      myXp,
      friends: [],
      inbox,
      outgoing,
      leaderboard,
    })
  }

  const friendIds = Array.from(new Set(connections.map(c =>
    c.requester_id === user.id ? c.receiver_id : c.requester_id
  )))

  const [
    profilesResult,
    xpResult,
    challengesResult,
    codingProfilesResult,
    resumesResult,
    githubResult,
    leetcodeResult,
  ] = await Promise.allSettled([
    db.from('peer_profiles')
      .select('user_id, display_name, avatar_initial, connect_code, stream, skills, placement_score')
      .in('user_id', friendIds),
    db.from('peer_xp')
      .select('user_id, total_xp, level, challenges_won, challenges_completed, win_streak')
      .in('user_id', friendIds),
    db.from('peer_challenges')
      .select('id, status, creator_id, opponent_id, challenge_type, title')
      .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`)
      .eq('status', 'in_progress'),
    db.from('user_coding_profiles')
      .select('user_id, platform, username, solved_count, ranking, badge_name')
      .in('user_id', friendIds),
    db.from('user_resumes')
      .select('user_id, parsed_data, skill_entities, created_at')
      .in('user_id', friendIds)
      .order('created_at', { ascending: false }),
    db.from('github_cache')
      .select('user_id, health_score, streak_days')
      .in('user_id', friendIds),
    db.from('leetcode_profiles')
      .select('user_id, leetcode_username, placement_readiness_score, solved_data')
      .in('user_id', friendIds),
  ])

  const profiles = profilesResult.status === 'fulfilled' ? (profilesResult.value.data ?? []) : []
  const xpData = xpResult.status === 'fulfilled' ? (xpResult.value.data ?? []) : []
  const activeChallenges = challengesResult.status === 'fulfilled' ? (challengesResult.value.data ?? []) : []
  const codingProfiles = codingProfilesResult.status === 'fulfilled' ? (codingProfilesResult.value.data ?? []) : []
  const resumes = resumesResult.status === 'fulfilled' ? (resumesResult.value.data ?? []) : []
  const githubProfiles = githubResult.status === 'fulfilled' ? (githubResult.value.data ?? []) : []
  const leetcodeData = leetcodeResult.status === 'fulfilled' ? (leetcodeResult.value.data ?? []) : []

  const xpMap = Object.fromEntries(xpData.map(x => [x.user_id, x]))
  const lcMap = Object.fromEntries(leetcodeData.map(x => [x.user_id, x]))

  const uniqueFriends = new Map()

  connections.forEach(conn => {
    const friendId = conn.requester_id === user.id ? conn.receiver_id : conn.requester_id
    if (uniqueFriends.has(friendId)) return

    const profile = profiles.find(p => p.user_id === friendId) ?? null
    const xp = xpMap[friendId] ?? null
    
    if (profile) {
      const userCodings = codingProfiles.filter(c => c.user_id === friendId)
      const userResume = resumes.find(r => r.user_id === friendId)
      
      let richSkills: string[] = []
      if (userResume) {
        richSkills = (userResume.skill_entities as { skills?: string[] })?.skills ?? (userResume.parsed_data as { skills?: string[] })?.skills ?? []
      }
      
      const lcRow = lcMap[friendId]
      if (lcRow?.leetcode_username && !userCodings.some(c => c.platform === 'leetcode')) {
        userCodings.push({
          user_id: friendId,
          platform: 'leetcode',
          username: lcRow.leetcode_username,
          solved_count:
            (lcRow.solved_data as { solvedProblem?: number } | null)?.solvedProblem ?? 0,
          ranking: '',
          badge_name: '',
        } as (typeof userCodings)[number])
      }

      (profile as any).coding_profiles = userCodings
      if (richSkills.length > 0) {
        profile.skills = richSkills
      }
      
      const userGithub = githubProfiles.find((g: any) => g.user_id === friendId)
      if (userGithub) {
        (profile as any).github = { health_score: userGithub.health_score, streak_days: userGithub.streak_days }
      }
    }
    const activeChallenge = activeChallenges.find(c =>
      c.creator_id === friendId || c.opponent_id === friendId
    ) ?? null

    uniqueFriends.set(friendId, {
      connectionId: conn.id,
      userId: friendId,
      connectedAt: conn.accepted_at,
      profile,
      xp: xp ? {
        totalXp: xp.total_xp,
        level: xp.level,
        challengesWon: xp.challenges_won,
        winStreak: xp.win_streak,
      } : null,
      activeChallenge,
      leetcode: lcMap[friendId] ? {
        username: lcMap[friendId].leetcode_username,
        score: lcMap[friendId].placement_readiness_score ?? 0,
        solved: (lcMap[friendId].solved_data as { solvedProblem?: number } | null)?.solvedProblem ?? 0,
      } : null,
    })
  })

  const friends = Array.from(uniqueFriends.values())

  return NextResponse.json({
    myProfile,
    myXp,
    friends,
    inbox,
    outgoing,
    leaderboard,
  })
}
