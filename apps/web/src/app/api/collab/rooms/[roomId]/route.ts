import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/collab/rooms/[roomId] — room detail + members
export async function GET(_req: NextRequest, { params }: { params: { roomId: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceRoleClient();

  const { data: room, error } = await db.from('study_rooms').select('*').eq('id', params.roomId).maybeSingle();
  if (error || !room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  const { data: members } = await db
    .from('study_room_members')
    .select('*')
    .eq('room_id', params.roomId)
    .eq('is_active', true);

  const memberIds = (members ?? []).map((m) => m.user_id);
  const { data: users } = memberIds.length
    ? await db.from('users').select('id, name, college').in('id', memberIds)
    : { data: [] as { id: string; name: string | null; college: string | null }[] };
  const userById = new Map((users ?? []).map((u) => [u.id, u]));

  const shapedMembers = (members ?? []).map((m) => ({
    ...m,
    display_name: userById.get(m.user_id)?.name ?? 'Student',
  }));

  const isMember = shapedMembers.some((m) => m.user_id === user.id);
  if (room.is_private && !isMember && room.host_id !== user.id) {
    return NextResponse.json({ error: 'This room is private' }, { status: 403 });
  }

  return NextResponse.json({ room: { ...room, password_hash: undefined }, members: shapedMembers });
}

// PATCH /api/collab/rooms/[roomId] — host-only updates (focus topic, session_data notes/timer)
export async function PATCH(req: NextRequest, { params }: { params: { roomId: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceRoleClient();
  const { data: room } = await db.from('study_rooms').select('host_id, session_data').eq('id', params.roomId).maybeSingle();
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  if (room.host_id !== user.id) {
    const { data: membership } = await db
      .from('study_room_members')
      .select('id')
      .eq('room_id', params.roomId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();
    if (!membership) {
      return NextResponse.json({ error: 'You are not an active member of this room' }, { status: 403 });
    }
  }

  let body: { focusTopic?: string; sessionData?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Shared notes updates are allowed from any active member (it's a shared
  // scratchpad); focus topic changes are host-only.
  const updates: Record<string, unknown> = {};
  if (body.sessionData) {
    updates.session_data = { ...(room.session_data as Record<string, unknown>), ...body.sessionData };
  }
  if (body.focusTopic !== undefined) {
    if (room.host_id !== user.id) {
      return NextResponse.json({ error: 'Only the host can change the focus topic' }, { status: 403 });
    }
    updates.focus_topic = body.focusTopic;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { data: updated, error } = await db
    .from('study_rooms')
    .update(updates)
    .eq('id', params.roomId)
    .select()
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }

  return NextResponse.json({ room: { ...updated, password_hash: undefined } });
}

// DELETE /api/collab/rooms/[roomId] — host ends the session
export async function DELETE(_req: NextRequest, { params }: { params: { roomId: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceRoleClient();
  const { data: room } = await db.from('study_rooms').select('host_id').eq('id', params.roomId).maybeSingle();
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.host_id !== user.id) {
    return NextResponse.json({ error: 'Only the host can end this session' }, { status: 403 });
  }

  const { error } = await db
    .from('study_rooms')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', params.roomId);

  if (error) {
    return NextResponse.json({ error: 'Failed to end room' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
