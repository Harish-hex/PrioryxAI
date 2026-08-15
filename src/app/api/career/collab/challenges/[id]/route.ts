import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server'

export const maxDuration = 20
export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    action: 'accept' | 'decline' | 'submit_result'
    resultValue?: string
  }

  const db = createServiceRoleClient()

  const { data: challenge } = await db
    .from('peer_challenges')
    .select('*')
    .eq('id', params.id)
    .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`)
    .single()

  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  }

  const isCreator = challenge.creator_id === user.id
  const opponentId = isCreator ? challenge.opponent_id : challenge.creator_id

  if (body.action === 'accept') {
    await db.from('peer_challenges')
      .update({ status: 'in_progress', accepted_at: new Date().toISOString() })
      .eq('id', params.id)

    const { data: accepterProfile } = await db
      .from('peer_profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .single()

    await db.from('peer_notifications').insert({
      user_id: opponentId,
      type: 'challenge_accepted',
      title: `${accepterProfile?.display_name ?? 'Your opponent'} accepted your challenge!`,
      body: `"${challenge.title}" is now in progress. Good luck!`,
      action_url: '/career/collab/match',
      related_id: params.id,
    })
  } else if (body.action === 'decline') {
    await db.from('peer_challenges')
      .update({ status: 'declined' })
      .eq('id', params.id)
  } else if (body.action === 'submit_result') {
    const updateField = isCreator
      ? { creator_completed: true, creator_value: body.resultValue ?? '' }
      : { opponent_completed: true, opponent_value: body.resultValue ?? '' }

    await db.from('peer_challenges').update(updateField).eq('id', params.id)

    const { data: updated } = await db
      .from('peer_challenges')
      .select('*')
      .eq('id', params.id)
      .single()

    if (updated?.creator_completed && updated?.opponent_completed) {
      // Both have now submitted. This branch is reached by the SECOND
      // submitter — their write is what completed the pair — so the opponent
      // is the one who finished first.
      //
      // The rule is "first to submit wins", which matches how the challenge
      // types are described in the UI ("Fastest wins", "First to earn the
      // badge wins"). The previous code awarded `user.id`, i.e. the *last*
      // submitter, which is the exact opposite of its own comment.
      //
      // Count-based types (solve_count, streak_war) would ideally compare
      // values, but the submitted result is free text and not safely
      // comparable, so both values are recorded below for auditability.
      const winnerId = opponentId
      const loserId = user.id

      const winnerValue = isCreator ? updated.opponent_value : updated.creator_value
      const loserValue = body.resultValue ?? ''

      await db.from('peer_challenges').update({
        status: 'completed',
        winner_id: winnerId,
        completed_at: new Date().toISOString(),
        result_description:
          `Submitted first: "${winnerValue}" — runner-up: "${loserValue}"`,
      }).eq('id', params.id)

      // Award XP to winner
      const { data: winnerXp } = await db.from('peer_xp').select('total_xp, challenges_won, challenges_completed, win_streak, longest_win_streak').eq('user_id', winnerId).single()
      await db.from('peer_xp').upsert({
        user_id: winnerId,
        total_xp: (winnerXp?.total_xp ?? 0) + (updated.xp_reward ?? 50),
        challenges_won: (winnerXp?.challenges_won ?? 0) + 1,
        challenges_completed: (winnerXp?.challenges_completed ?? 0) + 1,
        win_streak: (winnerXp?.win_streak ?? 0) + 1,
        longest_win_streak: Math.max((winnerXp?.longest_win_streak ?? 0), (winnerXp?.win_streak ?? 0) + 1),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      // Update loser stats
      const { data: loserXp } = await db.from('peer_xp').select('challenges_completed').eq('user_id', loserId).single()
      await db.from('peer_xp').upsert({
        user_id: loserId,
        challenges_completed: (loserXp?.challenges_completed ?? 0) + 1,
        win_streak: 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      const { data: winnerProfile } = await db.from('peer_profiles').select('display_name').eq('user_id', winnerId).single()

      await Promise.allSettled([
        db.from('peer_notifications').insert({
          user_id: winnerId,
          type: 'challenge_won',
          title: `You won "${challenge.title}"!`,
          body: `+${updated.xp_reward ?? 50} XP earned`,
          action_url: '/career/collab/match',
          related_id: params.id,
        }),
        db.from('peer_notifications').insert({
          user_id: loserId,
          type: 'challenge_lost',
          title: `${winnerProfile?.display_name ?? 'Your opponent'} won the challenge`,
          body: `Keep practicing — challenge them again!`,
          action_url: '/career/collab/match',
          related_id: params.id,
        }),
      ])
    } else {
      await db.from('peer_notifications').insert({
        user_id: opponentId,
        type: 'challenge_completed',
        title: 'Your opponent submitted their result!',
        body: `Submit yours to complete "${challenge.title}"`,
        action_url: '/career/collab/match',
        related_id: params.id,
      })
    }
  }

  return NextResponse.json({ success: true })
}
