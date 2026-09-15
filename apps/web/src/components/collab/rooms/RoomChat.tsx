"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Code2 } from "lucide-react";
import { subscribeToTableChanges } from "@/lib/supabase/realtime";

export interface RoomChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  message_type: "text" | "code" | "link" | "problem" | "system";
  metadata: { language?: string; snippet?: string; url?: string; title?: string };
  created_at: string;
  display_name?: string;
}

export function RoomChat({
  roomId,
  currentUserId,
  initialMessages,
}: {
  roomId: string;
  currentUserId: string;
  initialMessages: RoomChatMessage[];
}) {
  const [messages, setMessages] = useState<RoomChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToTableChanges<RoomChatMessage>(
      "study_room_messages",
      `room_id=eq.${roomId}`,
      "INSERT",
      (row) => {
        setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
      }
    );
    return unsubscribe;
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setDraft("");
    try {
      const res = await fetch(`/api/collab/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]));
      }
    } catch {
      // best-effort — message just won't appear; user can retry
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="neu-card rounded-[24px] flex flex-col h-full min-h-[320px]">
      <div className="px-4 py-3 border-b border-slate-200/70 dark:border-white/10">
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Room Chat</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-h-0">
        {messages.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-6">No messages yet — say hi 👋</p>
        )}
        {messages.map((m) => {
          const isMe = m.user_id === currentUserId;
          if (m.message_type === "system") {
            return (
              <p key={m.id} className="text-center text-[10px] text-slate-400 italic">
                {m.content}
              </p>
            );
          }
          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${isMe ? "bg-cyan-500 text-white" : "neu-inset text-slate-900 dark:text-white"}`}>
                {!isMe && <p className="text-[10px] font-bold opacity-70 mb-0.5">{m.display_name ?? "Student"}</p>}
                {m.message_type === "code" ? (
                  <pre className="text-[11px] font-mono whitespace-pre-wrap overflow-x-auto">
                    <Code2 size={10} className="inline mr-1" />
                    {m.content}
                  </pre>
                ) : (
                  <p className="text-xs whitespace-pre-wrap break-words">{m.content}</p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="flex items-center gap-2 p-3 border-t border-slate-200/70 dark:border-white/10">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message the room…"
          className="neu-input flex-1 rounded-2xl px-3.5 py-2 text-xs outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="neu-btn shrink-0 flex h-9 w-9 items-center justify-center rounded-full text-cyan-600 dark:text-cyan-400 disabled:opacity-40"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
