import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_MESSAGE_TYPES = ['text', 'code', 'link', 'problem'];

// GET /api/collab/rooms/[roomId]/messages — last 50
export async function GET(_req: NextRequest, { params }: { params: { roomId: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceRoleClient();

  const { data: room } = await db.from('study_rooms').select('is_private, host_id').eq('id', params.roomId).maybeSingle();
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  if (room.is_private && room.host_id !== user.id) {
    const { data: membership } = await db
      .from('study_room_members')
      .select('id')
      .eq('room_id', params.roomId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();
    if (!membership) {
      return NextResponse.json({ error: 'This room is private' }, { status: 403 });
    }
  }

  const { data: messages, error } = await db
    .from('study_room_messages')
    .select('*')
    .eq('room_id', params.roomId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: 'Failed to load messages', messages: [] }, { status: 500 });
  }

  return NextResponse.json({ messages: (messages ?? []).reverse() });
}

// POST /api/collab/rooms/[roomId]/messages — Body: { content, messageType?, metadata? }
// Delivery to other clients happens via Postgres Changes (see
// lib/supabase/realtime.ts subscribeToTableChanges) — this route just
// persists the message; it does not broadcast.
export async function POST(req: NextRequest, { params }: { params: { roomId: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceRoleClient();

  // Membership is also enforced by RLS, but check explicitly so we can
  // return a clear error instead of a silent RLS-denied insert failure.
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

  let body: { content?: string; messageType?: string; metadata?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const content = body.content?.trim();
  if (!content) {
    return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
  }
  const messageType = body.messageType && VALID_MESSAGE_TYPES.includes(body.messageType) ? body.messageType : 'text';

  const { data: message, error } = await db
    .from('study_room_messages')
    .insert({
      room_id: params.roomId,
      user_id: user.id,
      content,
      message_type: messageType,
      metadata: body.metadata ?? {},
    })
    .select()
    .single();

  if (error || !message) {
    console.error('[Collab Rooms] Message insert error:', error?.message);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }

  const { data: sender } = await db.from('users').select('name').eq('id', user.id).maybeSingle();

  return NextResponse.json({ message: { ...message, display_name: sender?.name ?? 'Student' } });
}
