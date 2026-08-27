import { NextResponse } from 'next/server'
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server'

export const maxDuration = 20
export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceRoleClient()

  // Get current user's profile for matching
  const { data: myProfile } = await db
    .from('peer_profiles')
    .select('stream, skills, placement_score, target_companies')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!myProfile) {
    // Without a peer profile there's no basis for a match score — tell the UI
    // to prompt profile completion instead of silently showing all-zero matches.
    return NextResponse.json({ peers: [], profileIncomplete: true })
  }

  // Find other discoverable users (not self) — fetch a wider pool before scoring
  // so the top-10 returned are actually the best matches, not just the first 20 rows.
  const { data: candidates } = await db
    .from('peer_profiles')
    .select('user_id, display_name, avatar_initial, connect_code, stream, skills, placement_score')
    .eq('is_discoverable', true)
    .neq('user_id', user.id)
    .limit(100)

  if (!candidates?.length) {
    return NextResponse.json({ peers: [], profileIncomplete: false })
  }

  // Matching score, normalized to a true 0-100 percentage of the maximum
  // achievable score under this weighting:
  //   complementary skills — up to 5 skills counted, 5 pts each = 25 max
  //   same stream          — 15 max
  //   similar placement score — 20 max
  const MAX_COMPLEMENTARY_SKILLS = 5
  const COMPLEMENTARY_WEIGHT = 5
  const STREAM_BONUS = 15
  const SCORE_PROXIMITY_MAX = 20
  const MAX_POSSIBLE_SCORE =
    MAX_COMPLEMENTARY_SKILLS * COMPLEMENTARY_WEIGHT + STREAM_BONUS + SCORE_PROXIMITY_MAX

  const mySkills = (myProfile.skills ?? []).map((s: string) => s.toLowerCase())

  const scored = candidates.map(peer => {
    let score = 0
    const peerSkills = (peer.skills ?? []).map((s: string) => s.toLowerCase())

    // Complementary skills bonus (capped so a peer with a huge skills list
    // can't trivially blow past what the 0-100 scale implies)
    const complementary = peerSkills.filter((s: string) => !mySkills.includes(s))
    score += Math.min(complementary.length, MAX_COMPLEMENTARY_SKILLS) * COMPLEMENTARY_WEIGHT

    // Same stream bonus
    if (peer.stream === myProfile.stream) score += STREAM_BONUS

    // Similar score range bonus
    const scoreDiff = Math.abs((peer.placement_score || 0) - (myProfile.placement_score ?? 0))
    score += Math.max(0, SCORE_PROXIMITY_MAX - scoreDiff)

    const matchScore = Math.round(Math.min(100, (score / MAX_POSSIBLE_SCORE) * 100))
    return { ...peer, matchScore }
  })

  scored.sort((a, b) => b.matchScore - a.matchScore)

  return NextResponse.json({ peers: scored.slice(0, 10), profileIncomplete: false })
}
