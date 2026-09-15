import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { requireAppUser } from "@/lib/app-user";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { LiveRoom } from "@/components/collab/rooms/LiveRoom";

export default async function StudyRoomDetailPage({ params }: { params: { roomId: string } }) {
  const { id: userId } = await requireAppUser();
  const db = createServiceRoleClient();

  const { data: room } = await db.from("study_rooms").select("*").eq("id", params.roomId).maybeSingle();

  if (!room) {
    return (
      <div className="space-y-6">
        <Link
          href="/career/collab/rooms"
          className="neu-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300"
        >
          <ChevronLeft size={13} /> Back to Study Rooms
        </Link>
        <div className="neu-card rounded-[28px] p-10 text-center space-y-2">
          <p className="text-sm font-bold text-slate-950 dark:text-white">This room doesn't exist or has ended.</p>
        </div>
      </div>
    );
  }

  // Ensure this user is (or becomes, if public) a member before rendering
  // the live experience — mirrors what the join API does, so a shared link
  // works even for a user who hasn't clicked "Join" yet.
  const { data: existingMember } = await db
    .from("study_room_members")
    .select("id, is_active")
    .eq("room_id", params.roomId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!existingMember) {
    if (room.is_private) {
      redirect(`/career/collab/rooms?join=${params.roomId}`);
    }
    if (room.status !== "active") {
      redirect("/career/collab/rooms");
    }
    await db.from("study_room_members").insert({
      room_id: params.roomId,
      user_id: userId,
      role: "member",
      presence_data: { status: "studying" },
    });
  } else if (!existingMember.is_active) {
    await db.from("study_room_members").update({ is_active: true, left_at: null }).eq("id", existingMember.id);
  }

  const { data: members } = await db
    .from("study_room_members")
    .select("*")
    .eq("room_id", params.roomId)
    .eq("is_active", true);

  const memberIds = (members ?? []).map((m) => m.user_id);
  const { data: users } = memberIds.length
    ? await db.from("users").select("id, name").in("id", memberIds)
    : { data: [] as { id: string; name: string | null }[] };
  const nameById = new Map((users ?? []).map((u) => [u.id, u.name]));

  const { data: messages } = await db
    .from("study_room_messages")
    .select("*")
    .eq("room_id", params.roomId)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: senders } = messages?.length
    ? await db.from("users").select("id, name").in("id", Array.from(new Set(messages.map((m) => m.user_id))))
    : { data: [] as { id: string; name: string | null }[] };
  const senderNameById = new Map((senders ?? []).map((u) => [u.id, u.name]));

  const initialRoom = {
    id: room.id,
    code: room.code,
    name: room.name,
    description: room.description,
    hostId: room.host_id,
    host_id: room.host_id,
    roomType: room.room_type,
    focusTopic: room.focus_topic,
    maxMembers: room.max_members,
    isPrivate: room.is_private,
    status: room.status,
    scheduledAt: room.scheduled_at,
    startedAt: room.started_at,
    endedAt: room.ended_at,
    sessionData: room.session_data ?? {},
    collegeDomain: room.college_domain,
    tags: room.tags ?? [],
    createdAt: room.created_at,
  };

  return (
    <LiveRoom
      roomId={params.roomId}
      currentUserId={userId}
      initialRoom={initialRoom}
      initialMembers={(members ?? []).map((m) => ({
        user_id: m.user_id,
        role: m.role,
        display_name: nameById.get(m.user_id) ?? "Student",
      }))}
      initialMessages={(messages ?? [])
        .slice()
        .reverse()
        .map((m) => ({ ...m, display_name: senderNameById.get(m.user_id) ?? "Student" }))}
    />
  );
}
