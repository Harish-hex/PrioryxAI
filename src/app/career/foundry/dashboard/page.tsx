"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Loader2,
  Lock,
  CheckCircle2,
  Clock,
  ArrowRight,
  Hammer,
  FileText,
  AlertCircle,
  Sparkles,
  Layers,
  Check,
  RefreshCw
} from "lucide-react";

interface ProjectData {
  id: string;
  title: string;
  description: string;
  tech_stack: string[];
  skill_gaps_addressed: string[];
  difficulty: string;
  current_phase: number;
  completion_pct: number;
  verified: boolean;
}

const PHASE_LABELS = ["Conceptualize", "Design", "Build", "Test", "Deploy", "Review"];
const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
  foundation: { label: "Foundation", color: "text-emerald-700 dark:text-emerald-400 border-emerald-500/30", dotColor: "bg-emerald-500" },
  intermediate: { label: "Intermediate", color: "text-amber-700 dark:text-amber-400 border-amber-500/30", dotColor: "bg-amber-500" },
  advanced: { label: "Advanced", color: "text-rose-700 dark:text-rose-400 border-rose-500/30", dotColor: "bg-rose-500" },
};

export default function FoundryDashboard() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(true);
  const [resumeValid, setResumeValid] = useState(true);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    fetch("/api/foundry/generate")
      .then((res) => res.json())
      .then((data) => {
        setProjects(data.projects ?? []);
        if (data.resumeUploaded !== undefined) setResumeUploaded(data.resumeUploaded);
        if (data.resumeValid !== undefined) setResumeValid(data.resumeValid);
      })
      .catch((err) => console.error("[Foundry UI] Error fetching projects:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateError(null);
    try {
      const response = await fetch("/api/foundry/generate", { method: "POST" });
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown server error' }));
        setGenerateError(err.error ?? `Error ${response.status}`);
        setGenerating(false);
        return;
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.projects) {
                const res = await fetch("/api/foundry/generate");
                const fresh = await res.json();
                setProjects(fresh.projects ?? []);
              }
              if (data.error) {
                setGenerateError(data.error);
              }
            } catch (e) {
              console.error("[Foundry UI] SSE JSON parse error", e);
            }
          }
        }
      }
    } catch (e) {
      console.error("[Foundry UI] Generate request failed", e);
      setGenerateError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="neu-card rounded-[28px] p-12 flex flex-col items-center justify-center text-center space-y-4">
        <Loader2 size={32} className="animate-spin text-cyan-500" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Loading Project Foundry portfolio...</p>
      </div>
    );
  }

  if (!resumeUploaded) {
    return (
      <div className="space-y-6">
        <header className="neu-card rounded-[28px] p-6 sm:p-7">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
            <img src="/logo.png" alt="PrioryxAI" className="h-4 w-4 shrink-0 object-contain" />
            <span>AI Career Guidance</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Project Foundry
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Build verified portfolio projects custom-tailored to bridge your resume skill gaps.
          </p>
        </header>

        <div className="neu-card rounded-[28px] p-10 md:p-14 text-center space-y-4 max-w-xl mx-auto">
          <div className="neu-pill-inset h-16 w-16 rounded-2xl flex items-center justify-center text-indigo-500 mx-auto">
            <FileText size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">Upload your resume first</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Project Foundry reads your technical competencies from your resume to suggest high-impact, personalized projects.
          </p>
          <div className="pt-2">
            <Link
              href="/career/resume/upload"
              className="neu-btn inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              <span>Upload Resume</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!resumeValid) {
    return (
      <div className="space-y-6">
        <header className="neu-card rounded-[28px] p-6 sm:p-7">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
            <img src="/logo.png" alt="PrioryxAI" className="h-4 w-4 shrink-0 object-contain" />
            <span>AI Career Guidance</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Project Foundry
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Build verified portfolio projects custom-tailored to bridge your resume skill gaps.
          </p>
        </header>

        <div className="neu-card rounded-[28px] p-10 md:p-14 text-center space-y-4 max-w-xl mx-auto">
          <div className="neu-pill-inset h-16 w-16 rounded-2xl flex items-center justify-center text-amber-500 mx-auto">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">No skills detected in resume</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            We couldn't detect technical skills in your uploaded resume. Please re-upload a resume with clear programming languages and tools.
          </p>
          <div className="pt-2">
            <Link
              href="/career/resume/upload"
              className="neu-btn inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              <span>Re-upload Resume</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <header className="neu-card rounded-[28px] p-6 sm:p-7">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
            <img src="/logo.png" alt="PrioryxAI" className="h-4 w-4 shrink-0 object-contain" />
            <span>AI Career Guidance</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Project Foundry
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Build verified portfolio projects custom-tailored to bridge your resume skill gaps.
          </p>
        </header>

        <div className="neu-card rounded-[28px] p-10 md:p-14 text-center space-y-4 max-w-xl mx-auto">
          <div className="neu-pill-inset h-16 w-16 rounded-2xl flex items-center justify-center text-cyan-500 mx-auto">
            <Hammer size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">Ready to generate your projects</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            We've analysed your resume. Click below to generate 9 personalized project architectures across Foundation, Intermediate, and Advanced tiers.
          </p>

          {generateError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs">
              {generateError}
            </div>
          )}

          {generating ? (
            <div className="flex flex-col items-center pt-3 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
              <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 animate-pulse">Generating your custom projects...</p>
              <p className="text-xs text-slate-400">Synthesizing full architectures and milestones</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handleGenerate}
                className="neu-btn inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
              >
                <Hammer size={16} />
                <span>Generate Projects</span>
              </button>
              <Link
                href="/career/resume/upload"
                className="neu-btn inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 dark:text-slate-300"
              >
                <span>Re-sync Resume</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  const filteredProjects = activeTab === "all"
    ? projects
    : projects.filter((p) => p.difficulty.toLowerCase() === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="neu-card rounded-[28px] p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
              <img src="/logo.png" alt="PrioryxAI" className="h-4 w-4 shrink-0 object-contain" />
              <span>AI Career Guidance</span>
            </div>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Project Foundry
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {projects.length} custom-tailored projects crafted to close resume skill gaps and build interview-grade work.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="neu-btn inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-50"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              <span>{generating ? "Regenerating..." : "Regenerate"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Difficulty Filter Tabs */}
      <div className="neu-card rounded-[24px] p-2 flex items-center gap-2 overflow-x-auto">
        {[
          { id: "all", label: "All Projects", count: projects.length },
          { id: "foundation", label: "Foundation", count: projects.filter(p => p.difficulty === "foundation").length },
          { id: "intermediate", label: "Intermediate", count: projects.filter(p => p.difficulty === "intermediate").length },
          { id: "advanced", label: "Advanced", count: projects.filter(p => p.difficulty === "advanced").length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
              activeTab === tab.id
                ? "neu-inset text-slate-950 dark:text-white bg-slate-100/60 dark:bg-white/10"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project, i) => {
          const diffCfg = DIFFICULTY_CONFIG[project.difficulty] ?? DIFFICULTY_CONFIG.foundation;
          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="neu-card rounded-[28px] p-6 flex flex-col justify-between hover:scale-[1.01] transition-transform"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base text-slate-950 dark:text-white leading-snug">
                    {project.title}
                  </h3>
                  <span className={`neu-pill shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${diffCfg.color}`}>
                    {diffCfg.label}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-3">
                  {project.description}
                </p>

                {/* Skill Gaps Addressed */}
                {project.skill_gaps_addressed && project.skill_gaps_addressed.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                      Bridges Gaps
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {project.skill_gaps_addressed.map((gap) => (
                        <span key={gap} className="neu-pill rounded-full px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:text-indigo-300">
                          {gap}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {project.tech_stack.map((tech) => (
                    <span key={tech} className="neu-pill rounded-lg px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Progress & Actions */}
              <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Phase {project.current_phase}/6 · {PHASE_LABELS[project.current_phase - 1]}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{project.completion_pct}%</span>
                </div>

                {/* Inset progress bar */}
                <div className="neu-inset h-2 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                    style={{ width: `${project.completion_pct}%` }}
                  />
                </div>

                {/* Phase Steps Indicator */}
                <div className="grid grid-cols-6 gap-1 pt-1">
                  {PHASE_LABELS.map((_, idx) => (
                    <div key={idx} className="flex justify-center">
                      {idx < project.current_phase - 1 ? (
                        <CheckCircle2 size={13} className="text-emerald-500" />
                      ) : idx === project.current_phase - 1 ? (
                        <Clock size={13} className="text-cyan-500" />
                      ) : (
                        <Lock size={11} className="text-slate-400 dark:text-slate-600" />
                      )}
                    </div>
                  ))}
                </div>

                <Link
                  href={`/career/foundry/project/${project.id}`}
                  className="neu-btn mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                >
                  <span>Enter Workspace</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
