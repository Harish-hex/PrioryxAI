"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  Code2,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Award,
  Calendar,
  Layers,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

const TopicRadarChart = dynamic(
  () => import("@/components/leetcode/TopicRadarChart").then((mod) => mod.TopicRadarChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 animate-pulse bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" />
      </div>
    ),
  }
);

const ContestRatingChart = dynamic(
  () => import("@/components/leetcode/ContestRatingChart").then((mod) => mod.ContestRatingChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 animate-pulse bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" />
      </div>
    ),
  }
);

const ContributionHeatmap = dynamic(
  () => import("@/components/leetcode/ContributionHeatmap").then((mod) => mod.ContributionHeatmap),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 animate-pulse bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" />
      </div>
    ),
  }
);

import { PriorityTopicTable } from "@/components/leetcode/PriorityTopicTable";

// Mock demo dataset for previewing without a live connected profile
const DEMO_ANALYSIS = {
  placement_readiness: "HIGH_READINESS",
  score_breakdown: {
    dsa_mastery: 22,
    problem_solving_depth: 20,
    consistency_streak: 21,
    contest_performance: 19,
  },
  strengths: [
    "Strong mastery in Arrays, Hashing, and Two-Pointer patterns.",
    "Consistent daily submission streak over the last 90 days.",
    "Efficient space/time complexity optimization in Medium-level questions.",
  ],
  critical_gaps: [
    "Dynamic Programming: Multidimensional DP and Tree DP need more structured practice.",
    "Graph Algorithms: Disjoint Set Union (DSU) and Topological Sort require reinforcement.",
  ],
  priority_topics: [
    { topic: "dynamic-programming", current_level: "INTERMEDIATE", recommended_problems: 15, priority_score: 92 },
    { topic: "graphs-and-trees", current_level: "INTERMEDIATE", recommended_problems: 12, priority_score: 88 },
    { topic: "binary-search", current_level: "ADVANCED", recommended_problems: 6, priority_score: 65 },
    { topic: "sliding-window", current_level: "ADVANCED", recommended_problems: 4, priority_score: 55 },
    { topic: "tries-and-strings", current_level: "BEGINNER", recommended_problems: 10, priority_score: 82 },
    { topic: "heaps-and-priority-queues", current_level: "INTERMEDIATE", recommended_problems: 8, priority_score: 74 },
  ],
  contest_assessment: {
    rating_tier: "Knight (Top 6%)",
    contest_advice:
      "Your contest speed for Q1 and Q2 is solid (sub 12 minutes). To break past 2000 rating, focus on standard segment trees, trie lookups, and fast modular arithmetic for Q3.",
  },
  personalized_feedback:
    "You have a competitive problem-solving base with 420+ solved problems. Your primary lever for upcoming tech rounds is mastering 2D Dynamic Programming and practicing timed mock technical screens.",
  "12_week_roadmap": [
    { week: 1, focus: "Dynamic Programming Foundations", milestone: "Solve 10 1D DP mediums (Knapsack, LIS)", topics: ["1D DP", "Memoization"] },
    { week: 2, focus: "2D & Grid Dynamic Programming", milestone: "Solve Unique Paths, Min Path Sum, Edit Distance", topics: ["Grid DP", "State Transitions"] },
    { week: 3, focus: "Graph Traversal & Cycle Detection", milestone: "Master BFS/DFS on directed & undirected graphs", topics: ["BFS", "DFS", "Bipartite Graph"] },
    { week: 4, focus: "Shortest Path & DSU", milestone: "Implement Dijkstra & Kruskal algorithms from scratch", topics: ["Dijkstra", "Disjoint Set"] },
    { week: 5, focus: "Tries & String Algorithms", milestone: "Build Word Search II and autocomplete trie", topics: ["Trie", "KMP Algorithm"] },
    { week: 6, focus: "Tree DP & LCA", milestone: "Solve Binary Tree Max Path Sum and Lowest Common Ancestor", topics: ["Tree DP", "Binary Lifting"] },
    { week: 7, focus: "Bit Manipulation & Monotonic Stacks", milestone: "Solve Daily Temperatures & Largest Rectangle in Histogram", topics: ["Monotonic Stack", "Bitwise Tricks"] },
    { week: 8, focus: "Company Mock Screens (FAANG)", milestone: "Complete 3 timed 45-minute live coding mocks", topics: ["Live Mocks", "Edge Case Testing"] },
  ],
};

