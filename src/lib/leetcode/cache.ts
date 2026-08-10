/**
 * Simple Redis cache wrapper using Upstash REST API.
 * Uses fetch to avoid large Redis client libraries.
 */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export async function getCache<T>(key: string): Promise<T | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  try {
    const res = await fetch(`${UPSTASH_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.result) {
      return JSON.parse(data.result) as T;
    }
  } catch (error) {
    console.error(`[cache] get error for key ${key}:`, error);
  }
  return null;
}

export async function setCache(key: string, value: unknown, exSeconds: number = 3600): Promise<void> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return;
  try {
    await fetch(`${UPSTASH_URL}/set/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(value),
    });
    // Set expiration
    await fetch(`${UPSTASH_URL}/expire/${encodeURIComponent(key)}/${exSeconds}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    });
  } catch (error) {
    console.error(`[cache] set error for key ${key}:`, error);
  }
}
