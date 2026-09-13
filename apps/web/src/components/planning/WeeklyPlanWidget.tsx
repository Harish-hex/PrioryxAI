"use client";

import { useEffect, useState } from "react";
import { Loader2, CalendarDays } from "lucide-react";

interface WeeklyTask {
  id: string;
  title: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  estimatedMinutes: number;
  block: string;
}

interface DaySchedule {
  day: string;
  date: string;
  isWeekend: boolean;
  tasks: WeeklyTask[];
  totalMinutes: number;
}

interface WeeklySchedule {
  weekStart: string;
  days: DaySchedule[];
}

const PRIORITY_DOT: Record<string, string> = {
  CRITICAL: "bg-rose-500",
  HIGH: "bg-amber-500",
  MEDIUM: "bg-cyan-500",
  LOW: "bg-slate-400",
};

export function WeeklyPlanWidget() {
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/planning/weekly")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setSchedule(data.schedule ?? null);
        }
      })
      .catch(() => setError("Could not load weekly plan."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="neu-card rounded-2xl p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !schedule) {
    return null;
  }

  return (
    <div className="neu-card rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays size={16} className="text-indigo-500" />
        <h2 className="font-semibold text-slate-950 dark:text-white">This Week&apos;s Plan</h2>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        Weekday evenings (6:30–10:00 PM after college) plus a longer productive Sunday.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {schedule.days.map((day) => (
          <div
            key={day.date}
            className={`rounded-xl p-3 ${day.isWeekend ? "neu-pill-inset border border-emerald-500/20" : "neu-inset"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{day.day}</span>
              {day.isWeekend && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  Deep work
                </span>
              )}
            </div>
            {day.tasks.length === 0 ? (
              <p className="text-[11px] text-slate-400 dark:text-slate-500">No tasks scheduled</p>
            ) : (
              <ul className="space-y-1.5">
                {day.tasks.map((task) => (
                  <li key={task.id} className="flex items-start gap-1.5 text-[11px] leading-4">
                    <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[task.priority] ?? "bg-slate-400"}`} />
                    <span className="text-slate-600 dark:text-slate-300 line-clamp-2">{task.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
