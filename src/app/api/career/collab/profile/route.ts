import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function generateConnectCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusing I/O/0/1
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Try to get existing peer profile
  let { data: profile } = await supabase
    .from('peer_profiles')
    .select('connect_code, display_name')
    .eq('user_id', user.id)
    .maybeSingle();

  // Create one if missing
  if (!profile) {
    const code = generateConnectCode();
    const { data: newProfile, error } = await supabase
      .from('peer_profiles')
      .upsert({ user_id: user.id, connect_code: code }, { onConflict: 'user_id' })
      .select('connect_code, display_name')
      .single();
    if (error) {
      console.error('[Collab Profile] upsert error:', error);
      return NextResponse.json({ profile: { connect_code: code } });
    }
    profile = newProfile;
  }

  return NextResponse.json({ profile });
}
