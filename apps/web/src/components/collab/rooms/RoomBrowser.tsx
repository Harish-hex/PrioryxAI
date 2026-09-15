"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, X } from "lucide-react";
import { RoomCard, type RoomCardData } from "./RoomCard";

const TYPE_TABS = [
  { id: "all", label: "All" },
  { id: "dsa_sprint", label: "DSA" },
  { id: "project_review", label: "Project" },
  { id: "mock_interview", label: "Mock Interview" },
  { id: "accountability", label: "Accountability" },
];

export function RoomBrowser() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState("all");
  const [collegeOnly, setCollegeOnly] = useState(false);
  const [passwordPrompt, setPasswordPrompt] = useState<{ roomId: string } | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (activeType !== "all") params.set("type", activeType);
    if (collegeOnly) params.set("college", "only");
    fetch(`/api/collab/rooms?${params.toString()}`)
      .then((res) => res.json())
      .then((d) => setRooms(d?.rooms ?? []))
      .catch(() => setError("Failed to load rooms"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType, collegeOnly]);

  async function attemptJoin(roomId: string, password?: string) {
    setJoining(true);
    setJoinError(null);
    try {
      const res = await fetch(`/api/collab/rooms/${roomId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(password ? { password } : {}),
      });
      const data = await res.json();
      if (!res.ok) {
        setJoinError(data?.error ?? "Failed to join room");
        return;
      }
      router.push(`/career/collab/rooms/${roomId}`);
    } catch {
      setJoinError("Failed to join room");
    } finally {
      setJoining(false);
    }
  }

  function handleJoin(roomId: string) {
    const room = rooms.find((r) => r.id === roomId);
    if (room?.is_private) {
      setPasswordInput("");
      setJoinError(null);
      setPasswordPrompt({ roomId });
      return;
    }
    attemptJoin(roomId);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="neu-card rounded-[24px] p-2 flex items-center gap-2 overflow-x-auto">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveType(tab.id)}
              className={`shrink-0 rounded-2xl px-3.5 py-2 text-xs font-bold transition ${
                activeType === tab.id
                  ? "neu-inset text-slate-950 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setCollegeOnly((v) => !v)}
            className={`neu-pill rounded-full px-3.5 py-2 text-xs font-bold transition ${
              collegeOnly ? "text-cyan-600 dark:text-cyan-400" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {collegeOnly ? "My College Only" : "All Colleges"}
          </button>
          <Link
            href="/career/collab/rooms/new"
            className="neu-btn inline-flex items-center gap-1.5 rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          >
            <Plus size={14} />
            New Room
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="neu-card rounded-[24px] p-8 text-center text-sm text-rose-600 dark:text-rose-400">{error}</div>
      ) : rooms.length === 0 ? (
        <div className="neu-card rounded-[28px] p-10 text-center space-y-2">
          <p className="text-sm font-bold text-slate-950 dark:text-white">No active rooms right now</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Be the first to start one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} onJoin={handleJoin} />
          ))}
        </div>
      )}

      {passwordPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
          <div className="neu-card w-full max-w-sm rounded-[24px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-950 dark:text-white">This room is private</h3>
              <button onClick={() => setPasswordPrompt(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X size={16} />
              </button>
            </div>
            <input
              type="password"
              autoFocus
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Room password"
              className="neu-input w-full rounded-2xl px-4 py-2.5 text-sm outline-none"
            />
            {joinError && <p className="text-xs text-rose-600 dark:text-rose-400">{joinError}</p>}
            <button
              type="button"
              disabled={joining || !passwordInput}
              onClick={() => attemptJoin(passwordPrompt.roomId, passwordInput)}
              className="neu-btn w-full rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white dark:bg-white dark:text-slate-950 disabled:opacity-50"
            >
              {joining ? "Joining…" : "Join Room"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
