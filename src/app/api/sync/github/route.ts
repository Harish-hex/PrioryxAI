import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncGithubForUser } from '@/lib/github-sync';
import { withFallback, redis } from '@/lib/redis';
import { Receiver } from '@upstash/qstash';

export const maxDuration = 20

export const runtime = 'nodejs';

const GITHUB_SYNC_LOCK_TTL = 300; // 5 min lock — one sync per user per 5min

// Can be called by: authenticated user (session) OR QStash (verified signature + userId in body)
export async function POST(request: NextRequest) {
  const hasQStashSig = request.headers.get('upstash-signature') !== null;

  let userId: string;
  let githubUsername: string;

  if (hasQStashSig) {
    // QStash scheduled call — verify signature before trusting body
    const rawBody = await request.text();
    const sig = request.headers.get('upstash-signature') ?? '';
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
    });
    try {
      await receiver.verify({ signature: sig, body: rawBody });
    } catch {
      return NextResponse.json({ error: 'Invalid QStash signature' }, { status: 401 });
    }
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    userId = body.user_id;
    githubUsername = body.github_username;
    if (!userId || !githubUsername) {
      return NextResponse.json({ error: 'Missing user_id or github_username' }, { status: 400 });
    }
  } else {
    // User-triggered sync
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase
      .from('users')
      .select('github_username')
      .eq('id', user.id)
      .single();

    if (!userData?.github_username) {
      return NextResponse.json({ error: 'No GitHub account connected' }, { status: 400 });
    }
    userId = user.id;
    githubUsername = userData.github_username;
  }

  // Redis lock — one sync per user per 5 min
  const lockKey = `user:sync:${userId}`;
  const locked = await withFallback(
    () => redis.set(lockKey, '1', { ex: GITHUB_SYNC_LOCK_TTL, nx: true }),
    'OK'
  );
  if (locked === null) {
    return NextResponse.json({ message: 'Sync already in progress, try again in 5 min' }, { status: 429 });
  }

  try {
    const result = await syncGithubForUser(userId, githubUsername);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[sync/github]', err);
    return NextResponse.json({ error: 'GitHub sync failed' }, { status: 500 });
  }
}
