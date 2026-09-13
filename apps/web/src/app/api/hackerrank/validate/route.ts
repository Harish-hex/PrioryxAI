export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { fetchMultiPlatformProfiles } from '@/lib/hackerrank/cps-client';

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ valid: false, error: 'Username required' }, { status: 400 });
  }

  try {
    const data = await fetchMultiPlatformProfiles({ hackerrank: username });
    
    if (data.hackerrank) {
      return NextResponse.json({
        valid: true,
        preview: {
          totalSolved: data.hackerrank.totalSolved,
          badges: data.hackerrank.badges,
        }
      });
    }

    return NextResponse.json({ valid: false });
  } catch (err: any) {
    return NextResponse.json({ valid: false, error: err.message }, { status: 500 });
  }
}
