type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  userId?: string;
  route?: string;
  feature?: string;
  source?: string;
  durationMs?: number;
  [key: string]: unknown;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'api_key',
  'apikey',
  'secret',
  'service_role',
]);

function redact(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.slice(0, 20).map(redact);

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      out[key] = '[redacted]';
    } else if (typeof val === 'object' && val !== null) {
      out[key] = redact(val);
    } else {
      out[key] = val;
    }
  }
  return out;
}

export function getRequestId(headers?: Headers): string {
  return (
    headers?.get('x-request-id') ||
    headers?.get('x-vercel-id') ||
    crypto.randomUUID()
  );
}

export function logEvent(level: LogLevel, message: string, context: LogContext = {}) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(redact(context) as Record<string, unknown>),
  };

  if (level === 'error') console.error(JSON.stringify(payload));
  else if (level === 'warn') console.warn(JSON.stringify(payload));
  else console.log(JSON.stringify(payload));
}

export async function measure<T>(
  label: string,
  context: LogContext,
  fn: () => Promise<T>
): Promise<T> {
  const started = Date.now();
  try {
    const result = await fn();
    logEvent('info', `${label}.success`, { ...context, durationMs: Date.now() - started });
    return result;
  } catch (error) {
    logEvent('error', `${label}.error`, {
      ...context,
      durationMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
