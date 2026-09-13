"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw, Layers, ListChecks, Target } from "lucide-react";
import Link from "next/link";
import { ProblemCard } from "@/components/leetcode/ProblemCard";
import { ProblemRecommendation } from "@/lib/leetcode/types";
import { friendlyError } from '@/components/ui/feedback';
import { recordUserActivity } from "@/lib/activity-tracker";
import { WeeklyPlanWidget } from "@/components/planning/WeeklyPlanWidget";

interface HRPracticeRec {
  domain: string;
  subdomain: string;
  difficulty: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  hackerrankUrl: string;
  estimatedProblems: number;
  whyThisForStream: string;
}

interface UnifiedScore {
  overallScore: number;
  connected: { leetcode: boolean; hackerrank: boolean };
  leetcode: { placement_readiness_score?: number; solved_data?: { solvedProblem?: number } } | null;
  multiPlatform: { hackerrank_score?: number; hackerrank_data?: { totalSolved?: number } } | null;
}

function readinessLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Expert', color: 'text-emerald-600 dark:text-emerald-400' };
  if (score >= 60) return { label: 'Strong', color: 'text-cyan-600 dark:text-cyan-400' };
  if (score >= 35) return { label: 'Developing', color: 'text-amber-600 dark:text-amber-400' };
  return { label: 'Just Starting', color: 'text-rose-600 dark:text-rose-400' };
}

