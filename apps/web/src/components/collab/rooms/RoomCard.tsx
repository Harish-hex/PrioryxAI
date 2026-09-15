"use client";

import { Users, Lock, GraduationCap } from "lucide-react";

export interface RoomCardData {
  id: string;
  name: string;
  focus_topic: string | null;
  room_type: string;
  max_members: number;
  member_count: number;
  is_private: boolean;
  started_at: string | null;
  tags: string[];
  host: { name: string | null; college: string | null } | null;
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  open_study: "Open Study",
  dsa_sprint: "DSA Sprint",
  project_review: "Project Review",
  mock_interview: "Mock Interview",
  accountability: "Accountability",
};

const ROOM_TYPE_ACCENTS: Record<string, string> = {
  open_study: "text-cyan-600 dark:text-cyan-400",
  dsa_sprint: "text-amber-600 dark:text-amber-400",
  project_review: "text-indigo-600 dark:text-indigo-400",
  mock_interview: "text-rose-600 dark:text-rose-400",
  accountability: "text-emerald-600 dark:text-emerald-400",
};

function timeActiveLabel(startedAt: string | null): string {
  if (!startedAt) return "Scheduled";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(startedAt).getTime()) / 60000));
  if (minutes < 1) return "Just started";
  if (minutes < 60) return `Started ${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `Started ${hours}h ${minutes % 60}m ago`;
}

export function RoomCard({ room, onJoin }: { room: RoomCardData; onJoin: (roomId: string) => void }) {
  const isFull = room.member_count >= room.max_members;

  return (
    <div className="neu-card rounded-[24px] p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-950 dark:text-white truncate">{room.name}</h3>
            {room.is_private && <Lock size={12} className="text-slate-400 shrink-0" />}
          </div>
          {room.focus_topic && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{room.focus_topic}</p>
          )}
        </div>
        <span className={`neu-pill shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${ROOM_TYPE_ACCENTS[room.room_type] ?? "text-slate-500"}`}>
          {ROOM_TYPE_LABELS[room.room_type] ?? room.room_type}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Users size={12} />
          {room.member_count}/{room.max_members}
        </span>
        <span>{timeActiveLabel(room.started_at)}</span>
      </div>

      {room.host?.name && (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <GraduationCap size={12} />
          <span>{room.host.name}{room.host.college ? ` · ${room.host.college}` : ""}</span>
        </div>
      )}

      {room.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {room.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="neu-pill rounded-full px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
              {tag}
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => onJoin(room.id)}
        disabled={isFull}
        className="neu-btn mt-1 inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white disabled:opacity-40"
      >
        {isFull ? "Room Full" : room.is_private ? "Enter Password to Join" : "Join Room"}
      </button>
    </div>
  );
}
