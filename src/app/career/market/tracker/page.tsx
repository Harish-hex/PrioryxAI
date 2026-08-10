"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, KanbanSquare, GripVertical } from "lucide-react";

interface Application {
  id: string;
  job_title: string;
  company: string;
  match_score: number;
  status: string;
  applied_at: string | null;
  notes: string | null;
}

const COLUMNS = ["saved", "applied", "interview", "offer", "rejected"] as const;
const COLUMN_COLORS: Record<string, string> = {
  saved: "border-neutral-500/30",
  applied: "border-blue-500/30",
  interview: "border-amber-500/30",
  offer: "border-emerald-500/30",
  rejected: "border-rose-500/30",
};

export default function ApplicationTrackerPage() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    fetch("/api/career/market/applications")
      .then((res) => res.json())
      .then((data) => setApplications(data.applications ?? []))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    await fetch("/api/career/market/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold flex items-center gap-3 mb-6">
          <KanbanSquare className="text-blue-400" size={28} />
          Application Tracker
        </h1>

        <div className="grid grid-cols-5 gap-4 min-h-[60vh]">
          {COLUMNS.map((col) => {
            const items = applications.filter((a) => a.status === col);
            return (
              <div key={col} className={`rounded-xl border ${COLUMN_COLORS[col]} bg-white/[0.01] p-3`}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3 text-center">
                  {col} ({items.length})
                </h3>
                <div className="space-y-2">
                  {items.map((app) => (
                    <motion.div
                      key={app.id}
                      layout
                      className="rounded-lg border border-slate-200 bg-white/[0.03] p-3 group"
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical size={14} className="text-neutral-700 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{app.job_title}</p>
                          <p className="text-[10px] text-neutral-500 truncate">{app.company}</p>
                          <div className="mt-1.5 flex gap-1 flex-wrap">
                            {COLUMNS.filter((c) => c !== col).map((target) => (
                              <button
                                key={target}
                                onClick={() => updateStatus(app.id, target)}
                                className="rounded px-1.5 py-0.5 text-[9px] border border-slate-200 bg-slate-50 text-neutral-500 hover:text-slate-900 hover:border-white/20 transition opacity-0 group-hover:opacity-100"
                              >
                                → {target}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
