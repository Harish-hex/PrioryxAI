"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw, Layers } from "lucide-react";
import { ProblemCard } from "@/components/leetcode/ProblemCard";
import { ProblemRecommendation } from "@/lib/leetcode/types";
import { friendlyError, ErrorBanner } from '@/components/ui/feedback';

export default function StudyPlan() {
  const [problems, setProblems] = useState<ProblemRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  
  // Filters
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("PENDING");

  useEffect(() => {
    fetchRecommendations();
  }, []);

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
    const res = await fetch(`/api/leetcode/problems/${slug}/complete`, { method: 'POST' });
    if (res.ok) {
      setProblems(prev => prev.map(p => p.problem_slug === slug ? { ...p, completed: true } : p));
    }
  };

  const filteredProblems = problems.filter(p => {
    if (filterPriority !== "ALL" && p.priority !== filterPriority) return false;
    if (filterStatus === "COMPLETED" && !p.completed) return false;
    if (filterStatus === "PENDING" && p.completed) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 flex flex-col gap-6">
      {error && <ErrorBanner error={error} onRetry={fetchRecommendations} />}

      <div className="flex flex-col md:flex-row gap-8">
      {/* LEFT SIDEBAR: Stats & Controls */}
      <div className="w-full md:w-64 flex-shrink-0 space-y-6">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Study Plan</h2>
          
          <div className="mb-6">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Progress</span>
              <span>{problems.filter(p=>p.completed).length} / {problems.length}</span>
            </div>
            <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${problems.length ? (problems.filter(p=>p.completed).length / problems.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900/80 text-sm font-medium rounded-xl transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Regenerate Plan
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2 block">Priority Filter</label>
            <div className="flex flex-col gap-1">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
                <button
                  key={p}
                  onClick={() => setFilterPriority(p)}
                  className={`text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filterPriority === p ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900/80'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2 block">Status Filter</label>
            <div className="flex flex-col gap-1">
              {['ALL', 'PENDING', 'COMPLETED'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filterStatus === s ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900/80'
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
        {problems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center bg-slate-50 border border-slate-200 rounded-2xl p-12">
            <Layers className="w-16 h-16 text-slate-900/20 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Study Plan Generated</h3>
            <p className="text-slate-500 mb-6 max-w-sm">We need to generate your personalized problem set based on your AI analysis.</p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-slate-900 font-medium rounded-xl transition-colors flex items-center"
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
              <div className="col-span-full py-12 text-center text-slate-500">
                No problems match the current filters.
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
