import { Pool } from 'pg';

const MIGRATIONS = [
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS cgpa NUMERIC(4,2)`,
  `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes TEXT`,
];

let pool: Pool | null = null;
let migrationPromise: Promise<string[]> | null = null;
let migrationsVerified = false;

function normalizeDatabaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();

  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname && !parsed.hash) {
      return trimmed;
    }
  } catch {
    // Fall through to a manual normalization pass for raw passwords with reserved characters.
  }

  const protocolIndex = trimmed.indexOf('://');
  if (protocolIndex === -1) return trimmed;

  const authStart = protocolIndex + 3;
  const pathIndex = trimmed.indexOf('/', authStart);
  if (pathIndex === -1) return trimmed;

  const authSegment = trimmed.slice(authStart, pathIndex);
  const lastAtIndex = authSegment.lastIndexOf('@');
  const firstColonIndex = authSegment.indexOf(':');

  if (lastAtIndex === -1 || firstColonIndex === -1 || firstColonIndex > lastAtIndex) {
    return trimmed;
  }

  const username = authSegment.slice(0, firstColonIndex);
  const password = authSegment.slice(firstColonIndex + 1, lastAtIndex);
  const host = authSegment.slice(lastAtIndex + 1);

  return `${trimmed.slice(0, authStart)}${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}${trimmed.slice(pathIndex)}`;
}

function getPool(): Pool {
  if (!pool) {
    const dbUrl = process.env.SUPABASE_DB_URL;
    if (!dbUrl) {
      throw new Error('SUPABASE_DB_URL not set');
    }

    pool = new Pool({
      connectionString: normalizeDatabaseUrl(dbUrl),
      ssl: { rejectUnauthorized: false },
    });
  }

  return pool;
}

export async function ensureSchemaMigrations(options?: { force?: boolean }) {
  const force = options?.force ?? false;

  if (!force && migrationsVerified) {
    return ['SKIP: schema already verified'];
  }

  if (!force && migrationPromise) {
    return migrationPromise;
  }

  migrationPromise = (async () => {
    const db = getPool();
    const results: string[] = [];
    let hadError = false;

    for (const sql of MIGRATIONS) {
      try {
        await db.query(sql);
        results.push(`OK: ${sql}`);
      } catch (err: any) {
        hadError = true;
        results.push(`ERR: ${sql} — ${err.message}`);
      }
    }

    migrationsVerified = !hadError;
    return results;
  })();

  try {
    return await migrationPromise;
  } finally {
    migrationPromise = null;
  }
}

export function errorMentionsColumn(error: { message?: string | null } | null | undefined, column: string) {
  return error?.message?.toLowerCase().includes(column.toLowerCase()) ?? false;
}
