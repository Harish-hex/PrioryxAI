"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Banknote, BookOpen, Brain, Briefcase, CheckCircle2, ChevronRight, Clock3, Code2, ExternalLink, GitBranch, Lock, MapPin, Play, Plus, Settings, Target, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { FocusSessionModal } from "@/components/focus-session-modal";
import { LoadingCard, LoadingLine } from "@/components/loading-skeletons";
import { priorityStyles, typeStyles } from "@/components/task-styles";
import { getDailyChallenges, type CodingProblem } from "@/lib/daily-challenges";
import { recordDailyActivity } from "@/lib/streak-tracker";
import { ReadinessScoreCard } from "@/components/readiness-score-card";

const dsaDifficultyStyles = {
  Easy: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  Medium: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  Hard: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
};

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
  // Use explicit priority field if present (low/medium/high/urgent from DB)
  if (task.priority) {
    switch (task.priority) {
      case 'urgent':
      case 'high':
        return 'red';
      case 'medium':
        return 'amber';
      case 'low':
        return 'green';
    }
  }
  // Fallback to due_at-based derivation
  if (!task.due_at) return "green";
  const hoursLeft = (new Date(task.due_at).getTime() - Date.now()) / 3_600_000;
  if (hoursLeft < 0) return "red";
  if (hoursLeft < 24) return "red";
  if (hoursLeft < 72) return "amber";
  return "green";
}

