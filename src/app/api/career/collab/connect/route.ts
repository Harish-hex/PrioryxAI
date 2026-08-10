import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code } = await req.json() as { code: string };
  if (!code || code.length < 4) {
    return NextResponse.json({ error: 'Invalid connect code.' }, { status: 400 });
  }

  const supabaseAdmin = createServiceClient();
  const { data: peer } = await supabaseAdmin
    .from('peer_profiles')
    .select('user_id, display_name, connect_code')
    .eq('connect_code', code.toUpperCase())
    .maybeSingle();

  if (!peer) {
    return NextResponse.json({ error: 'No user found with that connect code.' }, { status: 404 });
  }
  if (peer.user_id === user.id) {
    return NextResponse.json({ error: 'That is your own code!' }, { status: 400 });
  }

  // Record the connection (upsert to avoid duplicates)
  await supabaseAdmin.from('peer_connections').upsert(
    { user_a: user.id, user_b: peer.user_id },
    { onConflict: 'user_a,user_b', ignoreDuplicates: true }
  );

  return NextResponse.json({ success: true, name: peer.display_name ?? 'Your peer' });
}
