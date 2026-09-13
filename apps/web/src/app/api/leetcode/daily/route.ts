import { NextResponse } from 'next/server';
import { fetchDailyProblem } from '@/lib/leetcode/alfa-api';

export const maxDuration = 60

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const daily = await fetchDailyProblem();
    if (!daily) {
      return NextResponse.json({ error: 'Failed to fetch daily problem' }, { status: 500 });
    }
    return NextResponse.json({ data: daily });
  } catch (error) {
    console.error('[daily problem] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
