// Shared user-status loader — extracted from src/app/api/user/status/route.ts
// so the same logic (Pro status + daily usage counters) can be called from
// the API route (client revalidation) and directly from a Server Component.
import type { SupabaseClient } from '@supabase/supabase-js';
import { withFallback, redis } from '@/lib/redis';

export async function getUserStatusData(supabase: SupabaseClient, userId: string) {
  const cacheKey = `user_status:${userId}`;
  const cached = await withFallback(() => redis.get(cacheKey), null);
  if (cached) return cached;

  const [{ data: userData }, messagesToday, visionToday] = await Promise.all([
    supabase
      .from('users')
      .select('pro_status, pro_expires_at')
      .eq('id', userId)
      .maybeSingle(),
    withFallback(() => redis.get<number>(`msg_count:${userId}`), 0),
    withFallback(() => redis.get<number>(`vision_count:${userId}`), 0),
  ]);

  const isPro = Boolean(userData?.pro_status) &&
    (!userData?.pro_expires_at || new Date(userData.pro_expires_at) > new Date());

  const result = {
    pro_status: isPro,
    pro_expires_at: userData?.pro_expires_at ?? null,
    messages_today: messagesToday ?? 0,
    vision_uploads_today: visionToday ?? 0,
  };

  await withFallback(() => redis.set(cacheKey, result, { ex: 30 }), undefined);

  return result;
}
