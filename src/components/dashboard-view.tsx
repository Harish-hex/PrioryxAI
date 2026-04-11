"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Brain, Clock3, Flame, Plus, Sparkles, Target } from "lucide-react";
import { useState } from "react";
import { FocusSessionModal } from "@/components/focus-session-modal";
import { LoadingCard, LoadingLine } from "@/components/loading-skeletons";
import { priorityStyles, typeStyles } from "@/components/task-styles";

export interface Task {
  id: string;
  title: string;
  type: string;
  due_at: string | null;
  completed: boolean;
  weightage?: number | null;
  subject?: string | null;
  // UI-enriched fields
  priority?: string;
  deadline?: string;
  estimate?: string;
  reason?: string;
  action_label?: string;
  action_view?: string;
}

type EnrichedTask = Task & {
  priority: string;
  deadline: string;
  estimate: string;
  reason: string;
};

interface Stats {
  total_tasks: number;
  pending_tasks: number;
  completed_tasks: number;
  completed_this_week: number;
  overdue: number;
  github: { streak_days: number; health_score: number };
}

interface DashboardViewProps {
  loading: boolean;
  tasks: Task[];
  stats: Stats | null;
  onAddTask: (text: string) => void;
  onCompleteTask: (id: string) => void;
  onSnoozeTask: (id: string, hours: number) => void;
  onOpenAssistant: () => void;
  onOpenSettings: () => void;
  onOpenPricing: () => void;
}

function derivePriority(task: Task): string {
  if (!task.due_at) return "green";
  const hoursLeft = (new Date(task.due_at).getTime() - Date.now()) / 3_600_000;
  if (hoursLeft < 0) return "red"; // overdue
  if (hoursLeft < 24) return "red";
  if (hoursLeft < 72) return "amber";
  return "green";
}

