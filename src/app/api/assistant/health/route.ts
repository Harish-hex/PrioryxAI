import { NextResponse } from 'next/server';

export const maxDuration = 10

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
}
