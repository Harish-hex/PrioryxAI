import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withFallback, redis } from '@/lib/redis';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: userData } = await supabase
    .from('users')
    .select('pro_status, pro_expires_at')
    .eq('id', user.id)
    .single();

  const [messagesToday, visionToday] = await Promise.all([
    withFallback(() => redis.get<number>(`msg_count:${user.id}`), 0),
    withFallback(() => redis.get<number>(`vision_count:${user.id}`), 0),
  ]);

  return NextResponse.json({
    pro_status: userData?.pro_status ?? false,
    pro_expires_at: userData?.pro_expires_at ?? null,
    messages_today: messagesToday ?? 0,
    vision_uploads_today: visionToday ?? 0,
  });
}
