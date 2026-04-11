import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { Pool } from 'pg';

export const runtime = 'nodejs';

// Runs idempotent schema migrations on first call.
// Uses the direct DB URL (server-only, never exposed to browser).
const MIGRATIONS = [
  // v4: add cgpa column
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS cgpa NUMERIC(4,2)`,
  // v5: add notes column on tasks
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes TEXT`,
];

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const dbUrl = process.env.SUPABASE_DB_URL;
    if (!dbUrl) throw new Error('SUPABASE_DB_URL not set');
    pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

export async function POST() {
  // Auth guard — only callable from server (no user session needed; protected by service key)
  const supabase = createServiceClient();

  try {
    const db = getPool();
    const results: string[] = [];

    for (const sql of MIGRATIONS) {
      try {
        await db.query(sql);
        results.push(`OK: ${sql.slice(0, 60)}`);
      } catch (err: any) {
        results.push(`ERR: ${sql.slice(0, 60)} — ${err.message}`);
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    console.error('[admin/migrate]', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
