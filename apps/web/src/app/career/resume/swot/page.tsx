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
import { friendlyError } from '@/components/ui/feedback';

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
        // Normalize skills into SkillEntity[]
        let rawSkills = data.skills;
        if (rawSkills && typeof rawSkills === 'object' && !Array.isArray(rawSkills)) {
          rawSkills = rawSkills.skills || [];
        }
        const normalizedSkills: SkillEntity[] = (Array.isArray(rawSkills) ? rawSkills : []).map((s: any) => {
          if (typeof s === 'string') {
            return {
              name: s,
              category: 'Technical',
              proficiency: 75,
              evidence: 'Resume extraction',
            };
          }
          return {
            name: s.name || 'Skill',
            category: s.category || 'Technical',
            proficiency: typeof s.proficiency === 'number' ? s.proficiency : 75,
            evidence: s.evidence || 'Resume',
          };
        });

        // Normalize SWOT into SWOTAnalysis
        const rawSwot = data.swot || {};
        const normalizeQuadrant = (items: any): SWOTItem[] => {
          if (!Array.isArray(items)) return [];
          return items.map((item: any) => {
            if (typeof item === 'string') {
              return {
                title: item,
                description: item,
                relatedSkills: [],
                priority: 'medium',
              };
            }
            return {
              title: item.title || item.name || 'Insight',
              description: item.description || item.title || '',
              relatedSkills: Array.isArray(item.relatedSkills) ? item.relatedSkills : [],
              priority: item.priority || 'medium',
            };
          });
        };

        const normalizedSwot: SWOTAnalysis = {
          strengths: normalizeQuadrant(rawSwot.strengths),
          weaknesses: normalizeQuadrant(rawSwot.weaknesses),
          opportunities: normalizeQuadrant(rawSwot.opportunities),
          threats: normalizeQuadrant(rawSwot.threats),
        };

        setSkills(normalizedSkills);
        setSwot(normalizedSwot);
      })
      .catch((err) => setError(friendlyError(err)))
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
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="neu-card rounded-[32px] p-8 sm:p-10 border border-slate-200 dark:border-white/10 text-center relative overflow-hidden">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-5">
            <Shield size={32} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            No Resume SWOT Generated Yet
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
            Upload your resume to extract skills, calculate ATS match, and generate a 4-quadrant SWOT analysis to identify your strengths and critical skill gaps.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <a
              href="/career/resume/upload"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-lg"
            >
              Upload Resume <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Radar chart data — aggregate skills by category
  const categoryScores: Record<string, { total: number; count: number }> = {};
  for (const skill of skills) {
    const cat = skill.category || 'General';
    if (!categoryScores[cat]) {
      categoryScores[cat] = { total: 0, count: 0 };
    }
    categoryScores[cat].total += skill.proficiency || 70;
    categoryScores[cat].count += 1;
  }

  let radarData = Object.entries(categoryScores).map(([cat, { total, count }]) => ({
    category: cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    score: Math.round(total / count),
    fullMark: 100,
  }));

  if (radarData.length === 0) {
    radarData = [
      { category: 'Core Languages', score: 80, fullMark: 100 },
      { category: 'Frameworks', score: 75, fullMark: 100 },
      { category: 'Databases', score: 70, fullMark: 100 },
      { category: 'DevOps & Cloud', score: 65, fullMark: 100 },
      { category: 'Problem Solving', score: 85, fullMark: 100 },
    ];
  }


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
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white p-6">
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
                {((swot[key] as SWOTItem[]) ?? []).map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-black/30 p-3"
                  >
                    <p className="font-medium text-sm">{item?.title || 'Insight'}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {item?.description || ''}
                    </p>
                    {(item?.relatedSkills?.length ?? 0) > 0 && (
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
                {((swot[key] as SWOTItem[]) ?? []).length === 0 && (
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
