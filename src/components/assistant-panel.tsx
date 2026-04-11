"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, CornerDownLeft, Sparkles, UserRound, Wand2, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { typeStyles } from "@/components/task-styles";

const FREE_MSG_LIMIT = 5;
const UPGRADE_SENTINEL = "__UPGRADE_PROMPT__";

interface Task {
  id: string;
  title: string;
  type: string;
  due_at?: string | null;
  deadline?: string;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
}

interface AssistantPanelProps {
  tasks: Task[];
  isPro: boolean;
  messagesUsedToday: number;
  initialTask?: Task | null;
  onTaskConsumed?: () => void;
  onMessageSent: () => void;
  onOpenPricing: () => void;
}

function buildTaskPrompt(task: Task): string {
  const deadline = task.deadline ?? (task.due_at ? new Date(task.due_at).toLocaleDateString("en-IN") : null);
  const deadlineStr = deadline ? `, deadline: ${deadline}` : "";

  if (task.type === "job") {
    const [role, company] = task.title.includes(" @ ")
      ? task.title.split(" @ ", 2)
      : [task.title, null];
    return `I need to apply to: ${role}${company ? ` at ${company}` : ""}${deadlineStr}. What's the single highest-leverage thing I can do in the next 2 hours to maximise my chances? Be specific.`;
  }
  if (task.type === "exam") {
    return `I have an exam: "${task.title}"${deadlineStr}. Give me a concrete study plan I can start in the next 30 minutes — exact topics, exact order, exact time per block.`;
  }
  if (task.type === "assignment") {
    return `I need to complete: "${task.title}"${deadlineStr}. Break it into specific steps with time estimates. What do I do first, right now?`;
  }
  return `My top priority is: "${task.title}"${deadlineStr}. Give me an exact action plan for the next 2 hours. No vague advice.`;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    role: "assistant",
    text: "Hi! I can see your tasks and deadlines. Ask me to help you plan your day, prioritize tasks, draft emails, or anything else.",
  },
];

