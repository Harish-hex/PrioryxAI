import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server';
import { checkRateLimit, roomCreateRatelimit } from '@/lib/redis';
import { generateRoomCode } from '@/lib/collab/room-code';
import { hashRoomPassword } from '@/lib/collab/room-password';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_ROOM_TYPES = ['open_study', 'dsa_sprint', 'project_review', 'mock_interview', 'accountability'];

// GET /api/collab/rooms?type=dsa_sprint&college=only&hasSpace=true
export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceRoleClient();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const collegeOnly = searchParams.get('college') === 'only';

  const { data: myProfile } = await db
    .from('users')
    .select('college')
    .eq('id', user.id)
    .maybeSingle();

  let query = db
    .from('study_rooms')
    .select('*')
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(50);

  if (type && VALID_ROOM_TYPES.includes(type)) {
    query = query.eq('room_type', type);
  }
  if (collegeOnly && myProfile?.college) {
    query = query.eq('college_domain', myProfile.college);
  }

  const { data: rooms, error } = await query;
  if (error) {
    console.error('[Collab Rooms] List error:', error.message);
    return NextResponse.json({ error: 'Failed to load rooms', rooms: [] }, { status: 500 });
  }

  const roomIds = (rooms ?? []).map((r) => r.id);
  const { data: memberCounts } = roomIds.length
    ? await db
        .from('study_room_members')
        .select('room_id')
        .in('room_id', roomIds)
        .eq('is_active', true)
    : { data: [] as { room_id: string }[] };

  const countByRoom = new Map<string, number>();
  for (const m of memberCounts ?? []) {
    countByRoom.set(m.room_id, (countByRoom.get(m.room_id) ?? 0) + 1);
  }

  const hostIds = Array.from(new Set((rooms ?? []).map((r) => r.host_id).filter(Boolean)));
  const { data: hosts } = hostIds.length
    ? await db.from('users').select('id, name, college').in('id', hostIds)
    : { data: [] as { id: string; name: string | null; college: string | null }[] };
  const hostById = new Map((hosts ?? []).map((h) => [h.id, h]));

  const shaped = (rooms ?? []).map((r) => ({
    ...r,
    password_hash: undefined, // never leak this to the client
    member_count: countByRoom.get(r.id) ?? 0,
    host: hostById.get(r.host_id) ?? null,
  }));

  return NextResponse.json({ rooms: shaped });
}

// POST /api/collab/rooms — create a room
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = await checkRateLimit(roomCreateRatelimit, `room-create:${user.id}`);
  if (rl.blocked) {
    return NextResponse.json(
      { error: 'You can create up to 3 study rooms per day. Try again tomorrow.' },
      { status: 429 }
    );
  }

  let body: {
    name?: string;
    description?: string;
    roomType?: string;
    focusTopic?: string;
    maxMembers?: number;
    isPrivate?: boolean;
    password?: string;
    collegeOnly?: boolean;
    scheduledAt?: string;
    tags?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name || name.length < 3) {
    return NextResponse.json({ error: 'Room name must be at least 3 characters.' }, { status: 400 });
  }
  const roomType = body.roomType && VALID_ROOM_TYPES.includes(body.roomType) ? body.roomType : 'open_study';
  const maxMembers = [2, 4, 6].includes(body.maxMembers ?? 6) ? body.maxMembers! : 6;

  if (body.isPrivate && !body.password?.trim()) {
    return NextResponse.json({ error: 'Private rooms require a password.' }, { status: 400 });
  }

  const db = createServiceRoleClient();

  let collegeDomain: string | null = null;
  if (body.collegeOnly) {
    const { data: myProfile } = await db.from('users').select('college').eq('id', user.id).maybeSingle();
    collegeDomain = myProfile?.college ?? null;
  }

  // Generate a code, retrying on the rare collision.
  let code = generateRoomCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await db.from('study_rooms').select('id').eq('code', code).maybeSingle();
    if (!existing) break;
    code = generateRoomCode();
  }

  const { data: room, error } = await db
    .from('study_rooms')
    .insert({
      code,
      name,
      description: body.description?.trim() || null,
      host_id: user.id,
      room_type: roomType,
      focus_topic: body.focusTopic?.trim() || null,
      max_members: maxMembers,
      is_private: Boolean(body.isPrivate),
      password_hash: body.isPrivate && body.password ? hashRoomPassword(body.password) : null,
      status: body.scheduledAt ? 'scheduled' : 'active',
      scheduled_at: body.scheduledAt || null,
      started_at: body.scheduledAt ? null : new Date().toISOString(),
      college_domain: collegeDomain,
      tags: body.tags?.filter(Boolean).slice(0, 8) ?? [],
    })
    .select()
    .single();

  if (error || !room) {
    console.error('[Collab Rooms] Create error:', error?.message);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }

  const { error: memberErr } = await db.from('study_room_members').insert({
    room_id: room.id,
    user_id: user.id,
    role: 'host',
    presence_data: { status: 'studying' },
  });
  if (memberErr) {
    console.error('[Collab Rooms] Host member insert error:', memberErr.message);
  }

  return NextResponse.json({ room: { ...room, password_hash: undefined } });
}
