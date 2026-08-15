"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, Briefcase, Check, Clock3, GraduationCap, Plus, UserRound, Wand2, Zap } from "lucide-react";
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

const QUICK_ACTIONS = [
  {
    title: "Plan next 3 focus hours",
    prompt: "Create an intense 3-hour focus plan prioritizing my most urgent deadlines with 5-minute buffer breaks.",
    icon: Clock3,
  },
  {
    title: "Exam revision breakdown",
    prompt: "Give me an active-recall study checklist for my upcoming exams. Chunk them by difficulty.",
    icon: GraduationCap,
  },
  {
    title: "Internship prep & pitch",
    prompt: "Review my top internship matches and draft a concise cold email pitch highlighting my core projects.",
    icon: Briefcase,
  },
  {
    title: "Clear backlog & prioritize",
    prompt: "Analyze my pending assignments and tell me exactly what to tackle first and what to safely defer.",
    icon: Zap,
  },
];

export function AssistantPanel({ tasks, isPro, messagesUsedToday, initialTask, onTaskConsumed, onMessageSent, onOpenPricing }: AssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentInitialRef = useRef(false);
  const quickMenuRef = useRef<HTMLDivElement>(null);

  const contextCards = useMemo(() => tasks.slice(0, 3), [tasks]);
  const msgsLeft = Math.max(0, FREE_MSG_LIMIT - messagesUsedToday);

  // Close quick menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (quickMenuRef.current && !quickMenuRef.current.contains(e.target as Node)) {
        setShowQuickPrompts(false);
      }
    }
    if (showQuickPrompts) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showQuickPrompts]);

  async function send(text: string, currentMessages: Message[]) {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: Date.now(), role: "user", text };
    const updatedMessages = [...currentMessages, userMsg];
    setMessages(updatedMessages);
    setDraft("");
    setShowQuickPrompts(false);
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
      <section className="glass-strong flex min-h-[420px] flex-col rounded-[28px] sm:min-h-[600px] sm:rounded-[32px]">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6 dark:border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400">
                <Bot size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">Context-aware assistant</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Uses the current feed to keep plans grounded and brief.</p>
              </div>
            </div>
            {isPro ? (
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                <span className="flex items-center gap-1.5">Unlimited</span>
              </div>
            ) : (
              <div className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                msgsLeft === 0
                  ? "border-red-200 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                  : msgsLeft === 1
                  ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
                  : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              }`}>
                {msgsLeft}/{FREE_MSG_LIMIT} left today
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6" style={{ maxHeight: "clamp(240px, 45vh, 520px)" }}>
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
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white">
                    <Bot size={16} />
                  </div>
                )}
                {message.text === UPGRADE_SENTINEL ? (
                  <div className="w-full rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
                      <Zap size={15} className="shrink-0 text-amber-500" />
                      You've used your {FREE_MSG_LIMIT} free messages today
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
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
                        <li key={item} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <Check size={11} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={onOpenPricing}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                    >
                      Upgrade to Pro — ₹59/month
                    </button>
                  </div>
                ) : (
                  <div
                    className={`max-w-[80%] rounded-[24px] px-4 py-3.5 text-sm leading-7 ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-[0_4px_16px_rgba(14,165,233,0.3)] dark:from-sky-500 dark:to-cyan-500"
                        : "border border-slate-200 bg-white/90 text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                    }`}
                  >
                    {message.text}
                  </div>
                )}
                {message.role === "user" && (
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-900 dark:bg-cyan-500/20 dark:text-cyan-300">
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
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white">
                  <Bot size={16} />
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white/90 px-4 py-3.5 dark:border-white/10 dark:bg-white/5">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Futuristic Glassmorphism Prompt Input Bar */}
        <div className="space-y-3 border-t border-slate-200/80 p-4 sm:p-5 dark:border-white/10">
          {!isPro && msgsLeft === 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs dark:border-amber-500/20 dark:bg-amber-500/10">
              <span className="font-medium text-amber-700 dark:text-amber-400">1 message left today</span>
              <button type="button" onClick={onOpenPricing} className="font-semibold text-slate-700 underline-offset-2 hover:underline dark:text-slate-200">
                Upgrade for unlimited →
              </button>
            </div>
          )}
          {!isPro && msgsLeft > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{messagesUsedToday} / {FREE_MSG_LIMIT} messages used today</span>
              <button
                type="button"
                onClick={onOpenPricing}
                className="rounded-2xl border border-slate-200 bg-white px-2 py-0.5 text-slate-500 transition hover:border-slate-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              >
                Pro →
              </button>
            </div>
          )}

          <form onSubmit={sendMessage} className="relative">
            <div className="relative flex items-center gap-2.5 rounded-full border border-cyan-200/60 bg-gradient-to-r from-sky-50/60 via-white/80 to-sky-50/60 p-2 shadow-[0_8px_32px_rgba(56,189,248,0.18),inset_0_1px_2px_rgba(255,255,255,0.9)] backdrop-blur-2xl transition-all duration-300 focus-within:border-cyan-400 focus-within:shadow-[0_0_35px_rgba(56,189,248,0.38),inset_0_1px_2px_rgba(255,255,255,1)] dark:border-white/15 dark:bg-gradient-to-r dark:from-slate-900/90 dark:via-cyan-950/40 dark:to-slate-900/90 dark:shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] dark:focus-within:border-cyan-400/70 dark:focus-within:shadow-[0_0_35px_rgba(6,182,212,0.35)]">
              {/* Left Circular + Glass Lens Button */}
              <div ref={quickMenuRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowQuickPrompts((prev) => !prev)}
                  className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/70 text-cyan-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),0_2px_10px_rgba(56,189,248,0.2)] backdrop-blur-xl transition-all duration-200 hover:scale-105 hover:bg-white active:scale-95 dark:border-white/20 dark:bg-white/10 dark:text-cyan-300 dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_2px_10px_rgba(0,0,0,0.4)] dark:hover:bg-white/15"
                  aria-label="Quick AI prompt options"
                  title="Quick prompt templates"
                >
                  <Plus size={20} className={`stroke-[2.5] transition-transform duration-200 ${showQuickPrompts ? "rotate-45" : ""}`} />
                </button>

                {/* Quick prompt popover */}
                <AnimatePresence>
                  {showQuickPrompts && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full left-0 z-50 mb-3 w-72 overflow-hidden rounded-[24px] border border-white/80 bg-white/95 p-2 shadow-[0_20px_50px_rgba(15,23,42,0.18)] backdrop-blur-2xl dark:border-white/15 dark:bg-slate-900/95 dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
                    >
                      <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-400">Quick AI Actions</p>
                      {QUICK_ACTIONS.map((action) => (
                        <button
                          key={action.title}
                          type="button"
                          onClick={() => {
                            setDraft(action.prompt);
                            setShowQuickPrompts(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-xs font-medium text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-cyan-300"
                        >
                          <action.icon size={14} className="shrink-0 text-cyan-500" />
                          <span>{action.title}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Center Input Field */}
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={!isPro && msgsLeft === 0 ? "Upgrade to send more messages" : "Enter your prompt..."}
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[15px] font-medium text-slate-900 outline-none placeholder:text-slate-400/90 dark:text-white dark:placeholder:text-slate-400/80"
                disabled={loading || (!isPro && msgsLeft === 0)}
              />

              {/* Right Glowing SEND Button */}
              <button
                type="submit"
                disabled={loading || !draft.trim() || (!isPro && msgsLeft === 0)}
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#38bdf8] via-[#00d2ff] to-[#38bdf8] bg-[length:200%_auto] px-7 py-3 text-xs font-black italic tracking-widest text-white shadow-[0_0_24px_rgba(56,189,248,0.7),0_2px_8px_rgba(14,165,233,0.4)] transition-all duration-300 hover:scale-[1.03] hover:bg-right hover:shadow-[0_0_36px_rgba(56,189,248,0.95)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                aria-label="Send prompt"
              >
                <span className="relative z-10 flex items-center gap-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">
                  {loading ? (
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    "SEND"
                  )}
                </span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Sidebar */}
      <aside className="space-y-6">
        <div className="glass rounded-[28px] p-5">
          <h3 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">Working memory</h3>
          {contextCards.length === 0 ? (
            <p className="mt-4 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              Add a task from the dashboard and the assistant will keep it in view here.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {contextCards.map((task) => (
                <div key={task.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs ${typeStyles[task.type] ?? "border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"}`}>
                      {task.type}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-950 dark:text-white">{task.title}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{task.deadline ?? task.due_at ?? "No deadline"}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-[28px] p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Wand2 size={16} />
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
                className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm leading-6 text-slate-600 transition hover:border-cyan-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-cyan-500/40 dark:hover:bg-white/10"
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