export function AssistantPanel({ tasks, isPro, messagesUsedToday, initialTask, onTaskConsumed, onMessageSent, onOpenPricing }: AssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentInitialRef = useRef(false);

  const contextCards = useMemo(() => tasks.slice(0, 3), [tasks]);
  const msgsLeft = Math.max(0, FREE_MSG_LIMIT - messagesUsedToday);
  const nearLimit = !isPro && messagesUsedToday >= FREE_MSG_LIMIT - 1;

  // Core send function — accepts text directly so it can be called programmatically
  async function send(text: string, currentMessages: Message[]) {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: Date.now(), role: "user", text };
    const updatedMessages = [...currentMessages, userMsg];
    setMessages(updatedMessages);
    setDraft("");
    setLoading(true);

    const history = currentMessages
      .filter((m) => m.id !== 1 && m.text !== UPGRADE_SENTINEL)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.text }));

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 403 && body.upgrade) {
          setMessages((prev) => [...prev, { id: Date.now() + 1, role: "assistant", text: UPGRADE_SENTINEL }]);
        } else {
          throw new Error(body.error ?? "Assistant error");
        }
        return;
      }

      if (!res.body) {
        const reply = await res.text();
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, role: "assistant", text: reply || "No response." },
        ]);
      } else {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const assistantId = Date.now() + 1;
        let accumulated = "";
        let started = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          accumulated += decoder.decode(value, { stream: true });
          if (!started) {
            started = true;
            setMessages((prev) => [...prev, { id: assistantId, role: "assistant", text: accumulated }]);
          } else {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, text: accumulated } : m))
            );
          }
        }

        if (!started) {
          setMessages((prev) => [
            ...prev,
            { id: assistantId, role: "assistant", text: "No response generated." },
          ]);
        }
      }

      onMessageSent();
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", text: `Error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    await send(draft.trim(), messages);
  }

  // Auto-fire prompt when arriving from "Plan with AI" on a specific task
  useEffect(() => {
    if (!initialTask || sentInitialRef.current) return;
    sentInitialRef.current = true;
    const prompt = buildTaskPrompt(initialTask);
    onTaskConsumed?.();
    // Small delay so the panel renders first
    setTimeout(() => send(prompt, INITIAL_MESSAGES), 150);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTask]);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="glass-strong flex min-h-[690px] flex-col rounded-lg">
        <div className="border-b border-white/10 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-volt/20 bg-volt/10 p-2 text-volt">
                <Bot size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Context-aware assistant</h2>
                <p className="text-sm text-neutral-500">Reading deadlines, career goals, and study load.</p>
              </div>
            </div>
            <div className="rounded-lg border border-mint/20 bg-mint/10 px-3 py-1.5 text-sm text-mint">Live context</div>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5" style={{ maxHeight: "520px" }}>
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                initial={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                {message.role === "assistant" && message.text !== UPGRADE_SENTINEL && (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-volt">
                    <Sparkles size={16} />
                  </div>
                )}
                {message.text === UPGRADE_SENTINEL ? (
                  <div className="w-full rounded-lg border border-aura/20 bg-aura/10 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-violet-200">
                      <Zap size={15} /> Daily message limit reached
                    </div>
                    <p className="mt-1 text-xs text-neutral-400">Free plan includes {FREE_MSG_LIMIT} messages/day. Upgrade to Pro for unlimited access.</p>
                    <button
                      type="button"
                      onClick={onOpenPricing}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:scale-[1.02]"
                    >
                      <Sparkles size={12} /> Upgrade to Pro
                    </button>
                  </div>
                ) : (
                  <div
                    className={`max-w-[78%] rounded-lg px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "bg-white text-black"
                        : "border border-white/10 bg-black/35 text-neutral-200"
                    }`}
                  >
                    {message.text}
                  </div>
                )}
                {message.role === "user" && (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-black">
                    <UserRound size={16} />
                  </div>
                )}
              </motion.div>
            ))}
            {loading && (
              <motion.div
                key="loading"
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-start"
                initial={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-volt">
                  <Sparkles size={16} />
                </div>
                <div className="rounded-lg border border-white/10 bg-black/35 px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-white/10 p-4 space-y-2">
          {/* 1 message left — amber urgent nudge */}
          {!isPro && msgsLeft === 1 && (
            <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs">
              <span className="font-medium text-amber-300">1 message left today</span>
              <button type="button" onClick={onOpenPricing} className="font-semibold text-volt underline-offset-2 hover:underline">
                Upgrade for unlimited →
              </button>
            </div>
          )}
          {/* Regular counter when not at limit */}
          {!isPro && msgsLeft > 1 && (
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>{messagesUsedToday} / {FREE_MSG_LIMIT} messages used today</span>
              <button type="button" onClick={onOpenPricing} className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-neutral-500 hover:text-neutral-300 transition">
                Context: {Math.min(tasks.length, 3)} tasks · GitHub hidden · <span className="text-volt">Pro →</span>
              </button>
            </div>
          )}
          <form onSubmit={sendMessage}>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 p-2 transition focus-within:border-volt/50 focus-within:shadow-[0_0_0_4px_rgba(40,215,255,0.09)]">
              <Wand2 size={18} className="ml-2 shrink-0 text-volt" />
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={!isPro && msgsLeft === 0 ? "Upgrade to send more messages" : "Ask how to plan the next 3 hours"}
                className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm text-white outline-none placeholder:text-neutral-500"
                disabled={loading || (!isPro && msgsLeft === 0)}
              />
              <button
                type="submit"
                disabled={loading || !draft.trim() || (!isPro && msgsLeft === 0)}
                className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-black transition hover:scale-[1.02] disabled:opacity-50"
                aria-label="Send message"
              >
                <CornerDownLeft size={17} />
              </button>
            </div>
          </form>
        </div>
      </section>

      <aside className="space-y-5">
        <div className="glass rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white">Working memory</h3>
          {contextCards.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">No tasks yet. Add some to give the assistant context.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {contextCards.map((task) => (
                <div key={task.id} className="rounded-lg border border-white/10 bg-black/25 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-lg px-2.5 py-1 text-xs ${typeStyles[task.type] ?? "border border-white/10 bg-white/[0.06] text-neutral-200"}`}>
                      {task.type}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-white">{task.title}</p>
                  <p className="mt-1 text-xs text-neutral-500">{task.deadline ?? task.due_at ?? "No deadline"}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white">Suggested prompts</h3>
          <div className="mt-3 space-y-2">
            {[
              "Create a 2-hour plan that balances exam prep and assignment submission.",
              "Which task has the highest career impact this week?",
              "Suggest a study schedule for my exams this week.",
            ].map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setDraft(prompt)}
                className="w-full rounded-lg border border-white/10 bg-black/25 p-3 text-left text-xs text-neutral-300 transition hover:border-white/20 hover:bg-black/35"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
