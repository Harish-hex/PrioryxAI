import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getFeedData } from '@/lib/data/feed';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');

  try {
    const result = await getFeedData(supabase, user.id, {
      page: pageParam ? parseInt(pageParam, 10) : undefined,
      limit: limitParam ? parseInt(limitParam, 10) : undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[feed] failed:', err);
    return NextResponse.json({ error: 'Failed to load feed' }, { status: 500 });
  }
}
