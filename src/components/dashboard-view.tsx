"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Banknote, Brain, Briefcase, ChevronRight, Clock3, Flame, MapPin, Plus, Settings, Sparkles, Target, X } from "lucide-react";
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

interface DashboardViewProps {
  loading: boolean;
  tasks: Task[];
  setupItems?: any[];
  stats: Stats | null;
  isPro: boolean;
  hasMore: boolean;
  totalCount?: number;
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
  setupItems = [],
  stats,
  isPro,
  hasMore,
  totalCount,
  onAddTask,
  onCompleteTask,
  onSnoozeTask,
  onOpenAssistant,
  onOpenSettings,
  onOpenPricing,
}: DashboardViewProps) {
  const [focusTask, setFocusTask] = useState<EnrichedTask | null>(null);
  const [dismissedSetup, setDismissedSetup] = useState<Set<string>>(new Set());

  // Enrich tasks with UI fields
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
    if (nextTask.action_view === "settings") {
      onOpenSettings();
      return;
    }
    // All real tasks → Plan with AI (opens assistant with pre-filled prompt)
    onOpenAssistant(nextTask);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-5">
        <NextMoveCard
          loading={loading}
          task={nextTask}
          onPrimaryAction={handleNextMoveAction}
        />
        {/* Setup nudge strip — only shown when there are pending setup steps */}
        {!loading && visibleSetup.length > 0 && (
          <SetupStrip
            items={visibleSetup}
            onDismiss={(id) => setDismissedSetup((prev) => { const next = new Set(prev); next.add(id); return next; })}
            onOpenSettings={onOpenSettings}
          />
        )}
        <TaskCaptureBar onAddTask={onAddTask} />
        <PriorityFeed
          loading={loading}
          tasks={enriched}
          isPro={isPro}
          hasMore={hasMore}
          totalCount={totalCount}
          onComplete={onCompleteTask}
          onSnooze={onSnoozeTask}
          onOpenPricing={onOpenPricing}
        />
      </section>

      <aside className="space-y-5">
        <StatsPanel stats={stats} loading={loading} isPro={isPro} onOpenPricing={onOpenPricing} />
        <FocusPanel onOpenPricing={onOpenPricing} stats={stats} isPro={isPro} />
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
  const actionLabel = task?.action_view === "settings" ? (task?.action_label ?? "Open settings") : "Plan with AI";
  const modeLabel = task?.action_view === "settings" ? "Guided setup" : "AI-assisted";

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

            {task.type === "job" ? (
              /* ── Job-specific layout ── */
              <>
                <div className="mt-6">
                  <p className="text-sm text-neutral-400">Top internship match</p>
                  {(() => {
                    const [role, company] = task.title.includes(" @ ")
                      ? task.title.split(" @ ", 2)
                      : [task.title, null];
                    const skills: string[] = task.subject
                      ? task.subject.split(",").map((s: string) => s.trim()).filter(Boolean)
                      : [];
                    return (
                      <>
                        <h2 className="mt-2 text-3xl font-semibold leading-tight text-white sm:text-4xl">{role}</h2>
                        {company && (
                          <p className="mt-1 flex items-center gap-1.5 text-base text-neutral-400">
                            <MapPin size={14} /> {company}
                          </p>
                        )}
                        <p className="mt-3 text-sm leading-6 text-neutral-400">{task.reason}</p>
                        {skills.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="text-xs text-neutral-500">Matched skills:</span>
                            {skills.map((s) => (
                              <span key={s} className="rounded-lg border border-volt/15 bg-volt/10 px-2.5 py-0.5 text-xs text-volt">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    {task.stipend && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-mint/20 bg-mint/10 px-3 py-1.5 text-sm font-semibold text-mint">
                        <Banknote size={14} /> {task.stipend}
                      </span>
                    )}
                    {task.deadline && task.deadline !== "No deadline" && (
                      <span className="text-sm text-neutral-500">Apply by {task.deadline}</span>
                    )}
                  </div>
                  {task.external_url ? (
                    <a
                      href={task.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-volt px-5 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.02] hover:bg-volt/90"
                    >
                      Apply on Internshala <ArrowUpRight size={16} />
                    </a>
                  ) : (
                    <a
                      href="https://internshala.com/internships"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.02]"
                    >
                      Browse Internshala <ArrowUpRight size={16} />
                    </a>
                  )}
                </div>
              </>
            ) : (
              /* ── Generic task layout ── */
              <>
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
            )}
          </>
        ) : (
          <div className="py-3">
            <div className="inline-flex items-center gap-2 rounded-lg border border-mint/20 bg-mint/10 px-3 py-1.5 text-sm text-mint">
              <Sparkles size={15} />
              Slate is clear
            </div>
            <h2 className="mt-5 text-3xl font-semibold leading-tight text-white sm:text-4xl">Nothing ranked yet.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
              Type a task below — <span className="text-white">"DBMS exam Friday"</span>, <span className="text-white">"ML assignment due Sunday"</span>, <span className="text-white">"apply to internship by Thursday"</span> — and PrioryxAI will rank it and tell you exactly what to do first.
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
  isPro,
  hasMore,
  totalCount,
  onComplete,
  onSnooze,
  onOpenPricing,
}: {
  loading: boolean;
  tasks: any[];
  isPro: boolean;
  hasMore: boolean;
  totalCount?: number;
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
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Priority Feed</h2>
          <p className="mt-1 text-sm text-neutral-500">Sorted by urgency, effort, and career impact.</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <TabButton active={activeTab === "priority"} count={priorityTasks.length} onClick={() => setActiveTab("priority")}>
          Priority
        </TabButton>
        <TabButton active={activeTab === "all"} count={allTasks.length} onClick={() => setActiveTab("all")}>
          All Tasks
        </TabButton>
      </div>

      {loading ? (
        <div className="space-y-3">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
      ) : displayed.length ? (
        <div className="space-y-3">
          {displayed.map((task, index) =>
            task.type === "job" ? (
              <JobCard key={task.id} task={task} index={index} isPro={isPro} onComplete={onComplete} onOpenPricing={onOpenPricing} />
            ) : (
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
                      {isPro && (
                        <button
                          type="button"
                          onClick={() => onSnooze(task.id, 24)}
                          className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-neutral-400 hover:text-white transition"
                        >
                          +24h
                        </button>
                      )}
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
            )
          )}

          {/* Blur wall — free users with more tasks hidden */}
          {hasMore && !isPro && (
            <div className="relative mt-2">
              <div className="space-y-3 select-none pointer-events-none">
                <div className="glass rounded-lg p-4 h-16 blur-[3px] opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <div className="h-3 w-2/3 rounded bg-white/10" />
                  </div>
                  <div className="mt-2 h-3 w-1/2 rounded bg-white/5 ml-6" />
                </div>
                <div className="glass rounded-lg p-4 h-16 blur-[3px] opacity-40">
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    <div className="h-3 w-3/5 rounded bg-white/10" />
                  </div>
                  <div className="mt-2 h-3 w-2/5 rounded bg-white/5 ml-6" />
                </div>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent rounded-lg pt-6">
                <p className="text-center text-sm font-semibold text-white">
                  {totalCount && totalCount > 25
                    ? `+${totalCount - 25} tasks hidden behind this wall`
                    : "More tasks hidden — Upgrade to see full feed"}
                </p>
                <p className="text-center text-xs text-neutral-400 max-w-xs">
                  Pro unlocks your full queue, ranked by impact — not just date.
                </p>
                <button
                  type="button"
                  onClick={onOpenPricing}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
                >
                  <Sparkles size={14} /> {totalCount ? `See all ${totalCount} tasks` : "Upgrade to Pro"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass rounded-lg p-6 text-center">
          {activeTab === "priority" ? (
            <>
              <p className="text-lg font-semibold text-white">No urgent tasks — you&apos;re on track! 🎉</p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-white">No low-priority tasks</p>
            </>
          )}
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
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
        active ? "bg-white text-black" : "border border-white/10 bg-transparent text-neutral-400 hover:text-white"
      }`}
    >
      {children}
      <span className={`rounded-md px-1.5 py-0.5 text-xs ${active ? "bg-black/15 text-black" : "bg-white/10 text-neutral-500"}`}>
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
  // title format from job-sync: "Role @ Company"
  const [role, company] = task.title.includes(" @ ")
    ? task.title.split(" @ ", 2)
    : [task.title, null];

  const skills: string[] = task.subject
    ? task.subject.split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];

  const isPlaceholder = task.source === "system";
  // Free users see skill chips but not stipend/company/apply link
  const gated = !isPro && !isPlaceholder;

  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className="glass group rounded-lg p-4 transition hover:border-volt/20 hover:bg-white/[0.075] hover:shadow-glow"
      initial={{ opacity: 0, y: 8 }}
      transition={{ delay: index * 0.035, duration: 0.25 }}
      whileHover={{ scale: 1.006 }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {/* Header row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-lg border border-volt/20 bg-volt/10 px-2.5 py-1 text-xs font-semibold text-volt">
              <Briefcase size={11} /> Internship
            </span>
            {isPlaceholder && (
              <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-neutral-500">
                Sync pending
              </span>
            )}
            {gated && (
              <span className="rounded-lg border border-aura/20 bg-aura/10 px-2.5 py-1 text-xs text-violet-300">
                Pro match
              </span>
            )}
          </div>

          {/* Role + company (company blurred for free users) */}
          <h3 className="mt-2 text-base font-semibold text-white">{role}</h3>
          {company && (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-neutral-400">
              <MapPin size={12} className="shrink-0" />
              {gated ? (
                <span className="inline-block rounded bg-white/10 px-3 text-transparent blur-[5px] select-none">{company}</span>
              ) : company}
            </p>
          )}

          {/* Reason / match rationale */}
          <p className="mt-2 text-sm leading-5 text-neutral-500">{task.reason}</p>

          {/* Skill chips — always visible (shows system knows the user's skills) */}
          {skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 rounded-lg border border-volt/15 bg-volt/10 px-2 py-0.5 text-xs text-volt"
                >
                  {s} ✓
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          {task.stipend ? (
            gated ? (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-500 select-none">
                <Banknote size={13} className="text-neutral-600" />
                <span className="blur-[4px]">₹{task.stipend}</span>
                <span className="text-xs">/mo</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-white">
                <Banknote size={13} className="text-mint" />
                {task.stipend}
              </span>
            )
          ) : null}
          {task.deadline && task.deadline !== "No deadline" && (
            <p className="text-xs text-neutral-500">Apply by {task.deadline}</p>
          )}

          <div className="mt-1 flex gap-2">
            {gated ? (
              <button
                type="button"
                onClick={onOpenPricing}
                className="inline-flex items-center gap-1 rounded-lg border border-aura/25 bg-aura/10 px-3 py-1.5 text-xs font-semibold text-violet-300 transition hover:bg-aura/20"
              >
                <Sparkles size={11} /> Unlock to apply
              </button>
            ) : task.external_url ? (
              <a
                href={task.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-volt px-3 py-1.5 text-xs font-semibold text-black transition hover:scale-[1.03] hover:bg-volt/90"
              >
                Apply <ArrowUpRight size={11} />
              </a>
            ) : (
              <a
                href="https://internshala.com/internships"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-volt/20 bg-volt/10 px-3 py-1.5 text-xs font-semibold text-volt transition hover:bg-volt/20"
              >
                Browse <ArrowUpRight size={11} />
              </a>
            )}
            <button
              type="button"
              onClick={() => onComplete(task.id)}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-neutral-400 transition hover:text-white"
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

function StatsPanel({ stats, loading, isPro, onOpenPricing }: { stats: Stats | null; loading: boolean; isPro: boolean; onOpenPricing: () => void }) {
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

  const baseItems = [
    { label: "Pending", value: stats.pending_tasks },
    { label: "Done this week", value: stats.completed_this_week },
    { label: "Overdue", value: stats.overdue },
  ];

  return (
    <div className="glass rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white">This week</h3>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {baseItems.map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-neutral-500">{label}</p>
            <p className="mt-1 text-xl font-semibold text-white">{value}</p>
          </div>
        ))}
        {/* GitHub streak — blurred for free users */}
        {isPro ? (
          <div className="rounded-lg border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-neutral-500">GitHub streak</p>
            <p className="mt-1 text-xl font-semibold text-white">{stats.github.streak_days}d</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenPricing}
            className="rounded-lg border border-aura/15 bg-aura/5 p-3 text-left transition hover:border-aura/30 hover:bg-aura/10"
          >
            <p className="text-xs text-neutral-500">GitHub streak</p>
            <p className="mt-1 text-xl font-semibold text-transparent blur-[6px] select-none">
              {stats.github.streak_days}d
            </p>
            <p className="mt-0.5 text-[10px] text-violet-400">Pro →</p>
          </button>
        )}
      </div>
    </div>
  );
}

function FocusPanel({ onOpenPricing, stats, isPro }: { onOpenPricing: () => void; stats: Stats | null; isPro: boolean }) {
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
      {isPro ? (
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-mint/20 bg-mint/10 px-3 py-2.5 text-sm font-semibold text-mint">
          <Sparkles size={15} /> Auto-scheduling Active
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpenPricing}
          className="mt-5 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.1]"
        >
          Unlock auto-scheduling
        </button>
      )}
    </motion.div>
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
    const skillHint = skills.length > 0
      ? `Your ${skills[0]} background is a direct match.`
      : "Strong match for your skill profile.";
    return `${company ? `${role} at ${company}` : role} — ${skillHint} ${urgency}`;
  }

  if (task.type === "exam") {
    if (daysLeft !== null && daysLeft <= 1) return "Exam tomorrow — skip new topics. Do active recall on what you already know. One focused hour now beats three distracted ones.";
    if (daysLeft !== null && daysLeft <= 3) return `${daysLeft} days to exam. Past papers over re-reading — every time. Start with your weakest topic, not your strongest.`;
    if (daysLeft !== null && daysLeft <= 7) return `${daysLeft} days left. Build a topic list, estimate hours per topic, and block calendar time today.`;
    return "Exam in the calendar. Start chunking study sessions now — cramming compounds stress, not retention.";
  }

  if (task.type === "assignment") {
    if (daysLeft !== null && daysLeft <= 1) return "Due tomorrow. Rough draft now — start writing anything. Editing a bad first draft is 10× faster than staring at a blank page.";
    if (daysLeft !== null && daysLeft <= 3) return `${daysLeft} days. Break it: outline → draft → polish. Each pass takes less time than you think.`;
    return "Assignment on deck. Spend 20 minutes defining the exact scope before writing a single line.";
  }

  if (task.type === "github") return "GitHub streak at risk. A single commit — even a README fix — keeps momentum and keeps your graph green.";

  return task.reason ?? `${task.title} is ranked #1 right now. Clear it before context-switching to anything else.`;
}

function InsightPanel({ nextTask }: { nextTask: any }) {
  return (
    <div className="glass rounded-lg p-4">
      <div className="flex items-center gap-2 text-sm text-neutral-400">
        <Sparkles size={16} className="text-mint" />
        AI insight
      </div>
      <p className="mt-3 text-sm leading-6 text-neutral-300">
        {generateInsight(nextTask)}
      </p>
    </div>
  );
}

function SetupStrip({
  items,
  onDismiss,
  onOpenSettings,
}: {
  items: any[];
  onDismiss: (id: string) => void;
  onOpenSettings: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-white/10 bg-white/[0.04] p-4 space-y-2"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Get started</p>
        <div className="space-y-1.5">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-white/[0.05] transition group">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-1.5 w-1.5 rounded-full bg-volt shrink-0" />
                <p className="text-sm text-neutral-300 truncate">{item.title}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-neutral-500 hover:text-white transition"
                >
                  <Settings size={11} /> Fix
                  <ChevronRight size={11} />
                </button>
                <button
                  type="button"
                  onClick={() => onDismiss(item.id)}
                  className="rounded p-1 text-neutral-600 hover:text-neutral-300 transition opacity-0 group-hover:opacity-100"
                  aria-label="Dismiss"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
