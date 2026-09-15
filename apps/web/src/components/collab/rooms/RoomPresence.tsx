"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Crown, Circle } from "lucide-react";
import type { RoomPresenceStatus } from "@prioryxai/types";

export interface PresenceMember {
  userId: string;
  displayName: string;
  role: "host" | "co_host" | "member";
  status: RoomPresenceStatus;
}

const STATUS_DOT: Record<RoomPresenceStatus, string> = {
  studying: "bg-emerald-500",
  away: "bg-amber-500",
  stuck: "bg-rose-500",
};

const STATUS_LABEL: Record<RoomPresenceStatus, string> = {
  studying: "Studying",
  away: "Away",
  stuck: "Stuck",
};

export function RoomPresence({
  members,
  currentUserId,
  isHost,
  onKick,
}: {
  members: PresenceMember[];
  currentUserId: string;
  isHost: boolean;
  onKick?: (userId: string) => void;
}) {
  return (
    <div className="neu-card rounded-[24px] p-4 space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        In this room ({members.length})
      </p>
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {members.map((m) => (
            <motion.div
              key={m.userId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2.5 rounded-2xl neu-inset px-3 py-2"
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[m.status] ?? STATUS_DOT.studying}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-950 dark:text-white truncate">
                    {m.displayName}
                    {m.userId === currentUserId ? " (You)" : ""}
                  </span>
                  {m.role === "host" && <Crown size={11} className="text-amber-500 shrink-0" />}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{STATUS_LABEL[m.status] ?? "Studying"}</span>
              </div>
              {isHost && m.userId !== currentUserId && onKick && (
                <button
                  onClick={() => onKick(m.userId)}
                  className="text-[10px] font-semibold text-rose-500 hover:text-rose-600 shrink-0"
                  title="Remove from room"
                >
                  Remove
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {members.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
            <Circle size={10} />
            No one else here yet
          </div>
        )}
      </div>
    </div>
  );
}