function formatDeadline(due_at: string | null): string {
  if (!due_at) return "No deadline";
  const d = new Date(due_at);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffH = diffMs / 3_600_000;
  if (diffH < 0) return "Overdue";
  if (diffH < 24) return `Today, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (diffH < 48) return `Tomorrow, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export function DashboardView({
  loading,
  tasks,
  stats,
  onAddTask,
  onCompleteTask,
  onSnoozeTask,
  onOpenAssistant,
  onOpenSettings,
  onOpenPricing,
}: DashboardViewProps) {
  const [focusTask, setFocusTask] = useState<EnrichedTask | null>(null);

  // Enrich tasks with UI fields
  const enriched: EnrichedTask[] = tasks.map((t) => ({
    ...t,
    priority: t.priority ?? derivePriority(t),
    deadline: t.deadline ?? formatDeadline(t.due_at),
    estimate: t.estimate ?? "30 min",
    reason: t.reason ?? `${t.type} task`,
  }));

  const nextTask = enriched[0] ?? null;

  function completeFocusSession() {
    if (!focusTask) return;
    onCompleteTask(String(focusTask.id));
    setFocusTask(null);
  }

  function handleNextMoveAction() {
    if (!nextTask) return;
    if (nextTask.action_view === "settings") {
      onOpenSettings();
      return;
    }
    if (nextTask.action_view === "assistant") {
      onOpenAssistant();
      return;
    }
    setFocusTask(nextTask);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-5">
        <NextMoveCard
          loading={loading}
          task={nextTask}
          onPrimaryAction={handleNextMoveAction}
        />
        <TaskCaptureBar onAddTask={onAddTask} />
        <PriorityFeed
          loading={loading}
          tasks={enriched}
          onComplete={onCompleteTask}
          onSnooze={onSnoozeTask}
        />
      </section>

      <aside className="space-y-5">
        <StatsPanel stats={stats} loading={loading} />
        <FocusPanel onOpenPricing={onOpenPricing} stats={stats} />
        <InsightPanel nextTask={nextTask} />
      </aside>

      <FocusSessionModal
        onAskAssistant={() => {
          setFocusTask(null);
          onOpenAssistant();
        }}
        onClose={() => setFocusTask(null)}
        onComplete={completeFocusSession}
        task={focusTask}
      />
    </div>
  );
}

function NextMoveCard({
  loading,
  onPrimaryAction,
  task,
}: {
  loading: boolean;
  onPrimaryAction: () => void;
  task: any;
}) {
  const actionLabel = task?.action_label ?? "Start focus session";
  const modeLabel = task?.action_view ? "Guided setup" : "Deep work";

  return (
    <div className="sticky top-28 z-20 rounded-lg accent-border p-px shadow-glow">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-[7px] p-5 sm:p-6"
        initial={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.32 }}
        whileHover={{ scale: 1.006 }}
      >
        {loading ? (
          <div className="space-y-5">
            <LoadingLine className="h-5 w-36" />
            <LoadingLine className="h-9 w-4/5" />
            <LoadingLine className="h-4 w-2/3" />
            <div className="grid gap-3 sm:grid-cols-3">
              <LoadingLine className="h-16" />
              <LoadingLine className="h-16" />
              <LoadingLine className="h-16" />
            </div>
          </div>
        ) : task ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.07] px-3 py-1.5 text-sm text-neutral-300">
                <Sparkles size={15} className="text-volt" />
                Next Move Card
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-mint/20 bg-mint/10 px-3 py-1.5 text-sm text-mint">
                <Flame size={15} />
                AI ranked
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_230px]">
              <div>
                <p className="text-sm text-neutral-400">Do this next</p>
                <h2 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-4xl">{task.title}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">{task.reason}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <Stat icon={Clock3} label="Deadline" value={task.deadline} />
                <Stat icon={Target} label="Focus block" value={task.estimate} />
                <Stat icon={Brain} label="Mode" value={modeLabel} />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-lg px-3 py-1.5 text-sm ${priorityStyles[task.priority]?.pill ?? ""}`}>
                  {priorityStyles[task.priority]?.label ?? task.priority}
                </span>
                <span className={`rounded-lg px-3 py-1.5 text-sm ${typeStyles[task.type] ?? "border border-white/10 bg-white/[0.06] text-neutral-200"}`}>
                  {task.type}
                </span>
              </div>
              <button
                type="button"
                onClick={onPrimaryAction}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.02] hover:bg-neutral-100"
              >
                {actionLabel}
                <ArrowUpRight size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="py-3">
            <div className="inline-flex items-center gap-2 rounded-lg border border-mint/20 bg-mint/10 px-3 py-1.5 text-sm text-mint">
              <Sparkles size={15} />
              All clear
            </div>
            <h2 className="mt-5 text-3xl font-semibold leading-tight text-white sm:text-4xl">Your priority feed is empty.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
              Add a task in plain English and DeadlineOS will rank the next move.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <Icon size={14} />
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function PriorityFeed({
  loading,
  tasks,
  onComplete,
  onSnooze,
}: {
  loading: boolean;
  tasks: any[];
  onComplete: (id: string) => void;
  onSnooze: (id: string, hours: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Priority Feed</h2>
          <p className="mt-1 text-sm text-neutral-500">Sorted by urgency, effort, and career impact.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
      ) : tasks.length ? (
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <motion.article
              key={task.id}
              animate={{ opacity: 1, y: 0 }}
              className="glass group rounded-lg p-4 transition hover:border-white/20 hover:bg-white/[0.075] hover:shadow-glow"
              initial={{ opacity: 0, y: 8 }}
              transition={{ delay: index * 0.035, duration: 0.25 }}
              whileHover={{ scale: 1.006 }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${priorityStyles[task.priority]?.dot ?? "bg-neutral-500"}`} />
                    <span className="text-xs text-neutral-500">#{String(index + 1).padStart(2, "0")}</span>
                    <span className={`rounded-lg px-2.5 py-1 text-xs ${typeStyles[task.type] ?? "border border-white/10 bg-white/[0.06] text-neutral-200"}`}>
                      {task.type}
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-white">{task.title}</h3>
                  <p className="mt-1 text-sm text-neutral-500">{task.reason}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2 sm:block sm:text-right">
                  <p className="text-sm font-medium text-neutral-200">{task.deadline}</p>
                  <div className="mt-2 flex gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => onSnooze(task.id, 2)}
                      className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-neutral-400 hover:text-white transition"
                    >
                      +2h
                    </button>
                    <button
                      type="button"
                      onClick={() => onComplete(task.id)}
                      className="rounded-lg border border-mint/20 bg-mint/10 px-2.5 py-1 text-xs text-mint hover:bg-mint/20 transition"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      ) : (
        <div className="glass rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-white">No active tasks</h3>
          <p className="mt-2 text-sm text-neutral-500">Capture your next deadline or idea above.</p>
        </div>
      )}
    </div>
  );
}

