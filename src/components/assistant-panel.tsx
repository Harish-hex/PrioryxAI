"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, CornerDownLeft, Sparkles, UserRound, Wand2, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { typeStyles } from "@/components/task-styles";

const FREE_MSG_LIMIT = 3;
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
        setMessages((prev) => [...prev, { id: Date.now() + 1, role: "assistant", text: reply || "No response." }]);
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
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, text: accumulated } : m)));
          }
        }

        if (!started) {
          setMessages((prev) => [...prev, { id: assistantId, role: "assistant", text: "No response generated." }]);
        }
      }

      onMessageSent();
    } catch (err: any) {
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "assistant", text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    await send(draft.trim(), messages);
  }

  useEffect(() => {
    if (!initialTask || sentInitialRef.current) return;
    sentInitialRef.current = true;
    const prompt = buildTaskPrompt(initialTask);
    onTaskConsumed?.();
    setTimeout(() => send(prompt, INITIAL_MESSAGES), 150);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTask]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      {/* Chat panel */}
      <section className="glass-strong flex min-h-[500px] flex-col rounded-[28px] sm:min-h-[680px] sm:rounded-[32px]">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
                <Bot size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-950">Context-aware assistant</h2>
                <p className="mt-1 text-sm text-slate-500">Uses the current feed to keep plans grounded and brief.</p>
              </div>
            </div>
            {isPro ? (
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                <span className="flex items-center gap-1.5"><Sparkles size={13} /> Unlimited</span>
              </div>
            ) : (
              <div className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                msgsLeft === 0
                  ? "border-red-200 bg-red-50 text-red-600"
                  : msgsLeft === 1
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }`}>
                {msgsLeft}/{FREE_MSG_LIMIT} left today
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6" style={{ maxHeight: "clamp(300px, 55vh, 520px)" }}>
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
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900">
                    <Sparkles size={16} />
                  </div>
                )}
                {message.text === UPGRADE_SENTINEL ? (
                  <div className="w-full rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                      <Zap size={15} className="shrink-0 text-amber-500" />
                      You've used your {FREE_MSG_LIMIT} free messages today
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500">
                      Free plan: {FREE_MSG_LIMIT} AI messages/day. Pro gives you everything below — resets at midnight.
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {[
                        "Unlimited AI messages, no daily cap",
                        "Plan with AI on any high-priority task",
                        "Full task feed — all matches visible",
                        "Auto-scheduled focus blocks",
                        "Priority scoring (0–100) per task",
                        "10 timetable uploads/day",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-xs text-slate-600">
                          <Sparkles size={11} className="mt-0.5 shrink-0 text-slate-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={onOpenPricing}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      <Sparkles size={13} /> Upgrade to Pro — ₹59/month
                    </button>
                  </div>
                ) : (
                  <div
                    className={`max-w-[80%] rounded-[24px] px-4 py-3.5 text-sm leading-7 ${
                      message.role === "user"
                        ? "bg-slate-950 text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    {message.text}
                  </div>
                )}
                {message.role === "user" && (
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                    <UserRound size={16} />
                  </div>
                )}
              </motion.div>
            ))}
            {loading && (
              <motion.div
                key="loading"
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start gap-3"
                initial={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900">
                  <Sparkles size={16} />
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3.5">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        <div className="space-y-2 border-t border-slate-200 p-4 sm:p-5">
          {!isPro && msgsLeft === 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs">
              <span className="font-medium text-amber-700">1 message left today</span>
              <button type="button" onClick={onOpenPricing} className="font-semibold text-slate-700 underline-offset-2 hover:underline">
                Upgrade for unlimited →
              </button>
            </div>
          )}
          {!isPro && msgsLeft > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{messagesUsedToday} / {FREE_MSG_LIMIT} messages used today</span>
              <button
                type="button"
                onClick={onOpenPricing}
                className="rounded-2xl border border-slate-200 bg-white px-2 py-0.5 text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
              >
                Pro →
              </button>
            </div>
          )}
          <form onSubmit={sendMessage}>
            <div className="flex items-center gap-2 rounded-[24px] border border-slate-200 bg-slate-50 p-2.5 transition focus-within:border-slate-300 focus-within:bg-white">
              <Wand2 size={18} className="ml-2 shrink-0 text-slate-400" />
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={!isPro && msgsLeft === 0 ? "Upgrade to send more messages" : "Ask for a calm plan for the next 3 hours"}
                className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                disabled={loading || (!isPro && msgsLeft === 0)}
              />
              <button
                type="submit"
                disabled={loading || !draft.trim() || (!isPro && msgsLeft === 0)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-[18px] bg-slate-950 text-white transition hover:bg-slate-800 disabled:opacity-50"
                aria-label="Send message"
              >
                <CornerDownLeft size={17} />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Sidebar */}
      <aside className="space-y-6">
        <div className="glass rounded-[28px] p-5">
          <h3 className="text-xl font-semibold tracking-tight text-slate-950">Working memory</h3>
          {contextCards.length === 0 ? (
            <p className="mt-4 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-500">
              Add a task from the dashboard and the assistant will keep it in view here.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {contextCards.map((task) => (
                <div key={task.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs ${typeStyles[task.type] ?? "border border-slate-200 bg-white text-slate-600"}`}>
                      {task.type}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-950">{task.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{task.deadline ?? task.due_at ?? "No deadline"}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-[28px] p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Sparkles size={16} />
            Suggested prompts
          </div>
          <div className="mt-4 space-y-2">
            {[
              "Create a 2-hour plan that balances exam prep and assignment submission.",
              "Which task has the highest career impact this week?",
              "Suggest a study schedule for my exams this week.",
            ].map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setDraft(prompt)}
                className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm leading-6 text-slate-600 transition hover:border-slate-300 hover:bg-white"
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
