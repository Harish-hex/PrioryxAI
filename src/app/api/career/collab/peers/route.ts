import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const authClient = createClient()

  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  // Get current user's profile for matching
  const { data: myProfile } = await db
    .from('peer_profiles')
    .select('stream, skills, placement_score, target_companies')
    .eq('user_id', user.id)
    .maybeSingle()

  // Find other discoverable users (not self)
  const { data: candidates } = await db
    .from('peer_profiles')
    .select('user_id, display_name, avatar_initial, connect_code, stream, skills, placement_score')
    .eq('is_discoverable', true)
    .neq('user_id', user.id)
    .limit(20)

  if (!candidates?.length) {
    return NextResponse.json({ peers: [] })
  }

  // Simple matching score
  const scored = candidates.map(peer => {
    let score = 0
    if (myProfile) {
      const mySkills = (myProfile.skills ?? []).map((s: string) => s.toLowerCase())
      const peerSkills = (peer.skills ?? []).map((s: string) => s.toLowerCase())

      // Complementary skills bonus
      const complementary = peerSkills.filter((s: string) => !mySkills.includes(s))
      score += complementary.length * 5

      // Same stream bonus
      if (peer.stream === myProfile.stream) score += 15

      // Similar score range bonus
      const scoreDiff = Math.abs((peer.placement_score || 0) - (myProfile.placement_score ?? 0))
      score += Math.max(0, 20 - scoreDiff)
    }
    return { ...peer, matchScore: Math.min(score, 100) }
  })

  scored.sort((a, b) => b.matchScore - a.matchScore)

  return NextResponse.json({ peers: scored.slice(0, 10) })
}
