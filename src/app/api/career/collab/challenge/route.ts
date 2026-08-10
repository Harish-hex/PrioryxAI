import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    opponentId: string;
    challengeType: 'problem' | 'streak' | 'badge';
    target: string;
    deadline?: string | null;
  };

  const { opponentId, challengeType, target, deadline } = body;

  if (!opponentId || !challengeType || !target) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const titleMap: Record<string, string> = {
    problem: `LeetCode Duel: ${target}`,
    streak:  `${target}-Day Streak War`,
    badge:   `Badge Race: ${target}`,
  };

  const { error } = await supabase.from('peer_challenges').insert({
    creator_id: user.id,
    opponent_id: opponentId,
    title: titleMap[challengeType] ?? target,
    challenge_type: challengeType,
    target,
    deadline: deadline || null,
    status: 'pending',
  });

  if (error) {
    console.error('[Challenge] Insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
