import { NextResponse } from 'next/server';
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server';
import { getMockProfile } from '@/lib/mock-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

export async function GET() {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Read through the service role. The anon cookie client is RLS-bound, and
  // `.single()` raises PGRST116 on zero rows rather than returning null —
  // together those made a connected profile look disconnected in production,
  // which is why the portal kept asking users to reconnect.
  const db = createServiceRoleClient();

  const { data, error } = await db
    .from('leetcode_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[LeetCode Profile] query error:', error.message);
  }

  if (data) {
    return NextResponse.json({ data });
  }

  // The mock-db fallback is file-backed and cannot work on Vercel's read-only
  // filesystem — keep it for local dev only.
  if (process.env.NODE_ENV === 'development') {
    const mock = getMockProfile('leetcode', user.id);
    if (mock) {
      return NextResponse.json({
        data: {
          ...mock,
          profile_data: mock.profile,
          placement_readiness_score: mock.quickScore,
          leetcode_username: mock.username,
        },
      });
    }
  }

  console.log('[LeetCode Profile] no profile row for user:', user.id);
  return NextResponse.json({ data: null });
}