function formatDeadline(task: Task): string {
  // Use explicit deadline field if present
  const dateStr = task.deadline ?? task.due_at;
  if (!dateStr) return "No deadline";
  const d = new Date(dateStr);
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
    deadline: t.deadline ?? formatDeadline(t),
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
        {/* ── Phase 4: Readiness Score Hero (primary surface) ─── */}
        <ReadinessScoreCard
          isPro={isPro}
          onOpenPricing={onOpenPricing}
          onCompleteTask={onCompleteTask}
        />

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
      className="neu-card rounded-[28px] p-5 sm:rounded-[32px] sm:p-8"
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
            <span className="neu-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
              {isSetupAction ? "Setup step" : "Next priority"}
            </span>
            <span className={`rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold ${priorityStyles[task.priority]?.pill ?? "neu-pill text-slate-600"}`}>
              {priorityStyles[task.priority]?.label ?? task.priority}
            </span>
          </div>

          {task.type === "job" ? (
            <>
              <div className="mt-5 sm:mt-7">
                {(() => {
                  const [role, company] = task.title.includes(" @ ")
                    ? task.title.split(" @ ", 2)
                    : [task.title, null];
                  const skills: string[] = task.subject
                    ? task.subject.split(",").map((s: string) => s.trim()).filter(Boolean)
                    : [];
                  return (
                    <>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-400">Top internship match</p>
                      <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl dark:text-white">{role}</h2>
                      {company && (
                        <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                          <MapPin size={14} /> {company}
                        </p>
                      )}
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">{task.reason}</p>
                      {skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {skills.map((s) => (
                            <span key={s} className="neu-pill rounded-full px-2.5 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="mt-5 flex flex-col gap-4 border-t border-slate-200/60 dark:border-white/10 pt-5 sm:mt-7 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
                <div className="flex flex-wrap items-center gap-3">
                  {task.stipend && (
                    <span className="neu-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      <Banknote size={14} /> {task.stipend}
                    </span>
                  )}
                  {task.deadline && task.deadline !== "No deadline" && (
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Apply by {task.deadline}</span>
                  )}
                </div>
                {task.external_url ? (
                  <a
                    href={task.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neu-btn inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                  >
                    Apply on Internshala <ArrowUpRight size={16} />
                  </a>
                ) : (
                  <a
                    href="https://internshala.com/internships"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neu-btn inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 transition dark:text-slate-200"
                  >
                    Browse Internshala <ArrowUpRight size={16} />
                  </a>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mt-5 grid gap-5 sm:mt-7 lg:grid-cols-[minmax(0,1fr)_240px]">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-400">Do this next</p>
                  <h2 className="mt-2 max-w-3xl text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl dark:text-white">
                    {task.title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">{task.reason}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  <InfoTile icon={Clock3} label="Deadline" value={task.deadline} />
                  <InfoTile icon={Target} label="Focus block" value={task.estimate} />
                  <InfoTile icon={Brain} label="Mode" value={modeLabel} />
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-4 border-t border-slate-200/60 dark:border-white/10 pt-5 sm:mt-7 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
                <div className="flex flex-wrap gap-2">
                  <span className={`neu-pill rounded-full px-3.5 py-1.5 text-xs font-bold ${typeStyles[task.type] ?? "text-slate-600 dark:text-slate-300"}`}>
                    {task.type}
                  </span>
                </div>
                {!isSetupAction && !isPro ? (
                  <button
                    type="button"
                    onClick={onOpenPricing}
                    className="neu-btn inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 transition dark:text-slate-200"
                  >
                    <Lock size={14} /> Plan with AI · Pro
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onPrimaryAction}
                    className="neu-btn inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
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
          <span className="neu-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 size={15} />
            All clear
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">Nothing ranked yet.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            Type a task below — &quot;DBMS exam Friday&quot;, &quot;ML assignment due Sunday&quot;, &quot;apply to internship by Thursday&quot; — and PrioryxAI will rank it and tell you exactly what to do first.
          </p>
        </div>
      )}
    </motion.div>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="neu-inset rounded-[22px] p-4">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-400">
        <Icon size={14} />
        {label}
      </div>
      <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{value}</p>
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
  const [dailyChallenges, setDailyChallenges] = useState<CodingProblem[]>([]);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [todayKey, setTodayKey] = useState<string>("");

  useEffect(() => {
    const today = new Date();
    const key = `prioryx_daily_solved_${today.toISOString().slice(0, 10)}`;
    setTodayKey(key);

    const daily = getDailyChallenges(today);
    setDailyChallenges(daily);

    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        setSolvedIds(new Set(JSON.parse(saved) as string[]));
      }
    } catch {}
  }, []);

  const toggleSolved = (id: string) => {
    setSolvedIds((prev) => {
      const next = new Set(Array.from(prev));
      const willBeSolved = !next.has(id);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        if (todayKey) {
          localStorage.setItem(todayKey, JSON.stringify(Array.from(next)));
        }
        if (willBeSolved) {
          recordDailyActivity();
        }
      } catch {}
      return next;
    });
  };

  const priorityTasks = tasks.filter(
    (t) => t.priority === "red" || t.priority === "amber" || (!t.due_at && (t.score ?? 0) >= 110)
  );
  const otherAllTasks = tasks.filter(
    (t) => t.priority === "green" && (t.score ?? 0) < 110
  );
  const allTasksCount = dailyChallenges.length + otherAllTasks.length;

  return (
    <div className="neu-card rounded-[32px] p-6 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Priority feed</h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Ordered by urgency, effort, and longer-term value.
          </p>
        </div>
        <div className="flex gap-2">
          <TabButton active={activeTab === "priority"} count={priorityTasks.length} onClick={() => setActiveTab("priority")}>
            Priority
          </TabButton>
          <TabButton active={activeTab === "all"} count={allTasksCount} onClick={() => setActiveTab("all")}>
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
      ) : activeTab === "all" ? (
        <div className="mt-6 space-y-3.5">
          {/* Daily DSA Workout Questions */}
          {dailyChallenges.map((prob, idx) => {
            const isSolved = solvedIds.has(prob.id);

            return (
              <motion.div
                key={prob.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.2 }}
                className={`neu-raised-sm rounded-[24px] p-4 sm:p-5 transition hover:neu-card ${
                  isSolved ? "opacity-75" : ""
                }`}
              >
                <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
                  {/* Problem Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Difficulty Badge */}
                      <span
                        className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[11px] font-bold ${
                          dsaDifficultyStyles[prob.difficulty] || dsaDifficultyStyles.Medium
                        }`}
                      >
                        {prob.difficulty}
                      </span>

                      {/* Topic Pill */}
                      <span className="neu-pill rounded-lg px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        {prob.category} · {prob.topic}
                      </span>
                    </div>

                    <h3
                      className={`mt-2.5 text-base font-bold text-slate-950 dark:text-white ${
                        isSolved ? "line-through text-slate-400 dark:text-slate-400" : ""
                      }`}
                    >
                      {prob.title}
                    </h3>
                  </div>

                  {/* Actions & Links */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Solve Link */}
                    {prob.problemLink && (
                      <a
                        href={prob.problemLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="neu-btn inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                      >
                        <Code2 size={13} className="text-cyan-500" />
                        <span>Solve</span>
                        <ExternalLink size={11} className="opacity-60" />
                      </a>
                    )}

                    {/* Video Tutorial */}
                    {prob.solutionVideo && (
                      <a
                        href={prob.solutionVideo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="neu-btn inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        <Play size={12} className="fill-current" />
                        <span>Video</span>
                      </a>
                    )}

                    {/* Article Link */}
                    {prob.solutionArticle && (
                      <a
                        href={prob.solutionArticle}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="neu-btn inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
                      >
                        <BookOpen size={12} />
                        <span>Article</span>
                      </a>
                    )}

                    {/* Solved Checkbox Button */}
                    <button
                      type="button"
                      onClick={() => toggleSolved(prob.id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
                        isSolved
                          ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                          : "neu-btn text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                      }`}
                    >
                      <CheckCircle2 size={13} className={isSolved ? "fill-white text-emerald-600" : ""} />
                      <span>{isSolved ? "Solved" : "Mark Solved"}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Other general tasks if any */}
          {otherAllTasks.map((task, index) =>
            task.type === "job" ? (
              <JobCard key={task.id} task={task} index={index} isPro={isPro} onComplete={onComplete} onOpenPricing={onOpenPricing} />
            ) : (
              <motion.article
                key={task.id}
                animate={{ opacity: 1, y: 0 }}
                className="neu-raised-sm rounded-[26px] p-5 transition hover:neu-card"
                initial={{ opacity: 0, y: 8 }}
                transition={{ delay: index * 0.03, duration: 0.24 }}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${priorityStyles[task.priority]?.dot ?? "bg-slate-400"}`} />
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-400">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className={`neu-pill rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeStyles[task.type] ?? "text-slate-600 dark:text-slate-300"}`}>
                        {task.type}
                      </span>
                    </div>
                    <h3 className="mt-2.5 text-base font-bold text-slate-950 dark:text-white">{task.title}</h3>
                    <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{task.reason}</p>
                  </div>
                  <div className="shrink-0 space-y-2 sm:text-right">
                    <div className="neu-inset rounded-[20px] px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300">
                      <p className="font-bold text-slate-900 dark:text-white">{task.deadline}</p>
                      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-400">{task.estimate}</p>
                    </div>
                    <div className="flex gap-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => onSnooze(task.id, 2)}
                        className="neu-btn rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
                      >
                        +2h
                      </button>
                      {isPro && (
                        <button
                          type="button"
                          onClick={() => onSnooze(task.id, 24)}
                          className="neu-btn rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
                        >
                          +24h
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onComplete(task.id)}
                        className="neu-btn rounded-xl px-3.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            )
          )}
        </div>
      ) : priorityTasks.length ? (
        <div className="mt-6 space-y-3">
          {priorityTasks.map((task, index) =>
            task.type === "job" ? (
              <JobCard key={task.id} task={task} index={index} isPro={isPro} onComplete={onComplete} onOpenPricing={onOpenPricing} />
            ) : (
              <motion.article
                key={task.id}
                animate={{ opacity: 1, y: 0 }}
                className="neu-raised-sm rounded-[26px] p-5 transition hover:neu-card"
                initial={{ opacity: 0, y: 8 }}
                transition={{ delay: index * 0.03, duration: 0.24 }}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${priorityStyles[task.priority]?.dot ?? "bg-slate-400"}`} />
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-400">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className={`neu-pill rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeStyles[task.type] ?? "text-slate-600 dark:text-slate-300"}`}>
                        {task.type}
                      </span>
                    </div>
                    <h3 className="mt-2.5 text-base font-bold text-slate-950 dark:text-white">{task.title}</h3>
                    <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{task.reason}</p>
                  </div>
                  <div className="shrink-0 space-y-2 sm:text-right">
                    <div className="neu-inset rounded-[20px] px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300">
                      <p className="font-bold text-slate-900 dark:text-white">{task.deadline}</p>
                      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-400">{task.estimate}</p>
                    </div>
                    <div className="flex gap-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => onSnooze(task.id, 2)}
                        className="neu-btn rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
                      >
                        +2h
                      </button>
                      {isPro && (
                        <button
                          type="button"
                          onClick={() => onSnooze(task.id, 24)}
                          className="neu-btn rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
                        >
                          +24h
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onComplete(task.id)}
                        className="neu-btn rounded-xl px-3.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400"
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
                  <div key={i} className={`h-[72px] neu-card rounded-[28px] p-5 blur-[3px] ${s.opacity}`}>
                    <div className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                      <div className={`h-3 ${s.w1} rounded-full bg-slate-300 dark:bg-white/20`} />
                    </div>
                    <div className={`ml-6 mt-2.5 h-3 ${s.w2} rounded-full bg-slate-200 dark:bg-white/10`} />
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[28px] bg-gradient-to-t from-[#EEF1F5] via-[#EEF1F5]/85 to-transparent px-4 pt-8 dark:from-[#121824] dark:via-[#121824]/85 dark:to-transparent">
                <div className="space-y-1.5 text-center">
                  <p className="text-base font-bold text-slate-950 dark:text-white">
                    {hiddenPreview?.count
                      ? `${hiddenPreview.count} more task${hiddenPreview.count > 1 ? "s" : ""} matched your profile`
                      : "More tasks hidden — upgrade to see all"}
                  </p>
                  {hiddenPreview?.topJobTitle && (
                    <p className="mx-auto max-w-xs text-xs font-medium text-slate-600 dark:text-slate-400">
                      Including{" "}
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {hiddenPreview.topJobTitle.split(" @ ")[0]}
                      </span>
                      {hiddenPreview.breakdown && ` and ${hiddenPreview.breakdown}`}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onOpenPricing}
                  className="neu-btn inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                >
                  {hiddenPreview?.count
                    ? `Unlock all ${(totalCount ?? 0)} tasks · ₹59/month`
                    : "Upgrade to Pro · ₹59/month"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 neu-inset rounded-[28px] px-6 py-10 text-center">
          <h3 className="text-lg font-bold text-slate-950 dark:text-white">
            No urgent tasks — you&apos;re on track!
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Capture the next assignment, revision block, or application above.</p>
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
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
        active
          ? "neu-inset text-slate-950 dark:text-white"
          : "neu-btn text-slate-600 dark:text-slate-300"
      }`}
    >
      {children}
      <span className={`neu-pill rounded-lg px-2 py-0.5 text-xs font-semibold ${active ? "text-slate-950 dark:text-cyan-400" : "text-slate-500 dark:text-slate-400"}`}>
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
      className="neu-raised-sm rounded-[26px] p-5 transition hover:neu-card"
      initial={{ opacity: 0, y: 8 }}
      transition={{ delay: index * 0.035, duration: 0.25 }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="neu-pill inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-violet-700 dark:text-violet-400">
              <Briefcase size={11} /> Internship
            </span>
            {isPlaceholder && (
              <span className="neu-pill rounded-full px-2.5 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                Sync pending
              </span>
            )}
            {gated && (
              <span className="neu-pill rounded-full px-2.5 py-1 text-xs font-semibold text-violet-600 dark:text-violet-400">
                Pro match
              </span>
            )}
          </div>

          <h3 className="mt-2.5 text-base font-bold text-slate-950 dark:text-white">{role}</h3>
          {company && (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
              <MapPin size={12} className="shrink-0" />
              {gated ? (
                <span className="inline-block rounded bg-slate-200 px-3 text-transparent blur-[5px] select-none dark:bg-white/20">{company}</span>
              ) : company}
            </p>
          )}
          <p className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-300">{task.reason}</p>

          {skills.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span key={s} className="neu-pill inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {task.stipend ? (
            gated ? (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 select-none">
                <Banknote size={13} className="text-slate-300 dark:text-slate-600" />
                <span className="blur-[4px]">₹{task.stipend}</span>
                <span className="text-xs">/mo</span>
              </span>
            ) : (
              <span className="neu-pill inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                <Banknote size={13} className="text-emerald-500 dark:text-emerald-400" />
                {task.stipend}
              </span>
            )
          ) : null}

          {task.deadline && task.deadline !== "No deadline" && (
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Apply by {task.deadline}</p>
          )}

          <div className="mt-1 flex gap-2">
            {gated ? (
              <button
                type="button"
                onClick={onOpenPricing}
                className="neu-btn inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                <Lock size={11} /> Unlock to apply
              </button>
            ) : task.external_url ? (
              <a
                href={task.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="neu-btn inline-flex items-center gap-1 rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
              >
                Apply <ArrowUpRight size={11} />
              </a>
            ) : (
              <a
                href="https://internshala.com/internships"
                target="_blank"
                rel="noopener noreferrer"
                className="neu-btn inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                Browse <ArrowUpRight size={11} />
              </a>
            )}
            <button
              type="button"
              onClick={() => onComplete(task.id)}
              className="neu-btn rounded-xl px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400"
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
      className="neu-card rounded-[32px] p-4 sm:p-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.24 }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="neu-inset flex min-w-0 flex-1 items-center gap-3 rounded-[24px] px-4 transition">
          <Plus className="shrink-0 text-slate-400 dark:text-slate-400" size={18} />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder='Add task — e.g. "Submit DBMS assignment tonight"'
            className="min-w-0 flex-1 bg-transparent py-3.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="neu-btn inline-flex items-center justify-center rounded-[22px] bg-slate-950 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
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
      <div className="neu-card rounded-[28px] p-5">
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
    <div className="neu-card rounded-[28px] p-5 sm:p-6">
      <h3 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">This week</h3>
      <div className="mt-5 grid grid-cols-2 gap-3.5">
        {baseItems.map(({ label, value }) => (
          <div key={label} className="neu-raised-sm rounded-[22px] p-4 text-left transition hover:neu-card">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-400">{label}</p>
            <p className="mt-1.5 text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
          </div>
        ))}
        {isPro ? (
          <div className="neu-raised-sm rounded-[22px] p-4 text-left transition hover:neu-card">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-400">GitHub streak</p>
            <p className="mt-1.5 text-2xl font-bold text-slate-950 dark:text-white">{stats.github.streak_days}d</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenPricing}
            className="neu-raised-sm rounded-[22px] p-4 text-left transition hover:neu-card"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-400">GitHub streak</p>
            <p className="mt-1.5 text-2xl font-bold text-transparent blur-[6px] select-none">
              {stats.github.streak_days}d
            </p>
            <p className="mt-0.5 text-[10px] font-bold text-slate-400 dark:text-slate-400">Pro →</p>
          </button>
        )}
      </div>
    </div>
  );
}

function FocusPanel({ onOpenPricing, stats, isPro }: { onOpenPricing: () => void; stats: Stats | null; isPro: boolean }) {
  const healthScore = stats?.github.health_score ?? 0;
  return (
    <div className="neu-card rounded-[28px] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-400">GitHub health</p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{healthScore}/100</h3>
        </div>
        <div className="neu-pill rounded-2xl p-3 text-slate-900 dark:text-white">
          <Target size={18} />
        </div>
      </div>
      <div className="neu-inset mt-5 h-3 overflow-hidden rounded-full p-0.5">
        <div
          className="h-full rounded-full bg-slate-950 transition-[width] duration-700 dark:bg-cyan-400"
          style={{ width: `${healthScore}%` }}
        />
      </div>
      {isPro ? (
        <div className="neu-pill-inset mt-5 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-emerald-700 dark:text-emerald-400">
          Auto-scheduling Active
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpenPricing}
          className="neu-btn mt-5 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 transition dark:text-slate-200"
        >
          Unlock auto-scheduling
        </button>
      )}
    </div>
  );
}



const difficultyStyles: Record<string, string> = {
  Beginner: "text-emerald-700 dark:text-emerald-400",
  Intermediate: "text-blue-700 dark:text-blue-400",
  Advanced: "text-violet-700 dark:text-violet-400",
};

function ProjectIdeasPanel({ isPro, onOpenPricing }: { isPro: boolean; onOpenPricing: () => void }) {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(0);

  useEffect(() => {
    fetch("/api/projects/ideas")
      .then((r) => r.json())
      .then((data) => { if (data.ideas) setIdeas(data.ideas); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="neu-card rounded-[28px] p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-400">Portfolio builder</p>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950 dark:text-white">Project ideas</h3>
        </div>
        <div className="neu-pill rounded-2xl p-2.5 text-slate-900 dark:text-white">
          <Code2 size={16} />
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {loading ? (
          <div className="space-y-2">
            <LoadingLine className="h-14" />
            <LoadingLine className="h-14" />
            <LoadingLine className="h-14" />
          </div>
        ) : ideas.length === 0 ? (
          <p className="neu-inset rounded-[22px] px-4 py-5 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
            Add your GitHub profile to unlock tailored project recommendations.
          </p>
        ) : (
          ideas.map((idea: any, i: number) => {
            const isOpen = expanded === i;
            const isGated = !isPro && i > 0;

            if (isGated) {
              return (
                <div
                  key={i}
                  className="neu-raised-sm relative overflow-hidden rounded-[22px] p-4"
                >
                  <div className="pointer-events-none select-none blur-[4px]">
                    <div className="flex items-center gap-2">
                      <span className="neu-pill rounded-full px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {idea.difficulty}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">{idea.estimate}</span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-slate-950 dark:text-white">{idea.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{idea.description}</p>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#EEF1F5]/80 backdrop-blur-[2px] dark:bg-[#121824]/80">
                    <Lock size={14} className="text-slate-500" />
                    <button
                      type="button"
                      onClick={onOpenPricing}
                      className="neu-btn inline-flex items-center gap-1 rounded-2xl bg-slate-950 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                    >
                      Unlock with Pro
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={i} className="neu-raised-sm rounded-[22px] transition hover:neu-card">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : i)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`neu-pill rounded-full px-2.5 py-0.5 text-[10px] font-bold ${difficultyStyles[idea.difficulty] ?? difficultyStyles.Beginner}`}>
                          {idea.difficulty}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          <Clock3 size={9} /> {idea.estimate}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-bold text-slate-950 dark:text-white">{idea.title}</p>
                      <p className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-300">{idea.description}</p>
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
                      <div className="space-y-3 border-t border-slate-200/60 dark:border-white/10 px-4 pb-4 pt-3">
                        <div className="flex items-start gap-2">
                          <Zap size={12} className="mt-0.5 shrink-0 text-slate-500 dark:text-slate-400" />
                          <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">{idea.whyItMatters}</p>
                        </div>
                        <div>
                          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Tech stack</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(idea.techStack ?? []).map((tech: string) => (
                              <span key={tech} className="neu-pill rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
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
                              className="neu-btn inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-200"
                            >
                              <GitBranch size={10} /> Find on GitHub
                              <ArrowUpRight size={9} />
                            </a>
                          )}
                          <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(`${idea.title} tutorial ${(idea.techStack ?? []).slice(0, 2).join(" ")}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="neu-btn inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-200"
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
          className="neu-btn mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
        >
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
        className="neu-card rounded-[28px] p-5"
      >
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-400">Get started</p>
        <div className="mt-3 space-y-2">
          {items.map((item) => {
            const isProGated = item.action_pro_only && !isPro;
            return (
              <div
                key={item.id}
                className="neu-raised-sm group flex items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 transition hover:neu-card"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" />
                  <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{item.title}</p>
                  {isProGated && (
                    <span className="neu-pill shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      Pro
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className="neu-btn inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-600 transition dark:text-slate-300"
                  >
                    {isProGated ? <Lock size={11} /> : <Settings size={11} />}
                    {isProGated ? "Upgrade to unlock" : (item.action_label ?? "Fix")}
                    <ChevronRight size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDismiss(item.id)}
                    className="rounded-lg p-1 text-slate-400 opacity-0 transition hover:text-slate-700 group-hover:opacity-100 dark:text-slate-500 dark:hover:text-slate-300"
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
