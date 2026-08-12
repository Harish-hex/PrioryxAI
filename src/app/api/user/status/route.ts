import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { count: messagesToday } = await supabase
    .from('assistant_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', todayStart.toISOString());
    
  const visionToday = 0;

  const isPro = Boolean(userData?.pro_status) &&
    (!userData?.pro_expires_at || new Date(userData.pro_expires_at) > new Date());

  return NextResponse.json({
    pro_status: isPro,
    pro_expires_at: userData?.pro_expires_at ?? null,
    messages_today: messagesToday ?? 0,
    vision_uploads_today: visionToday ?? 0,
  });
}
