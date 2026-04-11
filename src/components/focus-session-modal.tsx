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
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-xl"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <motion.section
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-strong w-full max-w-2xl rounded-lg p-5"
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-volt/20 bg-volt/10 px-3 py-1.5 text-sm text-volt">
                  <TimerReset size={15} />
                  Focus session
                </div>
                <h2 className="mt-4 text-2xl font-semibold leading-tight text-white">{task.title}</h2>
                {task.reason && (
                  <p className="mt-2 text-sm leading-6 text-neutral-400">{task.reason}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/10 bg-white/[0.05] p-2 text-neutral-400 transition hover:text-white"
                aria-label="Close focus session"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 rounded-lg border border-white/10 bg-black/35 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-lg px-3 py-1.5 text-sm ${priorityStyles[task.priority]?.pill ?? ""}`}>
                    {priorityStyles[task.priority]?.label ?? task.priority}
                  </span>
                  <span className={`rounded-lg px-3 py-1.5 text-sm ${typeStyles[task.type] ?? "border border-white/10 bg-white/[0.06] text-neutral-200"}`}>
                    {task.type}
                  </span>
                </div>
                <p className="text-sm text-neutral-400">{deadlineLabel}</p>
              </div>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm text-neutral-500">{running ? "In progress" : "Paused"}</p>
                  <p className="mt-1 text-6xl font-semibold leading-none text-white">{formatTime(secondsLeft)}</p>
                </div>
                <div className="text-sm text-neutral-500">{progress}% complete</div>
              </div>

              <div className="mt-5 h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-aura via-volt to-mint transition-[width] duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setRunning((v) => !v)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.1]"
              >
                {running ? <Pause size={16} /> : <Play size={16} />}
                {running ? "Pause" : "Resume"}
              </button>
              <button
                type="button"
                onClick={onAskAssistant}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.1]"
              >
                <MessageCircle size={16} />
                Ask AI
              </button>
              <button
                type="button"
                onClick={onComplete}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black transition hover:scale-[1.02] hover:bg-neutral-100"
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
