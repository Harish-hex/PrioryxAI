import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

export const redis = Redis.fromEnv();

export const assistantRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
});

export const visionRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, '1 d'),
});

export const visionRatelimitPro = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 d'),
});

// Redis failure must never crash the product — safe for caches and non-critical operations
export async function withFallback<T>(fn: () => Promise<T>, fallback: T, timeoutMs = 800): Promise<T> {
  try {
    const timeoutPromise = new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Redis timeout')), timeoutMs)
    );
    return await Promise.race([fn(), timeoutPromise]);
  } catch {
    return fallback;
  }
}

// These are soft usage limiters (spam/cost control), not an auth boundary —
// fail OPEN (allow the request) if Redis is unreachable. Failing closed here
// previously meant any Redis outage took the assistant, interview prep,
// resume autodraft, and vision ingest completely offline for every user
// (worse than temporarily not rate-limiting, which self-heals once Redis is
// back). Mirrors the fail-open reasoning already used by withFallback().
// Returns true if the request should be blocked (limit exceeded only).
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ blocked: boolean; reason: 'limit_exceeded' | 'redis_error' | null }> {
  try {
    const result = await limiter.limit(identifier);
    if (!result.success) return { blocked: true, reason: 'limit_exceeded' };
    return { blocked: false, reason: null };
  } catch {
    // Redis is down — let the request through rather than taking the whole
    // feature offline. 'redis_error' is still reported so callers can log it.
    return { blocked: false, reason: 'redis_error' };
  }
}

// Returns seconds until midnight IST — used for free message counter TTL
export function midnightISTttl(): number {
  const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const midnight = new Date(ist);
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight.getTime() - ist.getTime()) / 1000);
}
