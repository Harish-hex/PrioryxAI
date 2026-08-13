import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { syncGithubForUser } from '@/lib/github-sync';
import { verifyGitHubSignature } from '@/lib/security';

export const runtime = 'nodejs';

// GitHub sends push/star events here — trigger a GitHub cache sync for the user
export async function POST(request: NextRequest) {
  const sig = request.headers.get('x-hub-signature-256');
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const body = await request.text();

  let isValid = false;
  try {
    isValid = verifyGitHubSignature(body, sig);
  } catch {
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
  }

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = request.headers.get('x-github-event');
  if (event !== 'push') {
    // Only trigger sync on push events
    return NextResponse.json({ received: true, action: 'ignored' });
  }

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const githubUsername: string | undefined = payload?.sender?.login;
  if (!githubUsername) {
    return NextResponse.json({ received: true, action: 'no_sender' });
  }

  // Look up the user by github_username
  const supabase = createServiceClient();
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('github_username', githubUsername)
    .single();

  if (!user) {
    // User not in our system — silently ack
    return NextResponse.json({ received: true, action: 'user_not_found' });
  }

  try {
    await syncGithubForUser(user.id, githubUsername);
  } catch (error) {
    console.error('[webhooks/github] sync failed:', error);
  }

  return NextResponse.json({ received: true, action: 'sync_triggered' });
}
