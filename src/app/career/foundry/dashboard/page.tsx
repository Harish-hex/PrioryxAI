"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Sparkles,
  Lock,
  CheckCircle2,
  Clock,
  ArrowRight,
  Hammer,
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
const DIFFICULTY_COLORS: Record<string, string> = {
  foundation: "border-emerald-500/30 text-emerald-400",
  intermediate: "border-amber-500/30 text-amber-400",
  advanced: "border-rose-500/30 text-rose-400",
};

export default function FoundryDashboard() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(true);
  const [resumeValid, setResumeValid] = useState(true);

  useEffect(() => {
    fetch("/api/foundry/generate")
      .then((res) => res.json())
      .then((data) => {
        setProjects(data.projects ?? []);
        if (data.resumeUploaded !== undefined) setResumeUploaded(data.resumeUploaded);
        if (data.resumeValid !== undefined) setResumeValid(data.resumeValid);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/foundry/generate", { method: "POST" });
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
            const data = JSON.parse(line.slice(6));
            if (data.projects) {
              // Refresh from server after generation
              const res = await fetch("/api/foundry/generate");
              const fresh = await res.json();
              setProjects(fresh.projects ?? []);
            }
          }
        }
      }
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!resumeUploaded) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-4xl mb-4">📋</div>
        <h2 className="text-xl font-semibold mb-2">Upload your resume first</h2>
        <p className="text-neutral-500 mb-6 max-w-sm">
          Project Foundry reads your skills from your resume to suggest personalised projects.
        </p>
        <a href="/career/resume/upload" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">
          Upload Resume
        </a>
      </div>
    );
  }

  if (!resumeValid) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold mb-2">No skills found in resume</h2>
        <p className="text-neutral-500 mb-6 max-w-sm">
          We couldn't detect any technical skills in your resume. Please ensure your resume lists your programming languages and tools, and upload it again.
        </p>
        <a href="/career/resume/upload" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">
          Upload Updated Resume
        </a>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-4xl mb-4">✨</div>
        <h2 className="text-2xl font-bold mb-3">Ready to generate your projects</h2>
        <p className="text-slate-500 max-w-md mb-8">
          We've analysed your resume. Click below to generate 9 personalised project ideas that will bridge your skill gaps.
        </p>
        
        {generating ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
            <p className="text-indigo-600 font-medium animate-pulse">Generating your custom projects...</p>
            <p className="text-slate-400 text-sm mt-2">This usually takes 15-30 seconds using GPT-4</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button
              onClick={handleGenerate}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium flex items-center justify-center gap-2 transition shadow-sm hover:shadow-md"
            >
              <Sparkles className="w-5 h-5" />
              Generate Projects
            </button>
            <a href="/career/resume/upload" className="text-sm text-slate-500 hover:text-indigo-600 transition">
              Or re-sync from a new resume
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold flex items-center gap-3">
              <Hammer className="text-amber-400" size={28} />
              Project Foundry
            </h1>
            <p className="text-neutral-500 mt-1">
              {projects.length > 0
                ? `${projects.length} personalized projects based on your skill gaps`
                : "Generate projects from your resume analysis"}
            </p>
          </div>
          {/* Empty state handled above */}
        </div>

        {/* Difficulty sections */}
        {["foundation", "intermediate", "advanced"].map((diff) => {
          const group = projects.filter((p) => p.difficulty === diff);
          if (group.length === 0) return null;
          return (
            <div key={diff} className="mb-10">
              <h2 className="text-lg font-semibold mb-4 capitalize flex items-center gap-2">
                <span className={`inline-block h-2 w-2 rounded-full ${
                  diff === "foundation" ? "bg-emerald-400" : diff === "intermediate" ? "bg-amber-400" : "bg-rose-400"
                }`} />
                {diff} Projects
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.map((project, i) => (
                  <motion.a
                    key={project.id}
                    href={`/career/foundry/project/${project.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group rounded-xl border border-slate-200 bg-white/[0.02] p-5 transition hover:border-white/20 hover:bg-white/[0.04]"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-sm pr-2">{project.title}</h3>
                      <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium ${DIFFICULTY_COLORS[project.difficulty] ?? ""}`}>
                        {project.difficulty}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-neutral-500 line-clamp-2">
                      {project.description}
                    </p>

                    {/* Tech stack */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {project.tech_stack.slice(0, 4).map((t) => (
                        <span key={t} className="rounded px-1.5 py-0.5 text-[10px] border border-slate-200 bg-slate-50 text-neutral-500">
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Phase progress */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1">
                        <span>Phase {project.current_phase}/6 · {PHASE_LABELS[project.current_phase - 1]}</span>
                        <span>{project.completion_pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-50">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                          style={{ width: `${project.completion_pct}%` }}
                        />
                      </div>
                      <div className="mt-2 flex gap-1">
                        {PHASE_LABELS.map((_, idx) => (
                          <div key={idx} className="flex-1 flex items-center justify-center">
                            {idx < project.current_phase - 1 ? (
                              <CheckCircle2 size={12} className="text-emerald-400" />
                            ) : idx === project.current_phase - 1 ? (
                              <Clock size={12} className="text-indigo-400" />
                            ) : (
                              <Lock size={10} className="text-neutral-600" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {project.verified && (
                      <div className="mt-3 inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400 font-medium">
                        <CheckCircle2 size={10} /> Verified
                      </div>
                    )}
                  </motion.a>
                ))}
              </div>
            </div>
          );
        })}

        {projects.length === 0 && !generating && (
          <div className="text-center py-20">
            <Hammer size={48} className="mx-auto text-neutral-700 mb-4" />
            <p className="text-neutral-500">No projects yet. Upload your resume first, then generate projects.</p>
            <a href="/career/resume/upload" className="inline-flex items-center gap-2 mt-4 text-indigo-400 text-sm hover:text-indigo-300">
              Upload Resume <ArrowRight size={14} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
