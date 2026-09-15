"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, StickyNote, Loader2 } from "lucide-react";
import type { RoomPresenceStatus, RoomTimerState, StudyRoom } from "@prioryxai/types";
import { RoomPresence, type PresenceMember } from "./RoomPresence";
import { RoomChat, type RoomChatMessage } from "./RoomChat";
import { RoomTimer } from "./RoomTimer";
import {
  subscribeToPresence,
  trackPresence,
  roomPresenceChannel,
} from "@/lib/supabase/realtime";

interface RoomMemberRow {
  user_id: string;
  role: "host" | "co_host" | "member";
  display_name?: string;
}

const STATUS_OPTIONS: RoomPresenceStatus[] = ["studying", "away", "stuck"];
const STATUS_LABEL: Record<RoomPresenceStatus, string> = {
  studying: "🎯 Studying",
  away: "🟡 Away",
  stuck: "🔴 Stuck",
};

export function LiveRoom({
  roomId,
  currentUserId,
  initialRoom,
  initialMembers,
  initialMessages,
}: {
  roomId: string;
  currentUserId: string;
  initialRoom: StudyRoom & { host_id: string };
  initialMembers: RoomMemberRow[];
  initialMessages: RoomChatMessage[];
}) {
  const router = useRouter();
  const [room, setRoom] = useState(initialRoom);
  const [myStatus, setMyStatus] = useState<RoomPresenceStatus>("studying");
  const [presenceMembers, setPresenceMembers] = useState<PresenceMember[]>(
    initialMembers.map((m) => ({
      userId: m.user_id,
      displayName: m.display_name ?? "Student",
      role: m.role,
      status: "studying",
    }))
  );
  const [notes, setNotes] = useState<string>(room.sessionData?.notes ?? "");
  const [leaving, setLeaving] = useState(false);
  const notesDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isHost = room.hostId === currentUserId;

  useEffect(() => {
    const { channel, unsubscribe } = subscribeToPresence<{
      userId: string;
      displayName: string;
      role: "host" | "co_host" | "member";
      status: RoomPresenceStatus;
    }>(roomPresenceChannel(roomId), {
      onSync: (state) => {
        const flat = Object.values(state).flat();
        // Dedupe by userId — a user reconnecting briefly has two presence keys.
        const byUser = new Map(flat.map((p) => [p.userId, p]));
        setPresenceMembers(Array.from(byUser.values()));
      },
      onReconnect: () => {
        // Re-fetch room state after a drop — presence and messages may have
        // changed while disconnected.
        fetch(`/api/collab/rooms/${roomId}`)
          .then((res) => res.json())
          .then((d) => {
            if (d?.room) setRoom(d.room);
          })
          .catch(() => {});
      },
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        const me = initialMembers.find((m) => m.user_id === currentUserId);
        await trackPresence(channel, {
          userId: currentUserId,
          displayName: me?.display_name ?? "You",
          role: me?.role ?? "member",
          status: myStatus,
        });
      }
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const updateStatus = useCallback(
    (status: RoomPresenceStatus) => {
      setMyStatus(status);
      // Re-track with the new status — the presence channel re-subscribing
      // isn't necessary, just update the tracked payload on the same channel.
      const { channel, unsubscribe } = subscribeToPresence(roomPresenceChannel(roomId), {});
      channel.subscribe(async (s) => {
        if (s === "SUBSCRIBED") {
          const me = presenceMembers.find((m) => m.userId === currentUserId);
          await trackPresence(channel, {
            userId: currentUserId,
            displayName: me?.displayName ?? "You",
            role: me?.role ?? "member",
            status,
          });
          setTimeout(unsubscribe, 500);
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roomId, presenceMembers]
  );

  function handleNotesChange(value: string) {
    setNotes(value);
    if (notesDebounce.current) clearTimeout(notesDebounce.current);
    notesDebounce.current = setTimeout(() => {
      fetch(`/api/collab/rooms/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionData: { notes: value } }),
      }).catch(() => {});
    }, 800);
  }

  async function handleLeave() {
    setLeaving(true);
    try {
      await fetch(`/api/collab/rooms/${roomId}/leave`, { method: "POST" });
    } finally {
      router.push("/career/collab/rooms");
    }
  }

  return (
    <div className="space-y-5">
      <header className="neu-card rounded-[28px] p-5 sm:p-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-slate-950 dark:text-white truncate">{room.name}</h1>
          {room.focusTopic && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{room.focusTopic}</p>}
        </div>
        <span className="neu-pill shrink-0 rounded-full px-3 py-1 text-xs font-bold text-slate-500 dark:text-slate-400">
          Code: {room.code}
        </span>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_280px] gap-5">
        <div className="space-y-4 lg:order-1">
          <RoomPresence members={presenceMembers} currentUserId={currentUserId} isHost={isHost} />
        </div>

        <div className="space-y-4 lg:order-2">
          <RoomTimer
            roomId={roomId}
            isHost={isHost}
            timerState={(room.sessionData?.timer as RoomTimerState | undefined) ?? null}
            onUpdate={(timer) => setRoom((prev) => ({ ...prev, sessionData: { ...prev.sessionData, timer } }))}
          />

          <div className="neu-card rounded-[24px] p-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <StickyNote size={12} />
              Collaborative Notes
            </p>
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Approach, pseudocode, whiteboard sketches — shared with everyone in the room…"
              rows={12}
              className="neu-input w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none font-mono"
            />
          </div>
        </div>

        <div className="lg:order-3 h-[420px] lg:h-auto">
          <RoomChat roomId={roomId} currentUserId={currentUserId} initialMessages={initialMessages} />
        </div>
      </div>

      <div className="neu-card rounded-[24px] p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              className={`rounded-2xl px-3 py-2 text-xs font-bold transition ${
                myStatus === s ? "neu-inset text-slate-950 dark:text-white" : "neu-pill text-slate-500 dark:text-slate-400"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <button
          onClick={handleLeave}
          disabled={leaving}
          className="neu-btn inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 disabled:opacity-50"
        >
          {leaving ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
          Leave Room
        </button>
      </div>
    </div>
  );
}
