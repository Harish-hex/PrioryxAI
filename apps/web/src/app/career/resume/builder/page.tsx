"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, FileCheck, Download, Gauge } from "lucide-react";

export default function ResumeBuilderPage() {
  const [loading, setLoading] = useState(true);
  const [resumeData, setResumeData] = useState<Record<string, unknown> | null>(null);
  const [atsScore, setAtsScore] = useState(0);

  useEffect(() => {
    fetch("/api/career/resume/swot")
      .then((res) => res.json())
      .then((data) => {
        setResumeData(data);
        setAtsScore(data.atsScore ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  const skills = (resumeData?.skills ?? []) as Array<{ name: string; proficiency: number; category: string }>;
  const verifiedSkills = skills.filter((s) => s.proficiency >= 50);

  return (
    <div className="min-h-screen bg-white text-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold flex items-center gap-3 mb-2">
          <FileCheck className="text-emerald-400" size={28} />
          Resume Builder
        </h1>
        <p className="text-neutral-500 mb-8">
          Build a verified, ATS-optimized resume from your completed projects
        </p>

        {/* ATS Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 bg-white/[0.02] p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Gauge size={18} className="text-indigo-400" />
              ATS Compatibility Score
            </h2>
            <span className={`text-2xl font-bold ${
              atsScore >= 80 ? "text-emerald-400" : atsScore >= 50 ? "text-amber-400" : "text-rose-400"
            }`}>
              {atsScore}/100
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-50 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${atsScore}%` }}
              transition={{ duration: 1 }}
              className={`h-full rounded-full ${
                atsScore >= 80 ? "bg-emerald-500" : atsScore >= 50 ? "bg-amber-500" : "bg-rose-500"
              }`}
            />
          </div>
        </motion.div>

        {/* Verified Skills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-slate-200 bg-white/[0.02] p-6 mb-6"
        >
          <h2 className="text-lg font-semibold mb-4">Verified Skills ({verifiedSkills.length})</h2>
          <div className="flex flex-wrap gap-2">
            {verifiedSkills.map((skill, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300"
              >
                {skill.name}
                <span className="text-[10px] opacity-60">{skill.proficiency}%</span>
              </span>
            ))}
          </div>
        </motion.div>

        {/* Resume Preview / Template */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-slate-200 bg-white/[0.02] p-8"
        >
          <div className="prose prose-invert prose-sm max-w-none">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
              Professional Summary
            </h2>
            <p className="text-neutral-500 text-sm italic">
              A motivated engineering student with verified skills in{" "}
              {verifiedSkills.slice(0, 5).map((s) => s.name).join(", ")}
              {verifiedSkills.length > 5 ? ` and ${verifiedSkills.length - 5} more` : ""}.
              Actively building portfolio projects through structured learning phases.
            </p>

            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mt-6 mb-4">
              Technical Skills
            </h2>
            <div className="space-y-2">
              {Object.entries(
                verifiedSkills.reduce<Record<string, string[]>>((acc, s) => {
                  if (!acc[s.category]) acc[s.category] = [];
                  acc[s.category].push(s.name);
                  return acc;
                }, {})
              ).map(([cat, names]) => (
                <p key={cat} className="text-sm">
                  <span className="font-semibold text-neutral-700 capitalize">
                    {cat.replace(/_/g, " ")}:
                  </span>{" "}
                  <span className="text-neutral-500">{names.join(", ")}</span>
                </p>
              ))}
            </div>

            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mt-6 mb-4">
              Projects (Verified)
            </h2>
            <p className="text-neutral-500 italic text-sm">
              Complete projects in the Project Foundry to add STAR-format entries here.
            </p>
          </div>
        </motion.div>

        {/* Export */}
        <div className="mt-6 flex gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-6 py-3 text-sm font-semibold transition hover:bg-indigo-400">
            <Download size={16} /> Export PDF
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-6 py-3 text-sm font-semibold transition hover:bg-slate-100">
            <Download size={16} /> Export DOCX
          </button>
        </div>
      </div>
    </div>
  );
}
