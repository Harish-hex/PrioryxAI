import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { syncGithubForUser } from '@/lib/github-sync';

export const runtime = 'nodejs';
export const maxDuration = 300;

// Vercel Cron — see apps/web/vercel.json. Resyncs every user's GitHub
// portfolio on a schedule so repo count/languages/streak stay correct even
// without a per-repo webhook (which GitHub can't retroactively attach to a
// repo that didn't exist yet when it was set up).
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: users, error } = await supabase
    .from('users')
    .select('id, github_username')
    .not('github_username', 'is', null);

  if (error) {
    console.error('[cron/github-sync] failed to list users:', error);
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
  }

  let synced = 0;
  let failed = 0;

  // Sequential, not Promise.all — GitHub's GraphQL rate limit is shared
  // across every user's sync on this one token, so fan-out concurrency
  // risks burning the whole budget on a large user base.
  for (const user of users ?? []) {
    if (!user.github_username) continue;
    try {
      await syncGithubForUser(user.id, user.github_username);
      synced++;
    } catch (err) {
      failed++;
      console.error(`[cron/github-sync] sync failed for user ${user.id}:`, err);
    }
  }

  return NextResponse.json({ synced, failed, total: (users ?? []).length });
}
