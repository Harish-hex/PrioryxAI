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
export async function withFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

// For security-critical rate limits: fail CLOSED (block request) if Redis is unreachable.
// Returns true if the request should be blocked (limit exceeded OR Redis down).
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ blocked: boolean; reason: 'limit_exceeded' | 'redis_error' | null }> {
  try {
    const result = await limiter.limit(identifier);
    if (!result.success) return { blocked: true, reason: 'limit_exceeded' };
    return { blocked: false, reason: null };
  } catch {
    // Redis is down — block to prevent abuse during outage
    return { blocked: true, reason: 'redis_error' };
  }
}

// Returns seconds until midnight IST — used for free message counter TTL
export function midnightISTttl(): number {
  const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const midnight = new Date(ist);
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight.getTime() - ist.getTime()) / 1000);
}
