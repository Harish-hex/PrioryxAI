import { NextResponse } from 'next/server';
import { ensureSchemaMigrations } from '@/lib/schema-migrations';

export const maxDuration = 20

export const runtime = 'nodejs';

export async function POST() {
  try {
    const results = await ensureSchemaMigrations({ force: true });

    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    console.error('[admin/migrate]', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
