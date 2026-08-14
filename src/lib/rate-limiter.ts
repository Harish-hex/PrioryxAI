import { LRUCache } from 'lru-cache';

interface RateLimitOptions {
  interval: number;
  max: number;
  keyPrefix?: string;
}

const caches = new Map<string, LRUCache<string, { count: number; resetAt: number }>>();

function getCache(options: RateLimitOptions): LRUCache<string, { count: number; resetAt: number }> {
  const key = `${options.keyPrefix}:${options.interval}:${options.max}`;
  let cache = caches.get(key);
  if (!cache) {
    cache = new LRUCache<string, { count: number; resetAt: number }>({
      max: 10000,
      ttl: options.interval,
      updateAgeOnGet: true,
    });
    caches.set(key, cache);
  }
  return cache;
}

export function createRateLimiter(options: RateLimitOptions) {
  const cache = getCache(options);

  return {
    check(key: string): { success: boolean; remaining: number; reset: number; limit: number } {
      const now = Date.now();
      const entry = cache.get(key);

      if (!entry || now > entry.resetAt) {
        const resetAt = now + options.interval;
        cache.set(key, { count: 1, resetAt });
        return { success: true, remaining: options.max - 1, reset: resetAt, limit: options.max };
      }

      if (entry.count >= options.max) {
        return { success: false, remaining: 0, reset: entry.resetAt, limit: options.max };
      }

      entry.count += 1;
      cache.set(key, entry);
      return { success: true, remaining: options.max - entry.count, reset: entry.resetAt, limit: options.max };
    },
  };
}

export const apiRateLimiter = createRateLimiter({
  interval: 60 * 1000,
  max: 100,
  keyPrefix: 'api',
});

export const authRateLimiter = createRateLimiter({
  interval: 60 * 1000,
  max: 10,
  keyPrefix: 'auth',
});

export const assistantRateLimiter = createRateLimiter({
  interval: 60 * 1000,
  max: 20,
  keyPrefix: 'assistant',
});

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}