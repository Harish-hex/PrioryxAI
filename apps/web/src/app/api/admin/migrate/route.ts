import { NextRequest, NextResponse } from 'next/server';
import { ensureSchemaMigrations } from '@/lib/schema-migrations';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ message: 'Migration endpoint ready. Use POST to execute.' });
}

export async function POST(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    console.error('[admin/migrate] ADMIN_SECRET env var not set');
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const token = request.headers.get('x-admin-token');
  if (!token) {
    console.warn('[admin/migrate] Unauthorized attempt — missing token');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tokenBuf = Buffer.from(token);
  const secretBuf = Buffer.from(adminSecret);
  let valid = false;
  try {
    valid = tokenBuf.length === secretBuf.length && crypto.timingSafeEqual(tokenBuf, secretBuf);
  } catch {
    valid = false;
  }
  if (!valid) {
    console.warn('[admin/migrate] Unauthorized attempt — bad token');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await ensureSchemaMigrations({ force: true });

    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    console.error('[admin/migrate]', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
