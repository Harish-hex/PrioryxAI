import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/collab/rooms/[roomId]/leave
export async function POST(_req: NextRequest, { params }: { params: { roomId: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceRoleClient();

  const { error } = await db
    .from('study_room_members')
    .update({ is_active: false, left_at: new Date().toISOString() })
    .eq('room_id', params.roomId)
    .eq('user_id', user.id);

  if (error) {
    console.error('[Collab Rooms] Leave error:', error.message);
    return NextResponse.json({ error: 'Failed to leave room' }, { status: 500 });
  }

  // If the host leaves and other active members remain, hand off host role
  // to whoever joined next so the room keeps working — "works with one
  // person if others leave" also means it must survive the host leaving.
  const { data: room } = await db.from('study_rooms').select('host_id').eq('id', params.roomId).maybeSingle();
  if (room?.host_id === user.id) {
    const { data: remaining } = await db
      .from('study_room_members')
      .select('id, user_id')
      .eq('room_id', params.roomId)
      .eq('is_active', true)
      .order('joined_at', { ascending: true })
      .limit(1);

    if (remaining && remaining.length > 0) {
      await db.from('study_rooms').update({ host_id: remaining[0].user_id }).eq('id', params.roomId);
      await db.from('study_room_members').update({ role: 'host' }).eq('id', remaining[0].id);
    } else {
      // No one left — end the room.
      await db
        .from('study_rooms')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', params.roomId);
    }
  }

  return NextResponse.json({ success: true });
}
