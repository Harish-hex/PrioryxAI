"use client";

import { useEffect, useState } from "react";
import { Check, CheckCircle2, Code2, ExternalLink, Play, BookOpen, Flame, Plus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { getDailyChallenges, type CodingProblem } from "@/lib/daily-challenges";

interface DailyChallengesCardProps {
  onAddTask?: (taskText: string) => void;
}

const difficultyStyles = {
  Easy: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  Medium: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  Hard: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
};

export function DailyChallengesCard({ onAddTask }: DailyChallengesCardProps) {
  const [challenges, setChallenges] = useState<CodingProblem[]>([]);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [todayKey, setTodayKey] = useState<string>("");

  useEffect(() => {
    const today = new Date();
    const key = `prioryx_daily_solved_${today.toISOString().slice(0, 10)}`;
    setTodayKey(key);

    const daily = getDailyChallenges(today);
    setChallenges(daily);

    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        setSolvedIds(new Set(JSON.parse(saved) as string[]));
      }
    } catch {}
  }, []);

  const toggleSolved = (id: string) => {
    setSolvedIds((prev) => {
      const next = new Set(Array.from(prev));
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        if (todayKey) {
          localStorage.setItem(todayKey, JSON.stringify(Array.from(next)));
        }
      } catch {}
      return next;
    });
  };

  const handleAddAsTask = (p: CodingProblem) => {
    if (!onAddTask) return;
    onAddTask(`DSA Practice: ${p.title} (${p.category})`);
    setAddedIds((prev) => new Set(Array.from(prev).concat(p.id)));
  };

  const solvedCount = challenges.filter((c) => solvedIds.has(c.id)).length;
  const isAllCompleted = challenges.length > 0 && solvedCount === challenges.length;

  return (
    <div className="neu-card overflow-hidden rounded-[28px] p-5 sm:rounded-[32px] sm:p-7">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 pb-5 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-400">
            <Code2 size={15} /> Daily DSA Workout (3 Questions)
          </div>
          <h2 className="mt-1.5 text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
            Curious Freaks Coding Challenge
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
            Handpicked 3 problems daily from the 450+ question master sheet.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="neu-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold sm:text-sm">
            <Flame size={15} className="text-amber-500" />
            <span className="text-slate-950 dark:text-white">
              {solvedCount} / {challenges.length} Solved
            </span>
          </div>

          {isAllCompleted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Sparkles size={13} /> Daily Goal Met!
            </span>
          )}
        </div>
      </div>

      {/* 3 Questions List */}
      <div className="mt-5 space-y-3.5">
        {challenges.map((prob, idx) => {
          const isSolved = solvedIds.has(prob.id);
          const isAdded = addedIds.has(prob.id);

          return (
            <motion.div
              key={prob.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`neu-raised-sm rounded-[22px] p-4 transition-all duration-200 hover:neu-card ${
                isSolved ? "opacity-80" : ""
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Problem Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Difficulty Badge */}
                    <span
                      className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-bold ${
                        difficultyStyles[prob.difficulty] || difficultyStyles.Medium
                      }`}
                    >
                      {prob.difficulty}
                    </span>

                    {/* Topic Pill */}
                    <span className="neu-pill rounded-lg px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      {prob.category} · {prob.topic}
                    </span>
                  </div>

                  <h3
                    className={`mt-2 text-sm font-bold text-slate-950 dark:text-white sm:text-base ${
                      isSolved ? "line-through text-slate-400 dark:text-slate-400" : ""
                    }`}
                  >
                    {prob.title}
                  </h3>
                </div>

                {/* Actions & Links */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Solve Link */}
                  {prob.problemLink && (
                    <a
                      href={prob.problemLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="neu-btn inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                    >
                      <Code2 size={13} className="text-cyan-500" />
                      <span>Solve</span>
                      <ExternalLink size={11} className="opacity-60" />
                    </a>
                  )}

                  {/* Video Tutorial */}
                  {prob.solutionVideo && (
                    <a
                      href={prob.solutionVideo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="neu-btn inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      <Play size={12} className="fill-current" />
                      <span>Video</span>
                    </a>
                  )}

                  {/* Article Link */}
                  {prob.solutionArticle && (
                    <a
                      href={prob.solutionArticle}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="neu-btn inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
                    >
                      <BookOpen size={12} />
                      <span>Article</span>
                    </a>
                  )}

                  {/* Add to priority queue */}
                  {onAddTask && (
                    <button
                      type="button"
                      onClick={() => handleAddAsTask(prob)}
                      disabled={isAdded}
                      title="Add to daily task list"
                      className={`neu-btn inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold ${
                        isAdded
                          ? "text-emerald-600 opacity-60"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
                      }`}
                    >
                      {isAdded ? <Check size={13} /> : <Plus size={13} />}
                      <span className="hidden sm:inline">{isAdded ? "Added" : "Task"}</span>
                    </button>
                  )}

                  {/* Solved Checkbox Button */}
                  <button
                    type="button"
                    onClick={() => toggleSolved(prob.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200 ${
                      isSolved
                        ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                        : "neu-btn text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                    }`}
                  >
                    <CheckCircle2 size={13} className={isSolved ? "fill-white text-emerald-600" : ""} />
                    <span>{isSolved ? "Solved" : "Mark Solved"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
