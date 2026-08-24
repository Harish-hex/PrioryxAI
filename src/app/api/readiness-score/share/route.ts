import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { redis, withFallback } from '@/lib/redis';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json().catch(() => ({}));
    const platform = typeof body?.platform === 'string' ? body.platform.slice(0, 30) : 'direct';

    // Track in Redis (lightweight event logging)
    await withFallback(async () => {
      await redis.incr('analytics:score_shares_total');
      await redis.hincrby('analytics:score_shares_by_platform', platform, 1);
      if (user?.id) {
        await redis.incr(`user_shares:${user.id}`);
      }
    }, null);

    return NextResponse.json({ success: true, platform });
  } catch (error) {
    console.error('[readiness-score/share] Failed to record share:', error);
    return NextResponse.json({ success: false, error: 'Failed to record share' }, { status: 500 });
  }
}
