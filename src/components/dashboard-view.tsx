"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Banknote, BookOpen, Brain, Briefcase, ChevronRight, Clock3, Code2, GitBranch, Lock, MapPin, Plus, Settings, Sparkles, Target, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
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
  external_url?: string | null;
  stipend?: string | null;
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

interface HiddenPreview {
  count: number;
  topJobTitle: string | null;
  breakdown: string | null;
}

interface DashboardViewProps {
  loading: boolean;
  tasks: Task[];
  setupItems?: any[];
  stats: Stats | null;
  isPro: boolean;
  hasMore: boolean;
  totalCount?: number;
  hiddenPreview?: HiddenPreview | null;
  onAddTask: (text: string) => void;
  onCompleteTask: (id: string) => void;
  onSnoozeTask: (id: string, hours: number) => void;
  onOpenAssistant: (task?: Task | null) => void;
  onOpenSettings: () => void;
  onOpenPricing: () => void;
}

function derivePriority(task: Task): string {
  if (!task.due_at) return "green";
  const hoursLeft = (new Date(task.due_at).getTime() - Date.now()) / 3_600_000;
  if (hoursLeft < 0) return "red";
  if (hoursLeft < 24) return "red";
  if (hoursLeft < 72) return "amber";
  return "green";
}

function formatDeadline(due_at: string | null): string {
  if (!due_at) return "No deadline";
  const d = new Date(due_at);
  const now = new Date();
  const diffH = (d.getTime() - now.getTime()) / 3_600_000;
  if (diffH < 0) return "Overdue";
  if (diffH < 24) return `Today, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (diffH < 48) return `Tomorrow, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export function DashboardView({
  loading,
  tasks,
  setupItems = [],
  stats,
  isPro,
  hasMore,
  totalCount,
  hiddenPreview,
  onAddTask,
  onCompleteTask,
  onSnoozeTask,
  onOpenAssistant,
  onOpenSettings,
  onOpenPricing,
}: DashboardViewProps) {
  const [focusTask, setFocusTask] = useState<EnrichedTask | null>(null);
  const [dismissedSetup, setDismissedSetup] = useState<Set<string>>(new Set());

  const enriched: EnrichedTask[] = tasks.map((t) => ({
    ...t,
    priority: t.priority ?? derivePriority(t),
    deadline: t.deadline ?? formatDeadline(t.due_at),
    estimate: t.estimate ?? "30 min",
    reason: t.reason ?? `${t.type} task`,
  }));

  const nextTask = enriched[0] ?? null;
  const visibleSetup = setupItems.filter((s) => !dismissedSetup.has(s.id));

  function completeFocusSession() {
    if (!focusTask) return;
    onCompleteTask(String(focusTask.id));
    setFocusTask(null);
  }

  function handleNextMoveAction() {
    if (!nextTask) return;
    if (nextTask.action_view === "settings") { onOpenSettings(); return; }
    onOpenAssistant(nextTask);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="space-y-6">
        <NextMoveCard
          loading={loading}
          task={nextTask}
          isPro={isPro}
          onPrimaryAction={handleNextMoveAction}
          onOpenPricing={onOpenPricing}
        />

        {!loading && visibleSetup.length > 0 && (
          <SetupStrip
            items={visibleSetup}
            isPro={isPro}
            onDismiss={(id) => setDismissedSetup((prev) => { const next = new Set(prev); next.add(id); return next; })}
            onOpenSettings={onOpenSettings}
            onOpenPricing={onOpenPricing}
          />
        )}

        <TaskCaptureBar onAddTask={onAddTask} />

        <PriorityFeed
          loading={loading}
          tasks={enriched}
          isPro={isPro}
          hasMore={hasMore}
          totalCount={totalCount}
          hiddenPreview={hiddenPreview}
          onComplete={onCompleteTask}
          onSnooze={onSnoozeTask}
          onOpenPricing={onOpenPricing}
        />
      </section>

      <aside className="space-y-6">
        <StatsPanel stats={stats} loading={loading} isPro={isPro} onOpenPricing={onOpenPricing} />
        <ProjectIdeasPanel isPro={isPro} onOpenPricing={onOpenPricing} />
        <FocusPanel onOpenPricing={onOpenPricing} stats={stats} isPro={isPro} />
        <InsightPanel nextTask={nextTask} />
      </aside>

      <FocusSessionModal
        onAskAssistant={() => { setFocusTask(null); onOpenAssistant(); }}
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
  onOpenPricing,
  task,
  isPro,
}: {
  loading: boolean;
  onPrimaryAction: () => void;
  onOpenPricing: () => void;
  task: any;
  isPro: boolean;
}) {
  const isSetupAction = task?.action_view === "settings";
  const actionLabel = isSetupAction ? (task?.action_label ?? "Open settings") : "Plan with AI";
  const modeLabel = isSetupAction ? "Guided setup" : "Deep work";

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-[32px] p-6 sm:p-8"
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.3 }}
    >
      {loading ? (
        <div className="space-y-5">
          <LoadingLine className="h-5 w-40" />
          <LoadingLine className="h-10 w-4/5" />
          <LoadingLine className="h-4 w-2/3" />
          <div className="grid gap-3 sm:grid-cols-3">
            <LoadingLine className="h-20" />
            <LoadingLine className="h-20" />
            <LoadingLine className="h-20" />
          </div>
        </div>
      ) : task ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600">
              <Sparkles size={15} className="text-slate-700" />
              {isSetupAction ? "Setup step" : "Next priority"}
            </span>
            <span className={`rounded-full px-3 py-1.5 text-sm ${priorityStyles[task.priority]?.pill ?? "border border-slate-200 bg-slate-50 text-slate-600"}`}>
              {priorityStyles[task.priority]?.label ?? task.priority}
            </span>
          </div>

          {task.type === "job" ? (
            <>
              <div className="mt-7">
                {(() => {
                  const [role, company] = task.title.includes(" @ ")
                    ? task.title.split(" @ ", 2)
                    : [task.title, null];
                  const skills: string[] = task.subject
                    ? task.subject.split(",").map((s: string) => s.trim()).filter(Boolean)
                    : [];
                  return (
                    <>
                      <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-400">Top internship match</p>
                      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{role}</h2>
                      {company && (
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                          <MapPin size={14} /> {company}
                        </p>
                      )}
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">{task.reason}</p>
                      {skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {skills.map((s) => (
                            <span key={s} className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                              {s} ✓
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="mt-7 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  {task.stipend && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                      <Banknote size={14} /> {task.stipend}
                    </span>
                  )}
                  {task.deadline && task.deadline !== "No deadline" && (
                    <span className="text-sm text-slate-500">Apply by {task.deadline}</span>
                  )}
                </div>
                {task.external_url ? (
                  <a
                    href={task.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Apply on Internshala <ArrowUpRight size={16} />
                  </a>
                ) : (
                  <a
                    href="https://internshala.com/internships"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Browse Internshala <ArrowUpRight size={16} />
                  </a>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-400">Do this next</p>
                  <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                    {task.title}
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">{task.reason}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  <InfoTile icon={Clock3} label="Deadline" value={task.deadline} />
                  <InfoTile icon={Target} label="Focus block" value={task.estimate} />
                  <InfoTile icon={Brain} label="Mode" value={modeLabel} />
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1.5 text-sm ${typeStyles[task.type] ?? "border border-slate-200 bg-slate-50 text-slate-600"}`}>
                    {task.type}
                  </span>
                </div>
                {!isSetupAction && !isPro ? (
                  <button
                    type="button"
                    onClick={onOpenPricing}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <Lock size={14} /> Plan with AI · Pro
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onPrimaryAction}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {actionLabel}
                    <ArrowUpRight size={16} />
                  </button>
                )}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="py-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
            <Sparkles size={15} />
            All clear
          </span>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Nothing ranked yet.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Type a task below — &quot;DBMS exam Friday&quot;, &quot;ML assignment due Sunday&quot;, &quot;apply to internship by Thursday&quot; — and PrioryxAI will rank it and tell you exactly what to do first.
          </p>
        </div>
      )}
    </motion.div>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
        <Icon size={14} />
        {label}
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function PriorityFeed({
  loading,
  tasks,
  isPro,
  hasMore,
  totalCount,
  hiddenPreview,
  onComplete,
  onSnooze,
  onOpenPricing,
}: {
  loading: boolean;
  tasks: any[];
  isPro: boolean;
  hasMore: boolean;
  totalCount?: number;
  hiddenPreview?: HiddenPreview | null;
  onComplete: (id: string) => void;
  onSnooze: (id: string, hours: number) => void;
  onOpenPricing: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"priority" | "all">("priority");

  const priorityTasks = tasks.filter(
    (t) => t.priority === "red" || t.priority === "amber" || (!t.due_at && (t.score ?? 0) >= 110)
  );
  const allTasks = tasks.filter(
    (t) => t.priority === "green" && (t.score ?? 0) < 110
  );
  const displayed = activeTab === "priority" ? priorityTasks : allTasks;

  return (
    <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Priority feed</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Ordered by urgency, effort, and longer-term value.
          </p>
        </div>
        <div className="flex gap-2">
          <TabButton active={activeTab === "priority"} count={priorityTasks.length} onClick={() => setActiveTab("priority")}>
            Priority
          </TabButton>
          <TabButton active={activeTab === "all"} count={allTasks.length} onClick={() => setActiveTab("all")}>
            All tasks
          </TabButton>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
      ) : displayed.length ? (
        <div className="mt-6 space-y-3">
          {displayed.map((task, index) =>
            task.type === "job" ? (
              <JobCard key={task.id} task={task} index={index} isPro={isPro} onComplete={onComplete} onOpenPricing={onOpenPricing} />
            ) : (
              <motion.article
                key={task.id}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5"
                initial={{ opacity: 0, y: 8 }}
                transition={{ delay: index * 0.03, duration: 0.24 }}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${priorityStyles[task.priority]?.dot ?? "bg-slate-400"}`} />
                      <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs ${typeStyles[task.type] ?? "border border-slate-200 bg-slate-50 text-slate-600"}`}>
                        {task.type}
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-slate-950">{task.title}</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{task.reason}</p>
                  </div>
                  <div className="shrink-0 space-y-2 sm:text-right">
                    <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                      <p className="font-semibold text-slate-900">{task.deadline}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">{task.estimate}</p>
                    </div>
                    <div className="flex gap-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => onSnooze(task.id, 2)}
                        className="rounded-2xl border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
                      >
                        +2h
                      </button>
                      {isPro && (
                        <button
                          type="button"
                          onClick={() => onSnooze(task.id, 24)}
                          className="rounded-2xl border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
                        >
                          +24h
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onComplete(task.id)}
                        className="rounded-2xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            )
          )}

          {/* Blur wall — free users with more tasks hidden */}
          {hasMore && !isPro && (
            <div className="relative mt-2 overflow-hidden rounded-[28px]">
              <div className="pointer-events-none select-none space-y-3">
                {[
                  { dot: "bg-rose-400", w1: "w-2/3", w2: "w-1/2", opacity: "opacity-60" },
                  { dot: "bg-amber-400", w1: "w-3/5", w2: "w-2/5", opacity: "opacity-40" },
                  { dot: "bg-emerald-400", w1: "w-1/2", w2: "w-1/3", opacity: "opacity-20" },
                ].map((s, i) => (
                  <div key={i} className={`h-[72px] rounded-[28px] border border-slate-200 bg-slate-50 p-5 blur-[3px] ${s.opacity}`}>
                    <div className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                      <div className={`h-3 ${s.w1} rounded-full bg-slate-200`} />
                    </div>
                    <div className={`ml-6 mt-2.5 h-3 ${s.w2} rounded-full bg-slate-100`} />
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[28px] bg-gradient-to-t from-white/98 via-white/80 to-transparent px-4 pt-8">
                <div className="space-y-1.5 text-center">
                  <p className="text-base font-semibold text-slate-950">
                    {hiddenPreview?.count
                      ? `${hiddenPreview.count} more task${hiddenPreview.count > 1 ? "s" : ""} matched your profile`
                      : "More tasks hidden — upgrade to see all"}
                  </p>
                  {hiddenPreview?.topJobTitle && (
                    <p className="mx-auto max-w-xs text-xs text-slate-500">
                      Including{" "}
                      <span className="font-medium text-slate-800">
                        {hiddenPreview.topJobTitle.split(" @ ")[0]}
                      </span>
                      {hiddenPreview.breakdown && ` and ${hiddenPreview.breakdown}`}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onOpenPricing}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Sparkles size={14} />
                  {hiddenPreview?.count
                    ? `Unlock all ${(totalCount ?? 0)} tasks · ₹59/month`
                    : "Upgrade to Pro · ₹59/month"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <h3 className="text-lg font-semibold text-slate-950">
            {activeTab === "priority" ? "No urgent tasks — you're on track!" : "No other tasks"}
          </h3>
          <p className="mt-2 text-sm text-slate-500">Capture the next assignment, revision block, or application above.</p>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-slate-950 text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
      }`}
    >
      {children}
      <span className={`rounded-lg px-1.5 py-0.5 text-xs ${active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>
        {count}
      </span>
    </button>
  );
}

function JobCard({
  task,
  index,
  isPro,
  onComplete,
  onOpenPricing,
}: {
  task: any;
  index: number;
  isPro: boolean;
  onComplete: (id: string) => void;
  onOpenPricing: () => void;
}) {
  const [role, company] = task.title.includes(" @ ")
    ? task.title.split(" @ ", 2)
    : [task.title, null];

  const skills: string[] = task.subject
    ? task.subject.split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];

  const isPlaceholder = task.source === "system";
  const gated = !isPro && !isPlaceholder;

  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5"
      initial={{ opacity: 0, y: 8 }}
      transition={{ delay: index * 0.035, duration: 0.25 }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
              <Briefcase size={11} /> Internship
            </span>
            {isPlaceholder && (
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500">
                Sync pending
              </span>
            )}
            {gated && (
              <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs text-violet-600">
                Pro match
              </span>
            )}
          </div>

          <h3 className="mt-3 text-base font-semibold text-slate-950">{role}</h3>
          {company && (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin size={12} className="shrink-0" />
              {gated ? (
                <span className="inline-block rounded bg-slate-200 px-3 text-transparent blur-[5px] select-none">{company}</span>
              ) : company}
            </p>
          )}
          <p className="mt-2 text-sm leading-5 text-slate-500">{task.reason}</p>

          {skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                  {s} ✓
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {task.stipend ? (
            gated ? (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 select-none">
                <Banknote size={13} className="text-slate-300" />
                <span className="blur-[4px]">₹{task.stipend}</span>
                <span className="text-xs">/mo</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                <Banknote size={13} className="text-emerald-500" />
                {task.stipend}
              </span>
            )
          ) : null}

          {task.deadline && task.deadline !== "No deadline" && (
            <p className="text-xs text-slate-500">Apply by {task.deadline}</p>
          )}

          <div className="mt-1 flex gap-2">
            {gated ? (
              <button
                type="button"
                onClick={onOpenPricing}
                className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <Lock size={11} /> Unlock to apply
              </button>
            ) : task.external_url ? (
              <a
                href={task.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-2xl bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                Apply <ArrowUpRight size={11} />
              </a>
            ) : (
              <a
                href="https://internshala.com/internships"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Browse <ArrowUpRight size={11} />
              </a>
            )}
            <button
              type="button"
              onClick={() => onComplete(task.id)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </motion.article>
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
      className="rounded-[32px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.24 }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 transition focus-within:border-slate-300 focus-within:bg-white">
          <Plus className="shrink-0 text-slate-400" size={18} />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder='Add task — e.g. "Submit DBMS assignment tonight"'
            className="min-w-0 flex-1 bg-transparent py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="inline-flex items-center justify-center rounded-[22px] bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Adding…" : "Add task"}
        </button>
      </div>
    </motion.form>
  );
}

function StatsPanel({ stats, loading, isPro, onOpenPricing }: { stats: Stats | null; loading: boolean; isPro: boolean; onOpenPricing: () => void }) {
  if (loading) {
    return (
      <div className="glass rounded-[28px] p-5">
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

  const baseItems = [
    { label: "Pending", value: stats.pending_tasks },
    { label: "Done this week", value: stats.completed_this_week },
    { label: "Overdue", value: stats.overdue },
  ];

  return (
    <div className="glass rounded-[28px] p-5">
      <h3 className="text-xl font-semibold tracking-tight text-slate-950">This week</h3>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {baseItems.map(({ label, value }) => (
          <div key={label} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
        {isPro ? (
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">GitHub streak</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{stats.github.streak_days}d</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenPricing}
            className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white"
          >
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">GitHub streak</p>
            <p className="mt-2 text-2xl font-semibold text-transparent blur-[6px] select-none">
              {stats.github.streak_days}d
            </p>
            <p className="mt-0.5 text-[10px] font-semibold text-slate-400">Pro →</p>
          </button>
        )}
      </div>
    </div>
  );
}

function FocusPanel({ onOpenPricing, stats, isPro }: { onOpenPricing: () => void; stats: Stats | null; isPro: boolean }) {
  const healthScore = stats?.github.health_score ?? 0;
  return (
    <div className="glass rounded-[28px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">GitHub health</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{healthScore}/100</h3>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
          <Target size={18} />
        </div>
      </div>
      <div className="mt-5 h-2 rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full bg-slate-900 transition-[width] duration-700"
          style={{ width: `${healthScore}%` }}
        />
      </div>
      {isPro ? (
        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700">
          <Sparkles size={15} /> Auto-scheduling Active
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpenPricing}
          className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Unlock auto-scheduling
        </button>
      )}
    </div>
  );
}

function generateInsight(task: any): string {
  if (!task) return "Add your first task — an exam, assignment, or internship deadline — and PrioryxAI will tell you exactly what to do next.";
  const daysLeft = task.due_at
    ? Math.ceil((new Date(task.due_at).getTime() - Date.now()) / 86_400_000)
    : null;

  if (task.type === "job") {
    const [role, company] = task.title.includes(" @ ") ? task.title.split(" @ ", 2) : [task.title, null];
    const skills: string[] = task.subject ? task.subject.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
    const urgency = daysLeft !== null && daysLeft <= 7
      ? `Deadline in ${daysLeft} day${daysLeft === 1 ? "" : "s"} — apply today before it fills.`
      : `Apply now while the listing is live.`;
    const skillHint = skills.length > 0 ? `Your ${skills[0]} background is a direct match.` : "Strong match for your skill profile.";
    return `${company ? `${role} at ${company}` : role} — ${skillHint} ${urgency}`;
  }
  if (task.type === "exam") {
    if (daysLeft !== null && daysLeft <= 1) return "Exam tomorrow — skip new topics. Do active recall on what you already know.";
    if (daysLeft !== null && daysLeft <= 3) return `${daysLeft} days to exam. Past papers over re-reading — every time.`;
    return "Exam in the calendar. Start chunking study sessions now.";
  }
  if (task.type === "assignment") {
    if (daysLeft !== null && daysLeft <= 1) return "Due tomorrow. Rough draft now — editing a bad first draft is 10× faster than staring at a blank page.";
    if (daysLeft !== null && daysLeft <= 3) return `${daysLeft} days. Break it: outline → draft → polish.`;
    return "Assignment on deck. Spend 20 minutes defining the exact scope before writing a single line.";
  }
  if (task.type === "github") return "GitHub streak at risk. A single commit — even a README fix — keeps momentum.";
  return task.reason ?? `${task.title} is ranked #1 right now. Clear it before context-switching to anything else.`;
}

function InsightPanel({ nextTask }: { nextTask: any }) {
  return (
    <div className="glass rounded-[28px] p-5">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Sparkles size={16} />
        Assistant note
      </div>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        {generateInsight(nextTask)}
      </p>
    </div>
  );
}

const difficultyStyles: Record<string, string> = {
  Beginner: "text-emerald-700 border-emerald-200 bg-emerald-50",
  Intermediate: "text-blue-700 border-blue-200 bg-blue-50",
  Advanced: "text-violet-700 border-violet-200 bg-violet-50",
};

function ProjectIdeasPanel({ isPro, onOpenPricing }: { isPro: boolean; onOpenPricing: () => void }) {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/projects/ideas")
      .then((r) => r.json())
      .then((data) => { if (data.ideas) setIdeas(data.ideas); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const FREE_LIMIT = 1;

  return (
    <div className="glass rounded-[28px] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 size={16} className="text-slate-500" />
          <h3 className="text-xl font-semibold tracking-tight text-slate-950">Project ideas</h3>
        </div>
        {!isPro && (
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500">
            1 of 3 free
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-slate-500">
        Skill-matched projects to boost your GitHub before internship season.
      </p>

      <div className="mt-5 space-y-3">
        {loading ? (
          <>
            <div className="h-20 animate-pulse rounded-[22px] border border-slate-200 bg-slate-50" />
            <div className="h-20 animate-pulse rounded-[22px] border border-slate-200 bg-slate-50 opacity-60" />
          </>
        ) : ideas.length === 0 ? (
          <p className="text-sm text-slate-500">Add subjects in Settings to get personalised project ideas.</p>
        ) : (
          ideas.map((idea, i) => {
            const locked = !isPro && i >= FREE_LIMIT;
            const isOpen = expanded === i;

            if (locked) {
              return (
                <div key={i} className="relative overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <div className="pointer-events-none select-none blur-[3px]">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${difficultyStyles[idea.difficulty] ?? difficultyStyles.Beginner}`}>
                        {idea.difficulty}
                      </span>
                      <span className="text-xs text-slate-500">{idea.estimate}</span>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-slate-950">{idea.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{idea.description}</p>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/60 backdrop-blur-[2px]">
                    <Lock size={14} className="text-slate-400" />
                    <button
                      type="button"
                      onClick={onOpenPricing}
                      className="inline-flex items-center gap-1 rounded-2xl bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                    >
                      <Sparkles size={11} /> Unlock with Pro
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={i} className="rounded-[22px] border border-slate-200 bg-slate-50 transition hover:border-slate-300 hover:bg-white">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : i)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${difficultyStyles[idea.difficulty] ?? difficultyStyles.Beginner}`}>
                          {idea.difficulty}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Clock3 size={9} /> {idea.estimate}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-semibold text-slate-950">{idea.title}</p>
                      <p className="mt-0.5 text-xs leading-5 text-slate-500">{idea.description}</p>
                    </div>
                    <ChevronRight
                      size={14}
                      className={`mt-1 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                    />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 border-t border-slate-200 px-4 pb-4 pt-3">
                        <div className="flex items-start gap-2">
                          <Zap size={12} className="mt-0.5 shrink-0 text-slate-500" />
                          <p className="text-xs leading-5 text-slate-600">{idea.whyItMatters}</p>
                        </div>
                        <div>
                          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tech stack</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(idea.techStack ?? []).map((tech: string) => (
                              <span key={tech} className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(idea.githubTopics ?? []).length > 0 && (
                            <a
                              href={`https://github.com/topics/${idea.githubTopics[0]}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                            >
                              <GitBranch size={10} /> Find on GitHub
                              <ArrowUpRight size={9} />
                            </a>
                          )}
                          <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(`${idea.title} tutorial ${(idea.techStack ?? []).slice(0, 2).join(" ")}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                          >
                            <BookOpen size={10} /> Find tutorials
                            <ArrowUpRight size={9} />
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {!isPro && ideas.length > 0 && (
        <button
          type="button"
          onClick={onOpenPricing}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Sparkles size={12} />
          Unlock all 3 ideas — Pro
        </button>
      )}
    </div>
  );
}

function SetupStrip({
  items,
  isPro,
  onDismiss,
  onOpenSettings,
  onOpenPricing,
}: {
  items: any[];
  isPro: boolean;
  onDismiss: (id: string) => void;
  onOpenSettings: () => void;
  onOpenPricing: () => void;
}) {
  function handleItemClick(item: any) {
    if (item.action_view === "settings") { onOpenSettings(); return; }
    if (item.action_view === "external") {
      if (!isPro) { onOpenPricing(); return; }
      if (item.external_url) window.open(item.external_url, "_blank", "noopener,noreferrer");
      return;
    }
    onOpenSettings();
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Get started</p>
        <div className="mt-3 space-y-1.5">
          {items.map((item) => {
            const isProGated = item.action_pro_only && !isPro;
            return (
              <div
                key={item.id}
                className="group flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-slate-50"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                  <p className="truncate text-sm text-slate-700">{item.title}</p>
                  {isProGated && (
                    <span className="shrink-0 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                      Pro
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className="inline-flex items-center gap-1 rounded-2xl px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    {isProGated ? <Sparkles size={11} /> : <Settings size={11} />}
                    {isProGated ? "Upgrade to unlock" : (item.action_label ?? "Fix")}
                    <ChevronRight size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDismiss(item.id)}
                    className="rounded-lg p-1 text-slate-400 opacity-0 transition hover:text-slate-700 group-hover:opacity-100"
                    aria-label="Dismiss"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
