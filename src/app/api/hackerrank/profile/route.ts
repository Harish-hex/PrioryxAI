import { NextResponse } from 'next/server';
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server';
import { getMockProfile } from '@/lib/mock-db';
import { withFallback, redis } from '@/lib/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const HACKERRANK_PROFILE_CACHE_TTL = 120; // seconds — short so a fresh sync shows up quickly

export async function GET() {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cacheKey = `hackerrank-profile:${user.id}`;
  const cached = await withFallback(() => redis.get(cacheKey), null);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Service role + maybeSingle for the same reason as the LeetCode profile
  // route: RLS plus `.single()`'s zero-row error made connected accounts read
  // back as disconnected in production.
  const db = createServiceRoleClient();

  const { data, error } = await db
    .from('multi_platform_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[HackerRank Profile] query error:', error.message);
  }

  if (data) {
    const responseBody = { data };
    await withFallback(() => redis.set(cacheKey, responseBody, { ex: HACKERRANK_PROFILE_CACHE_TTL }), undefined);
    return NextResponse.json(responseBody);
  }

  if (process.env.NODE_ENV === 'development') {
    const mock = getMockProfile('hackerrank', user.id);
    if (mock) return NextResponse.json({ data: mock });
  }

  console.log('[HackerRank Profile] no profile row for user:', user.id);
  return NextResponse.json({ data: null });
}
