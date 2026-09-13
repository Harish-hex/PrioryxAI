import { NextResponse } from 'next/server';
import { openai, openaiConfigured } from '@/lib/openai';

export const maxDuration = 10

export const runtime = 'nodejs';

export async function GET() {
  if (!openaiConfigured) {
    return NextResponse.json({ status: 'down', reason: 'missing_api_key' }, { status: 503 });
  }

  try {
    await openai.models.retrieve('gpt-4o');
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[assistant/health] OpenAI ping failed:', err?.message);
    return NextResponse.json({ status: 'down', reason: 'openai_unreachable' }, { status: 503 });
  }
}
