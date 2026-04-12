"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, MessageCircle, Pause, Play, TimerReset, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { priorityStyles, typeStyles } from "@/components/task-styles";

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
            className="glass-strong w-full max-w-2xl rounded-[32px] p-6 sm:p-7"
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600">
                  <TimerReset size={15} />
                  Focus session
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{task.title}</h2>
                {task.reason && (
                  <p className="mt-2 text-sm leading-6 text-slate-500">{task.reason}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                aria-label="Close focus session"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1.5 text-sm ${priorityStyles[task.priority]?.pill ?? "border border-slate-200 bg-white text-slate-600"}`}>
                    {priorityStyles[task.priority]?.label ?? task.priority}
                  </span>
                  <span className={`rounded-full px-3 py-1.5 text-sm ${typeStyles[task.type] ?? "border border-slate-200 bg-white text-slate-600"}`}>
                    {task.type}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{deadlineLabel}</p>
              </div>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">{running ? "In progress" : "Paused"}</p>
                  <p className="mt-1 text-6xl font-semibold leading-none tracking-tight text-slate-950">{formatTime(secondsLeft)}</p>
                </div>
                <div className="text-sm text-slate-500">{progress}% complete</div>
              </div>

              <div className="mt-5 h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-slate-900 transition-[width] duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setRunning((v) => !v)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                {running ? <Pause size={16} /> : <Play size={16} />}
                {running ? "Pause" : "Resume"}
              </button>
              <button
                type="button"
                onClick={onAskAssistant}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <MessageCircle size={16} />
                Ask AI
              </button>
              <button
                type="button"
                onClick={onComplete}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
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
