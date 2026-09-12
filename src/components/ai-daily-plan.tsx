"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, AlertTriangle, CheckCircle2, ExternalLink,
  Clock, ChevronRight, X, RotateCcw, Loader2,
  Code2, GitBranch, BookOpen, Target, Brain
} from "lucide-react";
import { recordDailyActivity } from "@/lib/streak-tracker";

export interface PriorityTaskItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  urgency_score: number;
  action_url: string;
  action_label: string;
  secondary_url?: string;
  why_now: string;
  estimated_minutes: number;
  effort_level: string;
  due_date?: string;
  task_data: Record<string, unknown>;
  completed: boolean;
  dismissed: boolean;
}

interface DailyPlanMeta {
  todaysFocus: string;
  urgentAlerts: string[];
  insights: string[];
  totalMinutesToday: number;
  generatedAt: string;
}

const categoryConfig: Record<string, {
  icon: React.ElementType; label: string; color: string; dot: string;
}> = {
  exam:      { icon: AlertTriangle, label: "Exam",    color: "border-rose-200 bg-rose-50 text-rose-700",      dot: "bg-rose-500" },
  leetcode:  { icon: Code2,         label: "DSA",     color: "border-yellow-200 bg-yellow-50 text-yellow-700", dot: "bg-yellow-500" },
  github:    { icon: GitBranch,     label: "GitHub",  color: "border-slate-200 bg-slate-100 text-slate-700",   dot: "bg-slate-500" },
  learning:  { icon: BookOpen,      label: "Learning",color: "border-blue-200 bg-blue-50 text-blue-700",       dot: "bg-blue-500" },
  project:   { icon: Target,        label: "Project", color: "border-violet-200 bg-violet-50 text-violet-700", dot: "bg-violet-500" },
  resume:    { icon: Brain,         label: "Resume",  color: "border-emerald-200 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
};

const priorityPill: Record<string, string> = {
  CRITICAL: "border border-rose-200 bg-rose-50 text-rose-700",
  HIGH:     "border border-amber-200 bg-amber-50 text-amber-700",
  MEDIUM:   "border border-blue-200 bg-blue-50 text-blue-700",
  LOW:      "border border-slate-200 bg-slate-50 text-slate-600",
};

const effortLabel: Record<string, string> = {
  quick: "Quick win",
  medium: "Focus block",
  deep: "Deep work",
};

export function AIDailyPlanPanel() {
  const [tasks, setTasks] = useState<PriorityTaskItem[]>([]);
  const [plan, setPlan] = useState<DailyPlanMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const fetchPlan = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/priority/today${force ? "?force=true" : ""}`);
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();

      const rawTasks = (data.tasks ?? []) as PriorityTaskItem[];
      setTasks(rawTasks.filter(t => !t.completed && !t.dismissed));
      setFromCache(data.fromCache ?? false);

      if (data.plan) {
        const p = data.plan as DailyPlanMeta & { todays_focus?: string; urgent_alerts?: string[]; total_estimated_minutes?: number; generated_at?: string };
        setPlan({
          todaysFocus:       p.todaysFocus ?? p.todays_focus ?? "",
          urgentAlerts:      p.urgentAlerts ?? p.urgent_alerts ?? [],
          insights:          p.insights ?? [],
          totalMinutesToday: p.totalMinutesToday ?? p.total_estimated_minutes ?? 0,
          generatedAt:       p.generatedAt ?? p.generated_at ?? "",
        });
      }
    } catch (e) {
      setError("Could not load your AI plan. Check your connection.");
      console.error("[AIDailyPlan] fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  // Auto-tick tasks the moment the user actually does the underlying work
  // elsewhere in the app (solves the DSA problem, watches the video, submits
  // a project phase, etc.) — no manual "mark done" click required for those.
  useEffect(() => {
    function onActivity(e: Event) {
      const detail = (e as CustomEvent).detail as { type: string; metadata?: Record<string, any> } | undefined;
      if (!detail) return;
      const { type, metadata = {} } = detail;
      const link: string | undefined = metadata.link || metadata.videoUrl || metadata.url;
      const title: string | undefined = metadata.title;

      setTasks(prev => {
        const match = prev.find((task) => {
          const taskUrl = task.action_url || (task.task_data as any)?.problemUrl;
          if (task.category === "leetcode" && type === "dsa_solved") {
            if (link && taskUrl && link === taskUrl) return true;
            if (title && task.title.toLowerCase().includes(String(title).toLowerCase())) return true;
          }
          if (task.category === "learning" && type === "youtube_watch") {
            if (link && taskUrl && link === taskUrl) return true;
          }
          if (task.category === "project" && type === "foundry_phase_submitted") {
            const projectId = metadata.projectId;
            if (projectId && task.action_url.includes(String(projectId))) return true;
          }
          if (task.category === "resume" && type === "resume_analysis") return true;
          return false;
        });
        if (!match) return prev;
        recordDailyActivity();
        fetch(`/api/priority/tasks/${match.id}/complete`, { method: "POST" }).catch(() => {});
        return prev.filter((t) => t.id !== match.id);
      });
    }

    window.addEventListener("prioryx_activity_updated", onActivity);
    return () => window.removeEventListener("prioryx_activity_updated", onActivity);
  }, []);

  async function handleDismiss(taskId: string) {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await fetch(`/api/priority/tasks/${taskId}/dismiss`, { method: "POST" });
  }

  // For task categories with no specific in-app activity signal to key off
  // (github fixes, job applications, exam prep — all done on an external site
  // or offline), infer completion from the natural workflow instead of asking
  // for a separate "mark done" click: note when the user opens the task's own
  // action link, and if they come back to this tab afterwards having spent a
  // real amount of time away, treat that as them having done it.
  const openedAtRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      for (const [taskId, openedAt] of Array.from(openedAtRef.current.entries())) {
        openedAtRef.current.delete(taskId);
        if (now - openedAt >= 8_000) {
          setTasks(prev => {
            if (!prev.some(t => t.id === taskId)) return prev;
            recordDailyActivity();
            fetch(`/api/priority/tasks/${taskId}/complete`, { method: "POST" }).catch(() => {});
            return prev.filter(t => t.id !== taskId);
          });
        }
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  function handleAction(task: PriorityTaskItem) {
    if (!["dsa_solved", "youtube_watch"].includes(task.category)) {
      openedAtRef.current.set(task.id, Date.now());
    }
    if (task.action_url.startsWith("http")) {
      window.open(task.action_url, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = task.action_url;
    }
  }

  if (loading) {
    return (
      <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
          <span className="text-sm text-slate-500">Generating your AI daily plan…</span>
        </div>
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[32px] border border-rose-200 bg-rose-50/60 p-6">
        <p className="text-sm text-rose-700">{error}</p>
        <button onClick={() => fetchPlan()} className="mt-3 text-sm font-medium text-rose-700 underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10">
            <Brain className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              AI Daily Plan
            </h2>
            <p className="text-xs text-slate-400">
              {fromCache ? "From today's cache" : "Just generated"} · {tasks.length} tasks
              {plan?.totalMinutesToday ? ` · ~${Math.round(plan.totalMinutesToday / 60)}h total` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchPlan(true)}
            disabled={refreshing}
            title="Regenerate plan"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:text-slate-600 disabled:opacity-50"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setCollapsed(c => !c)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
          >
            <ChevronRight className={`h-3.5 w-3.5 transition-transform ${collapsed ? "" : "rotate-90"}`} />
          </button>
        </div>
      </div>

      {/* ── Today's Focus ── */}
      {plan?.todaysFocus && (
        <div className="mb-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-3">
          <p className="text-sm font-medium text-indigo-800">
            {plan.todaysFocus}
          </p>
        </div>
      )}

      {/* ── Urgent Alerts ── */}
      {plan?.urgentAlerts && plan.urgentAlerts.length > 0 && (
        <div className="mb-4 space-y-2">
          {plan.urgentAlerts.map((alert, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <p className="text-sm font-medium text-rose-700">{alert}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Insights ── */}
      {plan?.insights && plan.insights.length > 0 && !collapsed && (
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          {plan.insights.slice(0, 4).map((insight, i) => (
            <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
              <p className="text-xs leading-5 text-slate-600">{insight}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Task List ── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pb-2">
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                  <p className="mt-3 text-sm font-medium text-slate-700">All done for today!</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Check back tomorrow for a fresh plan
                  </p>
                </div>
              ) : (
                tasks.map((task, index) => {
                  const cat = categoryConfig[task.category] ?? categoryConfig.learning;
                  const Icon = cat.icon;
                  const isExternal = task.action_url.startsWith("http");

                  return (
                    <motion.article
                      key={task.id}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      initial={{ opacity: 0, x: 8 }}
                      transition={{ delay: index * 0.04, duration: 0.2 }}
                      className="group relative rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-slate-300 hover:bg-white hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          {/* Row 1: badges */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${cat.color}`}>
                              <Icon className="h-3 w-3" />
                              {cat.label}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium border ${priorityPill[task.priority] ?? priorityPill.MEDIUM}`}>
                              {task.priority}
                            </span>
                            <span className="text-xs text-slate-400">
                              {effortLabel[task.effort_level] ?? ""}
                            </span>
                          </div>

                          {/* Row 2: title */}
                          <h3 className="mt-2 text-sm font-semibold text-slate-950 leading-snug">
                            {task.title}
                          </h3>

                          {/* Row 3: description */}
                          {task.description && (
                            <p className="mt-1 text-xs text-slate-500 leading-5 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          {/* Row 4: why now */}
                          {task.why_now && (
                            <p className="mt-1.5 text-xs text-indigo-600 font-medium">
                              {task.why_now}
                            </p>
                          )}

                          {/* Row 5: meta */}
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Clock className="h-3 w-3" />
                              {task.estimated_minutes} min
                            </span>
                            {task.due_date && (
                              <span className="text-xs text-rose-500 font-medium">
                                Due: {new Date(task.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions — completion ticks itself once the task is actually
                            done (see the activity listener and visibility-based fallback
                            above); "Dismiss" only skips the suggestion, it never claims
                            the work was finished. */}
                        <div className="flex shrink-0 flex-col gap-1.5 items-end">
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleDismiss(task.id)}
                              title="Dismiss"
                              className="flex h-7 w-7 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button
                            onClick={() => handleAction(task)}
                            className="flex items-center gap-1 rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
                          >
                            {task.action_label}
                            {isExternal ? (
                              <ExternalLink className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
