import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
  }

  // Calculate the date 90 days ago
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 90);
  const fromDateStr = fromDate.toISOString().split('T')[0];

  const { data, error } = await supabase.rpc('get_user_daily_activity', {
    p_user_id: userId,
    p_from: fromDateStr
  });

  if (error) {
    console.error('[contributions] RPC failed', error);
    return NextResponse.json({ error: 'Failed to fetch contributions' }, { status: 500 });
  }

  // Map to the array of { date, count }
  const contributions = data?.map((row: any) => ({
    date: row.activity_date,
    count: Number(row.count)
  })) || [];

  return NextResponse.json({ contributions });
}
