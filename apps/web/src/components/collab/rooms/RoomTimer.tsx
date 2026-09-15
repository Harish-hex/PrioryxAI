"use client";

import { useEffect, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import type { RoomTimerState } from "@prioryxai/types";

const WORK_SECONDS = 45 * 60;
const BREAK_SECONDS = 10 * 60;

function formatTime(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function RoomTimer({
  roomId,
  isHost,
  timerState,
  onUpdate,
}: {
  roomId: string;
  isHost: boolean;
  timerState: RoomTimerState | null;
  onUpdate: (timer: RoomTimerState) => void;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsedSeconds = timerState?.startedAt && !timerState.isPaused
    ? Math.floor((now - new Date(timerState.startedAt).getTime()) / 1000)
    : 0;
  const remaining = timerState ? timerState.durationSeconds - elapsedSeconds : WORK_SECONDS;

  async function persist(timer: RoomTimerState) {
    onUpdate(timer);
    try {
      await fetch(`/api/collab/rooms/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionData: { timer } }),
      });
    } catch {
      // best-effort sync — local state already updated optimistically
    }
  }

  function start(mode: "work" | "break") {
    persist({
      mode,
      durationSeconds: mode === "work" ? WORK_SECONDS : BREAK_SECONDS,
      startedAt: new Date().toISOString(),
      isPaused: false,
    });
  }

  function pause() {
    if (!timerState) return;
    persist({ ...timerState, durationSeconds: Math.max(0, remaining), isPaused: true, startedAt: null });
  }

  function reset() {
    persist({ mode: "work", durationSeconds: WORK_SECONDS, startedAt: null, isPaused: true });
  }

  return (
    <div className="neu-card rounded-[24px] p-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {timerState?.mode === "break" ? "Break" : "Focus"} Timer
        </p>
        <p className="text-2xl font-black text-slate-950 dark:text-white tabular-nums">{formatTime(remaining)}</p>
      </div>
      {isHost && (
        <div className="flex items-center gap-1.5">
          {!timerState || timerState.isPaused ? (
            <button
              onClick={() => start(timerState?.mode ?? "work")}
              className="neu-btn flex h-9 w-9 items-center justify-center rounded-full text-emerald-600 dark:text-emerald-400"
              title="Start"
            >
              <Play size={14} />
            </button>
          ) : (
            <button
              onClick={pause}
              className="neu-btn flex h-9 w-9 items-center justify-center rounded-full text-amber-600 dark:text-amber-400"
              title="Pause"
            >
              <Pause size={14} />
            </button>
          )}
          <button onClick={reset} className="neu-btn flex h-9 w-9 items-center justify-center rounded-full text-slate-500 dark:text-slate-400" title="Reset">
            <RotateCcw size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
