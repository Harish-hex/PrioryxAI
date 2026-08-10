"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Code2, Loader2, CheckCircle2, ExternalLink } from "lucide-react";

export default function CodingConnectPage() {
  const [lcUsername, setLcUsername] = useState("");
  const [hrUsername, setHrUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    if (!lcUsername && !hrUsername) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/coding/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leetcodeUsername: lcUsername || undefined,
          hackerrankUsername: hrUsername || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Connection failed");
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const lcStats = (result?.leetcode as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
  const lcStatsInner = lcStats?.stats as Record<string, unknown> | undefined;
  const placementScore = (result?.placementScore as Record<string, unknown>)?.score as number | undefined;

  return (
    <div className="min-h-screen bg-white text-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-semibold flex items-center gap-3 mb-2">
          <Code2 className="text-cyan-400" size={28} />
          Connect Coding Profiles
        </h1>
        <p className="text-neutral-500 mb-8">
          Link your LeetCode and HackerRank accounts for personalized problem recommendations.
        </p>

        {/* Input Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              LeetCode Username
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={lcUsername}
                onChange={(e) => setLcUsername(e.target.value)}
                placeholder="e.g. user123"
                className="flex-1 rounded-lg border border-slate-200 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-900 placeholder-neutral-600 focus:border-indigo-500 focus:outline-none"
              />
              <a
                href="https://leetcode.com"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-neutral-500 hover:text-slate-900"
              >
                <ExternalLink size={16} />
              </a>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              HackerRank Username
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={hrUsername}
                onChange={(e) => setHrUsername(e.target.value)}
                placeholder="e.g. user456"
                className="flex-1 rounded-lg border border-slate-200 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-900 placeholder-neutral-600 focus:border-indigo-500 focus:outline-none"
              />
              <a
                href="https://www.hackerrank.com"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-neutral-500 hover:text-slate-900"
              >
                <ExternalLink size={16} />
              </a>
            </div>
          </div>

          <button
            onClick={handleConnect}
            disabled={loading || (!lcUsername && !hrUsername)}
            className="w-full rounded-lg bg-indigo-500 py-3 text-sm font-semibold transition hover:bg-indigo-400 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Fetching profiles...</>
            ) : (
              "Connect & Analyze"
            )}
          </button>

          {error && (
            <p className="text-sm text-rose-400 mt-2">{error}</p>
          )}
        </div>

        {/* Results Preview */}
        {result && lcStatsInner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-2xl border border-slate-200 bg-white/[0.02] p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={20} className="text-emerald-400" />
              <h2 className="text-lg font-semibold">Profile Connected</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Total Solved" value={String(lcStatsInner.totalSolved ?? 0)} color="text-slate-900" />
              <StatCard label="Easy" value={String(lcStatsInner.easySolved ?? 0)} color="text-emerald-400" />
              <StatCard label="Medium" value={String(lcStatsInner.mediumSolved ?? 0)} color="text-amber-400" />
              <StatCard label="Hard" value={String(lcStatsInner.hardSolved ?? 0)} color="text-rose-400" />
            </div>

            {placementScore !== undefined && (
              <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4 text-center">
                <p className="text-xs text-neutral-500 mb-1">Placement Readiness Score</p>
                <p className="text-3xl font-bold text-indigo-400">{placementScore}<span className="text-lg">/100</span></p>
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <a
                href="/career/coding/analysis"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold transition hover:bg-indigo-400"
              >
                Deep Analysis →
              </a>
              <a
                href="/career/coding/study-plan"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold transition hover:bg-slate-100"
              >
                Study Plan
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/[0.03] p-3 text-center">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}