export default function StudyPlan() {
  // ── LeetCode state ──
  const [problems, setProblems] = useState<ProblemRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("PENDING");

  // ── HackerRank state ──
  const [hrRecs, setHrRecs] = useState<HRPracticeRec[]>([]);
  const [hrConnected, setHrConnected] = useState(true);
  const [hrLoading, setHrLoading] = useState(true);
  const [hrGenerating, setHrGenerating] = useState(false);
  const [hrError, setHrError] = useState("");

  // ── Combined analysis state ──
  const [unified, setUnified] = useState<UnifiedScore | null>(null);
  const [unifiedLoading, setUnifiedLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
    fetchHackerRankPlan();
    fetchUnifiedScore();
  }, []);

  const fetchUnifiedScore = async () => {
    setUnifiedLoading(true);
    try {
      const res = await fetch('/api/platforms/unified');
      if (res.ok) {
        setUnified(await res.json());
      }
    } catch {
      // Non-critical widget — fail silently, section just won't render fully.
    } finally {
      setUnifiedLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/leetcode/recommendations');
      const data = await res.json();
      if (res.ok) {
        setProblems(data.data || []);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError("");
      const res = await fetch('/api/leetcode/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate: true })
      });
      if (res.ok) {
        await fetchRecommendations();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to generate. Please connect your LeetCode profile or wait for the AI analysis to finish.');
      }
    } catch (err: any) {
      setError(friendlyError(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleComplete = async (slug: string) => {
    recordUserActivity("dsa_solved", { slug });
    const res = await fetch(`/api/leetcode/problems/${slug}/complete`, { method: 'POST' });
    if (res.ok) {
      setProblems(prev => prev.map(p => p.problem_slug === slug ? { ...p, completed: true } : p));
    }
  };

  // ── HackerRank handlers ──
  const fetchHackerRankPlan = async () => {
    setHrLoading(true);
    setHrError('');
    try {
      const res = await fetch('/api/hackerrank/practice');
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error ?? `Request failed (${res.status})`);
      setHrConnected(d.connected !== false);
      setHrRecs(d.recommendations || []);
    } catch (e: any) {
      setHrError(e.message || 'Failed to load your HackerRank practice plan');
    } finally {
      setHrLoading(false);
    }
  };

  const handleGenerateHR = async () => {
    try {
      setHrGenerating(true);
      setHrError('');
      const res = await fetch('/api/hackerrank/practice', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to generate HackerRank practice plan');
      setHrRecs(data.recommendations || []);
      setHrConnected(true);
    } catch (e: any) {
      setHrError(e.message || 'Failed to generate HackerRank practice plan');
    } finally {
      setHrGenerating(false);
    }
  };

  const filteredProblems = problems.filter(p => {
    if (filterPriority !== "ALL" && p.priority !== filterPriority) return false;
    if (filterStatus === "COMPLETED" && !p.completed) return false;
    if (filterStatus === "PENDING" && p.completed) return false;
    return true;
  });

  if (loading && hrLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-12">

      {/* ══════════ WEEKLY PLAN ══════════ */}
      <WeeklyPlanWidget />

      {/* ══════════ LEETCODE SECTION ══════════ */}
      <section className="flex flex-col md:flex-row gap-8">

        {/* LEFT SIDEBAR: Stats & Controls */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-6">
          <div className="neu-card rounded-2xl p-6">
            <h2 className="font-semibold text-slate-950 dark:text-white mb-4">LeetCode Study Plan</h2>

            <div className="mb-6">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                <span>Progress</span>
                <span>{problems.filter(p => p.completed).length} / {problems.length}</span>
              </div>
              <div className="neu-inset h-2 w-full rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${problems.length ? (problems.filter(p => p.completed).length / problems.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="neu-btn w-full py-2.5 text-slate-700 dark:text-white/80 text-sm font-medium rounded-xl transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Regenerate Plan
            </button>

            {error && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs">
                {error}
              </div>
            )}
          </div>

          <div className="neu-card rounded-2xl p-4 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-2 block">Priority Filter</label>
              <div className="flex flex-col gap-1">
                {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
                  <button
                    key={p}
                    onClick={() => setFilterPriority(p)}
                    className={`text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      filterPriority === p
                        ? 'neu-pill-inset text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-2 block">Status Filter</label>
              <div className="flex flex-col gap-1">
                {['ALL', 'PENDING', 'COMPLETED'].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      filterStatus === s
                        ? 'neu-pill-inset text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT AREA: Problem Grid */}
        <div className="flex-grow">
          {loading ? (
            <div className="h-full min-h-[200px] flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : problems.length === 0 ? (
            <div className="neu-card h-full flex flex-col items-center justify-center text-center rounded-2xl p-12">
              <Layers className="w-16 h-16 text-slate-300 dark:text-white/20 mb-4" />
              <h3 className="text-xl font-semibold text-slate-950 dark:text-white mb-2">No Study Plan Generated</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">We need to generate your personalized problem set based on your AI analysis.</p>
              {error && (
                <div className="mb-6 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-sm max-w-sm">
                  {error}
                </div>
              )}
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center disabled:opacity-50"
              >
                {generating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                Generate Study Plan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 auto-rows-max">
              {filteredProblems.map(p => (
                <ProblemCard
                  key={p.problem_slug}
                  problem={p}
                  onComplete={handleComplete}
                />
              ))}
              {filteredProblems.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
                  No problems match the current filters.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ══════════ HACKERRANK SECTION ══════════ */}
      <section className="space-y-6 border-t border-slate-200/60 dark:border-white/10 pt-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950 dark:text-white mb-1">HackerRank Practice Plan</h2>
            <p className="text-slate-600 dark:text-white/60 text-sm">Targeted practice domains to earn stream-relevant badges.</p>
          </div>
          {hrConnected && hrRecs.length > 0 && (
            <button
              onClick={handleGenerateHR}
              disabled={hrGenerating}
              className="neu-btn inline-flex items-center gap-2 px-4 py-2.5 text-slate-700 dark:text-white/80 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {hrGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Regenerate Plan
            </button>
          )}
        </div>

        {hrError && (
          <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
            {hrError}
          </div>
        )}

        {hrLoading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        ) : !hrConnected ? (
          <div className="neu-card flex flex-col items-center justify-center text-center rounded-2xl p-12">
            <ListChecks className="w-16 h-16 text-slate-300 dark:text-white/20 mb-4" />
            <h3 className="text-xl font-semibold text-slate-950 dark:text-white mb-2">Connect HackerRank First</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">Link your HackerRank profile to generate a personalized practice plan.</p>
            <Link
              href="/career/hackerrank"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
            >
              Connect HackerRank
            </Link>
          </div>
        ) : hrRecs.length === 0 ? (
          <div className="neu-card flex flex-col items-center justify-center text-center rounded-2xl p-12">
            <ListChecks className="w-16 h-16 text-slate-300 dark:text-white/20 mb-4" />
            <h3 className="text-xl font-semibold text-slate-950 dark:text-white mb-2">No Practice Plan Yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">Generate a personalized practice plan based on your badges and target stream.</p>
            <button
              onClick={handleGenerateHR}
              disabled={hrGenerating}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {hrGenerating && <Loader2 className="w-5 h-5 animate-spin" />}
              Generate Practice Plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hrRecs.map((rec, i) => (
              <div key={i} className="neu-raised-sm rounded-2xl p-6 flex flex-col justify-between hover:neu-card transition-shadow">
                <div>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="text-lg font-bold text-slate-950 dark:text-white">{rec.subdomain}</h3>
                    <span className={`shrink-0 px-2 py-1 text-xs font-bold rounded-lg text-white ${
                      rec.priority === 'CRITICAL' ? 'bg-red-500' : rec.priority === 'HIGH' ? 'bg-amber-500' : 'bg-blue-500'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-white/50 mb-4">{rec.domain}</p>
                  <p className="text-sm text-slate-700 dark:text-white/80 mb-6 leading-relaxed">{rec.whyThisForStream}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-slate-500 dark:text-white/60">
                    <span>Difficulty: {rec.difficulty}</span>
                    <span>Target: {rec.estimatedProblems} probs</span>
                  </div>
                  <button
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
                    onClick={() => window.open(rec.hackerrankUrl, '_blank')}
                  >
                    Practice Now →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ══════════ COMMON SECTION: COMBINED ANALYSIS ══════════ */}
      <section className="space-y-6 border-t border-slate-200/60 dark:border-white/10 pt-10">
        <div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white mb-1 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-500" />
            Combined Study Plan Analysis
          </h2>
          <p className="text-slate-600 dark:text-white/60 text-sm">
            One readiness picture across both platforms and both plans above.
          </p>
        </div>

        {unifiedLoading ? (
          <div className="h-32 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        ) : !unified || (!unified.connected.leetcode && !unified.connected.hackerrank) ? (
          <div className="neu-card flex flex-col items-center justify-center text-center rounded-2xl p-10">
            <Target className="w-14 h-14 text-slate-300 dark:text-white/20 mb-4" />
            <h3 className="text-lg font-semibold text-slate-950 dark:text-white mb-2">Connect a platform to see combined analysis</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm">
              Once LeetCode or HackerRank is connected, this section shows one unified readiness score across both.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="neu-card rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-black text-slate-950 dark:text-white">{unified.overallScore}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">/ 100 combined readiness</span>
              <span className={`mt-2 text-sm font-bold ${readinessLabel(unified.overallScore).color}`}>
                {readinessLabel(unified.overallScore).label}
              </span>
            </div>

            <div className="neu-card rounded-2xl p-6">
              <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-3">LeetCode</p>
              {unified.connected.leetcode ? (
                <>
                  <p className="text-2xl font-black text-slate-950 dark:text-white">
                    {unified.leetcode?.placement_readiness_score ?? 0}<span className="text-sm font-medium text-slate-400">/ 100</span>
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {unified.leetcode?.solved_data?.solvedProblem ?? 0} problems solved
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {problems.filter(p => p.completed).length} / {problems.length} in current study plan
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Not connected — see LeetCode Study Plan above.</p>
              )}
            </div>

            <div className="neu-card rounded-2xl p-6">
              <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-3">HackerRank</p>
              {unified.connected.hackerrank ? (
                <>
                  <p className="text-2xl font-black text-slate-950 dark:text-white">
                    {unified.multiPlatform?.hackerrank_score ?? 0}<span className="text-sm font-medium text-slate-400"> / 100</span>
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {unified.multiPlatform?.hackerrank_data?.totalSolved ?? 0} challenges solved
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {hrRecs.length} practice domains in current plan
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Not connected — see HackerRank Practice Plan above.</p>
              )}
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