function TaskCaptureBar({ onAddTask }: { onAddTask: (text: string) => void }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = value.trim();
    if (!text) return;
    setLoading(true);
    await onAddTask(text);
    setValue("");
    setLoading(false);
  }

  return (
    <motion.form
      onSubmit={submit}
      className="rounded-lg accent-border p-px shadow-glow"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.24 }}
    >
      <div className="flex flex-col gap-3 rounded-[7px] border border-white/10 bg-black/75 p-3 backdrop-blur-2xl sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.045] px-3 transition focus-within:border-volt/50 focus-within:shadow-[0_0_0_4px_rgba(40,215,255,0.08)]">
          <Plus className="shrink-0 text-volt" size={18} />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder='Add task — e.g. "Submit DBMS assignment tonight"'
            className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-neutral-500"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.02] hover:bg-neutral-100 disabled:opacity-50"
        >
          {loading ? "Adding…" : "Add"}
        </button>
      </div>
    </motion.form>
  );
}

function StatsPanel({ stats, loading }: { stats: Stats | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="glass rounded-lg p-4">
        <LoadingLine className="h-5 w-44" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <LoadingLine className="h-16" />
          <LoadingLine className="h-16" />
          <LoadingLine className="h-16" />
          <LoadingLine className="h-16" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const items = [
    { label: "Pending", value: stats.pending_tasks },
    { label: "Done this week", value: stats.completed_this_week },
    { label: "Overdue", value: stats.overdue },
    { label: "GitHub streak", value: `${stats.github.streak_days}d` },
  ];

  return (
    <div className="glass rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white">This week</h3>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {items.map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-neutral-500">{label}</p>
            <p className="mt-1 text-xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FocusPanel({ onOpenPricing, stats }: { onOpenPricing: () => void; stats: Stats | null }) {
  const healthScore = stats?.github.health_score ?? 0;
  return (
    <motion.div className="glass rounded-lg p-4" whileHover={{ scale: 1.01 }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">GitHub health</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{healthScore}/100</h3>
        </div>
        <div className="rounded-lg border border-volt/20 bg-volt/10 p-2 text-volt">
          <Target size={19} />
        </div>
      </div>
      <div className="mt-5 h-2 rounded-full bg-white/10">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-aura via-volt to-mint transition-[width] duration-700"
          style={{ width: `${healthScore}%` }}
        />
      </div>
      <button
        type="button"
        onClick={onOpenPricing}
        className="mt-5 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.1]"
      >
        Unlock auto-scheduling
      </button>
    </motion.div>
  );
}

function InsightPanel({ nextTask }: { nextTask: any }) {
  return (
    <div className="glass rounded-lg p-4">
      <div className="flex items-center gap-2 text-sm text-neutral-400">
        <Sparkles size={16} className="text-mint" />
        AI insight
      </div>
      <p className="mt-3 text-sm leading-6 text-neutral-300">
        {nextTask
          ? `Your highest-leverage move is "${nextTask.title}". Tackle it in a single deep-work block before context-switching.`
          : "Add tasks to get AI-ranked insights on your next best move."}
      </p>
    </div>
  );
}
