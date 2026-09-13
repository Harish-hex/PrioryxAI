"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, MessageCircle, Pause, Play, TimerReset, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { priorityStyles, typeStyles } from "@/components/task-styles";
import { recordUserActivity } from "@/lib/activity-tracker";

interface Task {
  id: string | number;
  title: string;
  reason?: string;
  priority: string;
  type: string;
  deadline?: string;
  due_at?: string | null;
  estimate?: string;
}

interface FocusSessionModalProps {
  onAskAssistant: () => void;
  onClose: () => void;
  onComplete: () => void;
  task: Task | null;
}

function estimateToSeconds(estimate?: string): number {
  const minutes = parseInt(estimate?.match(/\d+/)?.[0] ?? "25", 10);
  return Math.max(5, minutes) * 60;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function FocusSessionModal({ onAskAssistant, onClose, onComplete, task }: FocusSessionModalProps) {
  const totalSeconds = useMemo(() => estimateToSeconds(task?.estimate), [task]);
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!task) return;
    setSecondsLeft(totalSeconds);
    setRunning(true);
  }, [task, totalSeconds]);

  useEffect(() => {
    if (!running || !task) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running, task]);

  const progress = totalSeconds === 0 ? 0 : Math.round(((totalSeconds - secondsLeft) / totalSeconds) * 100);
  const deadlineLabel = task?.deadline ?? (task?.due_at ? new Date(task.due_at).toLocaleString() : "No deadline");

  return (
    <AnimatePresence>
      {task && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/28 p-4 backdrop-blur-md"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <motion.section
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="neu-card w-full max-w-2xl overflow-y-auto rounded-[32px] p-6 sm:p-8 shadow-2xl"
            style={{ maxHeight: "calc(100dvh - 2rem)" }}
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="neu-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <TimerReset size={15} />
                  Focus session
                </div>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{task.title}</h2>
                {task.reason && (
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{task.reason}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="neu-btn inline-flex h-11 w-11 items-center justify-center rounded-2xl text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                aria-label="Close focus session"
              >
                <X size={18} />
              </button>
            </div>

            <div className="neu-inset mt-6 rounded-[26px] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <span className={`neu-pill rounded-full px-3.5 py-1.5 text-xs font-bold ${priorityStyles[task.priority]?.pill ?? "text-slate-600 dark:text-slate-300"}`}>
                    {priorityStyles[task.priority]?.label ?? task.priority}
                  </span>
                  <span className={`neu-pill rounded-full px-3.5 py-1.5 text-xs font-bold ${typeStyles[task.type] ?? "text-slate-600 dark:text-slate-300"}`}>
                    {task.type}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{deadlineLabel}</p>
              </div>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">{running ? "In progress" : "Paused"}</p>
                  <p className="mt-1 text-6xl font-bold leading-none tracking-tight text-slate-950 dark:text-white">{formatTime(secondsLeft)}</p>
                </div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{progress}% complete</div>
              </div>

              <div className="neu-inset mt-5 h-2.5 overflow-hidden rounded-full p-0.5">
                <div
                  className="h-full rounded-full bg-slate-950 transition-[width] duration-500 dark:bg-cyan-400"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setRunning((v) => !v)}
                className="neu-btn inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 transition dark:text-slate-200"
              >
                {running ? <Pause size={16} /> : <Play size={16} />}
                {running ? "Pause" : "Resume"}
              </button>
              <button
                type="button"
                onClick={onAskAssistant}
                className="neu-btn inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 transition dark:text-slate-200"
              >
                <MessageCircle size={16} />
                Ask AI
              </button>
              <button
                type="button"
                onClick={() => {
                  if (task) {
                    recordUserActivity("focus_session_completed", { taskId: task.id, title: task.title });
                  }
                  onComplete();
                }}
                className="neu-btn inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
              >
                <CheckCircle2 size={16} />
                Complete
              </button>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
