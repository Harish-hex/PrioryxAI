"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  Zap,
  Loader2,
  ArrowRight,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import type { SkillEntity, SWOTAnalysis, SWOTItem } from "@/lib/mcp/types";

export default function SWOTPage() {
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<SkillEntity[]>([]);
  const [swot, setSwot] = useState<SWOTAnalysis | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/career/resume/swot")
      .then((res) => {
        if (!res.ok) throw new Error("No resume data found");
        return res.json();
      })
      .then((data) => {
        setSkills(data.skills ?? []);
        setSwot(data.swot ?? null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error || !swot) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center gap-4">
        <AlertTriangle size={32} className="text-amber-400" />
        <p className="text-neutral-500">{error || "No analysis found"}</p>
        <a
          href="/career/resume/upload"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold"
        >
          Upload Resume <ArrowRight size={16} />
        </a>
      </div>
    );
  }

  // Radar chart data — aggregate skills by category
  const categoryScores: Record<string, { total: number; count: number }> = {};
  for (const skill of skills) {
    if (!categoryScores[skill.category]) {
      categoryScores[skill.category] = { total: 0, count: 0 };
    }
    categoryScores[skill.category].total += skill.proficiency;
    categoryScores[skill.category].count += 1;
  }

  const radarData = Object.entries(categoryScores).map(([cat, { total, count }]) => ({
    category: cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    score: Math.round(total / count),
    fullMark: 100,
  }));

  const quadrantConfig: Array<{
    key: keyof SWOTAnalysis;
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: typeof Shield;
  }> = [
    { key: "strengths", label: "Strengths", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: Shield },
    { key: "weaknesses", label: "Weaknesses", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: AlertTriangle },
    { key: "opportunities", label: "Opportunities", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: TrendingUp },
    { key: "threats", label: "Threats", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-semibold mb-2">SWOT Analysis</h1>
        <p className="text-neutral-500 mb-8">
          AI-generated career assessment based on your resume skills
        </p>

        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 bg-white/[0.02] p-6 mb-8"
        >
          <h2 className="text-lg font-semibold mb-4">Skill Radar</h2>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#ffffff10" />
                <PolarAngleAxis dataKey="category" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                <PolarRadiusAxis tick={{ fill: "#71717a", fontSize: 10 }} domain={[0, 100]} />
                <Radar
                  name="Skills"
                  dataKey="score"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* SWOT Quadrants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quadrantConfig.map(({ key, label, color, bg, border, icon: Icon }, idx) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`rounded-2xl border ${border} ${bg} p-6`}
            >
              <h3 className={`text-lg font-semibold flex items-center gap-2 ${color}`}>
                <Icon size={20} />
                {label}
              </h3>
              <div className="mt-4 space-y-3">
                {(swot[key] as SWOTItem[]).map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-white/5 bg-black/30 p-3"
                  >
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {item.description}
                    </p>
                    {item.relatedSkills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.relatedSkills.map((s) => (
                          <span
                            key={s}
                            className="rounded px-1.5 py-0.5 text-[10px] border border-slate-200 bg-slate-50 text-neutral-500"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {(swot[key] as SWOTItem[]).length === 0 && (
                  <p className="text-sm text-neutral-600 italic">No items detected</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex gap-3"
        >
          <a
            href="/career/foundry/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-6 py-3 text-sm font-semibold transition hover:bg-indigo-400"
          >
            Generate Projects from Gaps <ArrowRight size={16} />
          </a>
          <a
            href="/career/resume/builder"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-6 py-3 text-sm font-semibold transition hover:bg-slate-100"
          >
            Build Resume
          </a>
        </motion.div>
      </div>
    </div>
  );
}
