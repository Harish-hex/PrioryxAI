"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Copy, Check } from "lucide-react";

const ROOM_TYPES = [
  { id: "open_study", label: "Open Study" },
  { id: "dsa_sprint", label: "DSA Sprint" },
  { id: "project_review", label: "Project Review" },
  { id: "mock_interview", label: "Mock Interview" },
  { id: "accountability", label: "Accountability" },
];

export function CreateRoomForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roomType, setRoomType] = useState("open_study");
  const [focusTopic, setFocusTopic] = useState("");
  const [maxMembers, setMaxMembers] = useState(6);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [collegeOnly, setCollegeOnly] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; code: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/collab/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          roomType,
          focusTopic: focusTopic || undefined,
          maxMembers,
          isPrivate,
          password: isPrivate ? password : undefined,
          collegeOnly,
          tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Failed to create room");
        return;
      }
      setCreated({ id: data.room.id, code: data.room.code });
    } catch {
      setError("Failed to create room");
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    const joinLink = typeof window !== "undefined" ? `${window.location.origin}/career/collab/rooms/${created.id}` : "";
    return (
      <div className="neu-card rounded-[28px] p-8 text-center space-y-5 max-w-md mx-auto">
        <div className="neu-pill-inset h-14 w-14 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto">
          <Check size={26} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">Room created</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Share the code or link to invite peers.</p>
        </div>
        <div className="neu-inset rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Room Code</p>
          <p className="text-2xl font-black tracking-[0.3em] text-slate-950 dark:text-white mt-1">{created.code}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(joinLink).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            });
          }}
          className="neu-btn w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Link Copied" : "Copy Join Link"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/career/collab/rooms/${created.id}`)}
          className="neu-btn w-full rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white dark:bg-white dark:text-slate-950"
        >
          Enter Room
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="neu-card rounded-[28px] p-6 sm:p-7 space-y-5 max-w-xl mx-auto">
      <div>
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Room name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Amrita CSE Graph Sprint"
          required
          minLength={3}
          className="neu-input mt-1.5 w-full rounded-2xl px-4 py-2.5 text-sm outline-none"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Room type</label>
        <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ROOM_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setRoomType(t.id)}
              className={`rounded-2xl px-3 py-2 text-xs font-bold transition ${
                roomType === t.id ? "neu-inset text-slate-950 dark:text-white" : "neu-pill text-slate-500 dark:text-slate-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Focus topic (optional)</label>
        <input
          value={focusTopic}
          onChange={(e) => setFocusTopic(e.target.value)}
          placeholder="e.g. Dynamic Programming, System Design"
          className="neu-input mt-1.5 w-full rounded-2xl px-4 py-2.5 text-sm outline-none"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Max members</label>
        <div className="mt-1.5 flex gap-2">
          {[2, 4, 6].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setMaxMembers(n)}
              className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
                maxMembers === n ? "neu-inset text-slate-950 dark:text-white" : "neu-pill text-slate-500 dark:text-slate-400"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between neu-inset rounded-2xl px-4 py-3">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Private room (requires password)</span>
        <button
          type="button"
          onClick={() => setIsPrivate((v) => !v)}
          className={`h-6 w-11 rounded-full transition-colors ${isPrivate ? "bg-cyan-500" : "bg-slate-300 dark:bg-white/10"}`}
        >
          <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${isPrivate ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>
      {isPrivate && (
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Room password"
          required={isPrivate}
          className="neu-input w-full rounded-2xl px-4 py-2.5 text-sm outline-none"
        />
      )}

      <div className="flex items-center justify-between neu-inset rounded-2xl px-4 py-3">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Limit to my college</span>
        <button
          type="button"
          onClick={() => setCollegeOnly((v) => !v)}
          className={`h-6 w-11 rounded-full transition-colors ${collegeOnly ? "bg-cyan-500" : "bg-slate-300 dark:bg-white/10"}`}
        >
          <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${collegeOnly ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tags (comma-separated)</label>
        <input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="graphs, medium difficulty, CSE final year"
          className="neu-input mt-1.5 w-full rounded-2xl px-4 py-2.5 text-sm outline-none"
        />
      </div>

      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !name}
        className="neu-btn w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-950 disabled:opacity-50"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
        {submitting ? "Creating…" : "Create Room"}
      </button>
    </form>
  );
}
