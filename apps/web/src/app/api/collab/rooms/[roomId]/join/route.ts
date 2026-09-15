import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server';
import { verifyRoomPassword } from '@/lib/collab/room-password';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/collab/rooms/[roomId]/join — Body: { password?: string }
export async function POST(req: NextRequest, { params }: { params: { roomId: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceRoleClient();

  // 1. Room must exist and be active
  const { data: room, error: roomErr } = await db
    .from('study_rooms')
    .select('*')
    .eq('id', params.roomId)
    .maybeSingle();
  if (roomErr || !room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }
  if (room.status !== 'active') {
    return NextResponse.json({ error: 'This room is not active' }, { status: 400 });
  }

  // 2. Already a member? Re-activate instead of erroring (covers reconnects).
  const { data: existingMember } = await db
    .from('study_room_members')
    .select('*')
    .eq('room_id', params.roomId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingMember) {
    if (!existingMember.is_active) {
      await db
        .from('study_room_members')
        .update({ is_active: true, left_at: null })
        .eq('id', existingMember.id);
    }
  } else {
    // 3. Capacity check
    const { count } = await db
      .from('study_room_members')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', params.roomId)
      .eq('is_active', true);
    if ((count ?? 0) >= room.max_members) {
      return NextResponse.json({ error: 'This room is full' }, { status: 409 });
    }

    // 4. Private room password check
    if (room.is_private) {
      let body: { password?: string } = {};
      try {
        body = await req.json();
      } catch {
        // no body sent
      }
      if (!room.password_hash || !body.password || !verifyRoomPassword(body.password, room.password_hash)) {
        return NextResponse.json({ error: 'Incorrect password' }, { status: 403 });
      }
    }

    // 5. College-scoped room check
    if (room.college_domain) {
      const { data: myProfile } = await db.from('users').select('college').eq('id', user.id).maybeSingle();
      if (myProfile?.college !== room.college_domain) {
        return NextResponse.json(
          { error: 'This room is only open to students from a specific college' },
          { status: 403 }
        );
      }
    }

    // 6. Insert membership
    const { error: insertErr } = await db.from('study_room_members').insert({
      room_id: params.roomId,
      user_id: user.id,
      role: 'member',
      presence_data: { status: 'studying' },
    });
    if (insertErr) {
      console.error('[Collab Rooms] Join insert error:', insertErr.message);
      return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
    }

    // Best-effort notify the host via the existing peer_notifications table.
    if (room.host_id !== user.id) {
      const { data: joiningUser } = await db.from('users').select('name').eq('id', user.id).maybeSingle();
      await db
        .from('peer_notifications')
        .insert({
          user_id: room.host_id,
          type: 'room_invitation',
          title: `${joiningUser?.name ?? 'A student'} joined "${room.name}"`,
          body: '',
          action_url: `/career/collab/rooms/${room.id}`,
          related_id: room.id,
        })
        .then(
          (res) => res,
          () => {}
        );
    }
  }

  // 7. Return room + members + last 50 messages
  const { data: members } = await db
    .from('study_room_members')
    .select('*')
    .eq('room_id', params.roomId)
    .eq('is_active', true);

  const { data: messages } = await db
    .from('study_room_messages')
    .select('*')
    .eq('room_id', params.roomId)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({
    room: { ...room, password_hash: undefined },
    members: members ?? [],
    messages: (messages ?? []).reverse(),
  });
}
