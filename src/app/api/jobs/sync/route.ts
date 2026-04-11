import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncInternshalaJobsForUser } from '@/lib/job-sync';
import { Receiver } from '@upstash/qstash';

export const runtime = 'nodejs';

// Called by QStash on schedule OR directly by authenticated user to trigger a sync
export async function POST(request: NextRequest) {
  const hasQStashSig = request.headers.get('upstash-signature') !== null;

  let userId: string;
  let subjects: string[];
  let college: string | null;
  let languages: Record<string, number> | null = null;
  let force = false;

  if (hasQStashSig) {
    // Verify QStash signature before trusting body
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
    subjects = body.subjects ?? [];
    college = body.college ?? null;
    languages = body.languages ?? null;
    force = true; // scheduled syncs always bypass the rate-limit

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }
  } else {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Parse optional force flag from request body
    let bodyForce = false;
    try {
      const text = await request.text();
      if (text) {
        const body = JSON.parse(text);
        bodyForce = Boolean(body.force);
      }
    } catch {}

    // Fetch user profile AND GitHub language cache in parallel so role
    // derivation uses both subjects and GitHub languages (Bug fix: previously
    // languages were never fetched here, so GitHub was ignored entirely).
    const [{ data: userData }, { data: githubCache }] = await Promise.all([
      supabase.from('users').select('subjects, college').eq('id', user.id).single(),
      supabase.from('github_cache').select('languages').eq('user_id', user.id).single(),
    ]);

    userId = user.id;
    subjects = userData?.subjects ?? [];
    college = userData?.college ?? null;
    languages = githubCache?.languages ?? null;
    force = bodyForce;
  }

  try {
    const result = await syncInternshalaJobsForUser({
      userId,
      subjects,
      college,
      languages,
      force,
    });

    if (result.skipped === 'missing_apify_token') {
      return NextResponse.json({ message: 'Apify token not configured', inserted: 0 });
    }

    if (result.skipped === 'recently_synced') {
      return NextResponse.json({ message: 'Already synced recently', inserted: 0, skipped: true });
    }

    if (result.skipped === 'no_jobs') {
      return NextResponse.json({ message: 'No jobs found', inserted: 0 });
    }

    return NextResponse.json({ inserted: result.inserted, total_fetched: result.total_fetched });
  } catch (error) {
    console.error('[jobs/sync] DB error:', error);
    return NextResponse.json({ error: 'Failed to save jobs' }, { status: 500 });
  }
}