const DEMO_PROFILE = {
  username: "neetcode",
  name: "Navdeep Singh",
  avatar: "https://assets.leetcode.com/users/default_avatar.jpg",
  total_solved: 540,
  ranking: 14200,
  contest_history: [
    { contest: { title: "Weekly Contest 380" }, rating: 1740 },
    { contest: { title: "Weekly Contest 384" }, rating: 1785 },
    { contest: { title: "Biweekly Contest 123" }, rating: 1820 },
    { contest: { title: "Weekly Contest 390" }, rating: 1865 },
    { contest: { title: "Weekly Contest 395" }, rating: 1910 },
  ],
};

export default function AnalysisDashboard() {
  const [analysis, setAnalysis] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [isDemoMode, setIsDemoMode] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please sign in to view your profile analysis.");
        setLoading(false);
        return;
      }

      const profileRes = await fetch("/api/leetcode/profile", { cache: "no-store" });
      const profileRow = profileRes.ok ? (await profileRes.json()).data : null;

      if (profileRow) {
        setProfile(profileRow);

        const res = await fetch("/api/leetcode/analysis", { cache: "no-store" });
        const aiData = await res.json();

        if (aiData.status === "analyzing") {
          setTimeout(fetchData, 5000);
        } else if (aiData.data) {
          setAnalysis(aiData.data);
          setLoading(false);
        } else {
          // If analysis row isn't ready yet, use generated structure or profile fallback
          setAnalysis(profileRow.ai_analysis || null);
          setLoading(false);
        }
      } else {
        // No connected profile found
        setProfile(null);
        setAnalysis(null);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load coding analysis.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loadDemo = () => {
    setIsDemoMode(true);
    setProfile(DEMO_PROFILE);
    setAnalysis(DEMO_ANALYSIS);
    setError("");
    setLoading(false);
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 animate-pulse">
          Analyzing coding patterns & building topic radar...
        </p>
      </div>
    );
  }

  // Empty State — No LeetCode Profile Connected
  if (!profile && !analysis) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/career/coding"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
          >
            <ArrowLeft size={14} /> Back to Coding Overview
          </Link>
        </div>

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="neu-card rounded-[32px] p-8 sm:p-10 border border-slate-200 dark:border-white/10 text-center relative overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-indigo-500/15 blur-3xl rounded-full pointer-events-none" />

          <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-5">
            <Code2 size={32} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Connect Your LeetCode Profile
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
            Link your LeetCode handle to unlock deep topic mastery radars, weakness detection, contest ratings, and customized 12-week DSA study plans.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/career/coding"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-lg"
            >
              Connect LeetCode Account
              <ArrowRight size={16} />
            </Link>
            <button
              type="button"
              onClick={loadDemo}
              className="w-full sm:w-auto neu-btn inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              <Sparkles size={16} className="text-amber-500" />
              Explore with Demo Data
            </button>
          </div>

          {/* Feature Highlights */}
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5">
              <Layers className="text-indigo-500 mb-2" size={20} />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Topic Radar</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Multi-axis proficiency mapping</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5">
              <TrendingUp className="text-emerald-500 mb-2" size={20} />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Contest Analytics</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Rating progress & tier rank</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5">
              <Calendar className="text-amber-500 mb-2" size={20} />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Streak Heatmap</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">1-year submission calendar</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5">
              <Award className="text-rose-500 mb-2" size={20} />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">12-Week Roadmap</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Structured interview prep</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Error State (if any non-empty error occurred)
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 flex items-center justify-between gap-3 text-rose-600 dark:text-rose-400">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} />
            <span className="text-sm font-semibold">{error}</span>
          </div>
          <button
            onClick={() => fetchData()}
            className="neu-btn rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Topic formatting for radar chart
  const radarTopics = (analysis?.priority_topics || [])
    .map((t: any) => {
      const levelMap: Record<string, number> = { NONE: 1, BEGINNER: 2, INTERMEDIATE: 3, ADVANCED: 4 };
      return {
        topic: String(t.topic || "").replace(/-/g, " "),
        score: levelMap[t.current_level] || 1,
        max: 4,
      };
    })
    .slice(0, 8);

  const username = profile?.username || profile?.leetcode_username || "Coder";

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <Link
            href="/career/coding"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-2 transition"
          >
            <ArrowLeft size={13} /> Back to Coding Path
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              LeetCode AI Analysis
            </h1>
            {isDemoMode && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                Demo Mode
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Analysis for @{username}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {analysis?.placement_readiness && (
            <div className="px-4 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/20 text-xs font-bold text-indigo-700 dark:text-indigo-300">
              Status: {String(analysis.placement_readiness).replace(/_/g, " ")}
            </div>
          )}
          <button
            onClick={() => fetchData()}
            title="Refresh analysis"
            className="neu-btn p-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1.5 border-b border-slate-200 dark:border-white/10 mb-8 overflow-x-auto custom-scrollbar pb-1">
        {[
          { id: "overview", label: "Overview" },
          { id: "skills", label: "Topic Mastery" },
          { id: "contest", label: "Contest Rating" },
          { id: "streak", label: "Heatmap" },
          { id: "feedback", label: "12-Week Roadmap" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-md"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Score Breakdown Cards */}
              {analysis?.score_breakdown && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                  {Object.entries(analysis.score_breakdown).map(([key, val]) => (
                    <div
                      key={key}
                      className="neu-card rounded-2xl p-4 border border-slate-200 dark:border-white/10"
                    >
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {key.replace(/_/g, " ")}
                      </h4>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                          {val as number}
                        </span>
                        <span className="text-xs text-slate-400">/ 25</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Strengths & Critical Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="neu-card rounded-3xl p-6 border border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/10">
                  <h3 className="text-emerald-700 dark:text-emerald-400 font-bold mb-3.5 flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Key Strengths
                  </h3>
                  <ul className="space-y-2.5">
                    {(analysis?.strengths || []).map((s: string, i: number) => (
                      <li
                        key={i}
                        className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2"
                      >
                        <span className="text-emerald-500 mt-1 font-bold">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="neu-card rounded-3xl p-6 border border-rose-500/20 bg-rose-50/30 dark:bg-rose-950/10">
                  <h3 className="text-rose-700 dark:text-rose-400 font-bold mb-3.5 flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Critical Gaps to Close
                  </h3>
                  <ul className="space-y-2.5">
                    {(analysis?.critical_gaps || []).map((g: string, i: number) => (
                      <li
                        key={i}
                        className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2"
                      >
                        <span className="text-rose-500 mt-1 font-bold">!</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Assessment Summary */}
              {analysis?.personalized_feedback && (
                <div className="neu-card rounded-3xl p-6 border border-slate-200 dark:border-white/10">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                    AI Strategic Assessment
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                    {analysis.personalized_feedback}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── SKILLS TAB ── */}
          {activeTab === "skills" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 neu-card rounded-3xl p-6 border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 w-full mb-4 text-center">
                  Topic Mastery Radar
                </h3>
                <TopicRadarChart topics={radarTopics} />
              </div>

              <div className="lg:col-span-2 neu-card rounded-3xl p-6 border border-slate-200 dark:border-white/10 overflow-hidden">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Topic Priority Analysis & Recommendations
                </h3>
                <PriorityTopicTable topics={analysis?.priority_topics || []} />
              </div>
            </div>
          )}

          {/* ── CONTEST TAB ── */}
          {activeTab === "contest" && (
            <div className="space-y-6">
              <div className="neu-card rounded-3xl p-6 border border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Contest Rating History
                  </h3>
                  {analysis?.contest_assessment?.rating_tier && (
                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full border border-indigo-500/20">
                      Tier: {analysis.contest_assessment.rating_tier}
                    </span>
                  )}
                </div>
                <ContestRatingChart history={profile?.contest_history || []} />
              </div>

              {analysis?.contest_assessment?.contest_advice && (
                <div className="neu-card rounded-3xl p-6 border border-slate-200 dark:border-white/10">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    AI Contest Strategy
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {analysis.contest_assessment.contest_advice}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── STREAK TAB ── */}
          {activeTab === "streak" && (
            <div className="neu-card rounded-3xl p-6 border border-slate-200 dark:border-white/10">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                1-Year Submission Heatmap
              </h3>
              <ContributionHeatmap calendarString={profile?.calendar_data?.submissionCalendar} />
            </div>
          )}

          {/* ── ROADMAP / FEEDBACK TAB ── */}
          {activeTab === "feedback" && (
            <div className="space-y-6">
              <div className="neu-card rounded-3xl p-6 border border-slate-200 dark:border-white/10">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                  Personalized 12-Week DSA Roadmap
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(analysis?.["12_week_roadmap"] || []).map((week: any, i: number) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:border-indigo-500/40 transition"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                          WEEK {week.week}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                        {week.focus}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        {week.milestone}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {week.topics?.map((t: string) => (
                          <span
                            key={t}
                            className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 rounded-md border border-indigo-500/20"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
