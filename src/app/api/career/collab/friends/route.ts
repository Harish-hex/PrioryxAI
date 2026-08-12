import { NextResponse } from 'next/server'
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server'

export const maxDuration = 20
export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceRoleClient()

  // Get all accepted connections for this user
  const { data: connections } = await db
    .from('peer_connections')
    .select('id, requester_id, receiver_id, accepted_at')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)

  if (!connections?.length) {
    return NextResponse.json({ friends: [] })
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
    // Direct LeetCode read so friend cards can show solved count and
    // readiness score without depending on user_coding_profiles being synced.
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

  // Deduplicate connections manually so we only map each friend once
  const uniqueFriends = new Map()

  connections.forEach(conn => {
    const friendId = conn.requester_id === user.id ? conn.receiver_id : conn.requester_id
    if (uniqueFriends.has(friendId)) return

    const profile = profiles.find(p => p.user_id === friendId) ?? null
    const xp = xpMap[friendId] ?? null
    
    // Attach rich data
    if (profile) {
      const userCodings = codingProfiles.filter(c => c.user_id === friendId)
      const userResume = resumes.find(r => r.user_id === friendId) // first one is newest
      
      let richSkills: string[] = []
      if (userResume) {
        richSkills = (userResume.skill_entities as { skills?: string[] })?.skills ?? (userResume.parsed_data as { skills?: string[] })?.skills ?? []
      }
      
      // user_coding_profiles is a secondary mirror and can lag behind
      // leetcode_profiles (the source of truth written by /leetcode/connect).
      // Synthesize an entry from it when the mirror has no LeetCode row, so
      // friend cards show stats instead of appearing empty.
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

  return NextResponse.json({ friends })
}
