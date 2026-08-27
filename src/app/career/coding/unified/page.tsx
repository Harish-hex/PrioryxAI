'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Code2, ArrowRight, CheckCircle2, Award, Zap, RefreshCw, ExternalLink } from 'lucide-react';
import { PageSkeleton, EmptyState, ErrorBanner } from '@/components/ui/feedback';

interface LCData {
  leetcode_username?: string;
  placement_readiness_score?: number;
  quick_score?: number;
  solved_data?: { solvedProblem?: number; easySolved?: number; mediumSolved?: number; hardSolved?: number };
  contest_info?: { contestRating?: number };
}

interface HRData {
  hackerrank_username?: string;
  hackerrank_score?: number;
  hackerrank_data?: { totalSolved?: number; badges?: string[]; certifications?: number };
  codechef_data?: { rating?: number };
  gfg_data?: { totalSolved?: number };
  codeforces_data?: { rating?: number };
}

interface UnifiedData {
  overallScore: number;
  leetcode: LCData | null;
  multiPlatform: HRData | null;
}

export default function UnifiedCodingDashboardPage() {
  const [data, setData] = useState<UnifiedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  function load() {
    setLoading(true);
    setError(null);
    fetch('/api/platforms/unified')
      .then(async res => {
        const d = await res.json();
        if (!res.ok) throw new Error(d?.error ?? `Request failed (${res.status})`);
        return d as UnifiedData;
      })
      .then(d => setData(d))
      .catch(e => setError(e))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  if (loading) return <PageSkeleton cards={2} />;

  const lc = data?.leetcode ?? null;
  const hr = data?.multiPlatform ?? null;
  const lcScore = lc?.placement_readiness_score ?? lc?.quick_score ?? 0;
  const hrScore = hr?.hackerrank_score ?? 0;
  const hasLC = !!lc?.leetcode_username;
  const hasHR = !!hr?.hackerrank_username;
  const overallScore = data?.overallScore ?? 0;

  const lcSolved = lc?.solved_data?.solvedProblem ?? 0;
  const lcEasy = lc?.solved_data?.easySolved ?? 0;
  const lcMedium = lc?.solved_data?.mediumSolved ?? 0;
  const lcHard = lc?.solved_data?.hardSolved ?? 0;
  const lcContest = lc?.contest_info?.contestRating ?? 0;

  const hrBadges = hr?.hackerrank_data?.badges ?? [];
  const hrSolved = hr?.hackerrank_data?.totalSolved ?? 0;
  const hrCerts = hr?.hackerrank_data?.certifications ?? 0;

  const scoreColor = overallScore >= 75 ? '#10b981'
    : overallScore >= 50 ? '#06b6d4'
    : overallScore >= 35 ? '#f59e0b' : '#ef4444';

  const scoreLabel = overallScore >= 75 ? 'Interview Ready'
    : overallScore >= 50 ? 'Getting There'
    : overallScore >= 35 ? 'Keep Practicing' : 'Just Starting';

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
              Unified Profile
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Aggregated placement-readiness scores, contest metrics, and badge tracking across coding platforms.
            </p>
          </div>

          <button
            onClick={load}
            className="neu-btn inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shrink-0"
          >
            <RefreshCw className="h-4 w-4" /> Refresh Sync
          </button>
        </div>
      </header>

      <ErrorBanner error={error} onRetry={load} />

      {/* Neither platform connected */}
      {!hasLC && !hasHR && !error && (
        <div className="neu-card rounded-[28px] p-10 md:p-14 text-center space-y-4 max-w-xl mx-auto">
          <div className="neu-pill-inset h-16 w-16 rounded-2xl flex items-center justify-center text-cyan-500 mx-auto">
            <Code2 size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">No coding platforms connected yet</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Connect LeetCode or HackerRank to generate a combined placement readiness score, topic strengths, and contest history.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href="/career/coding"
              className="neu-btn inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              <span>Connect LeetCode</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/career/hackerrank"
              className="neu-btn inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-300"
            >
              <span>Connect HackerRank</span>
            </Link>
          </div>
        </div>
      )}

      {/* Overall Score Hero Card */}
      {(hasLC || hasHR) && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="neu-card rounded-[28px] p-8 flex flex-col items-center justify-center text-center space-y-4"
        >
          <div className="relative h-44 w-44">
            <svg viewBox="0 0 100 100" className="transform -rotate-90 h-44 w-44">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className="text-slate-200/80 dark:text-white/10" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                strokeWidth="8"
                stroke={scoreColor}
                strokeDasharray={`0 263.9`}
                strokeLinecap="round"
              >
                <animate attributeName="stroke-dasharray" from="0 263.9" to={`${overallScore * 2.639} 263.9`} dur="1s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" />
              </circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black text-slate-950 dark:text-white">{overallScore}</span>
              <span className="text-xs font-semibold text-slate-400">/ 100</span>
            </div>
          </div>

          <div>
            <span className="neu-pill rounded-full px-4 py-1 text-sm font-bold" style={{ color: scoreColor }}>
              {scoreLabel}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {hasLC && hasHR ? 'Weighted calculation: LeetCode (60%) + HackerRank (40%)'
                : hasLC ? 'Calculated from connected LeetCode profile'
                : 'Calculated from connected HackerRank profile'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Platform Breakdown Cards */}
      {(hasLC || hasHR) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LeetCode Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="neu-card rounded-[28px] p-6 sm:p-7 flex flex-col justify-between space-y-4 transition hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="neu-pill-inset h-12 w-12 rounded-2xl flex items-center justify-center font-black text-amber-500 dark:text-amber-400 text-sm">
                    LC
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-950 dark:text-white">LeetCode</h3>
                    {lc?.leetcode_username && (
                      <p className="text-xs text-slate-400">@{lc.leetcode_username}</p>
                    )}
                  </div>
                </div>

                {hasLC ? (
                  <div className="text-right">
                    <span className="text-2xl font-black text-amber-500">{lcScore}</span>
                    <span className="text-xs text-slate-400">/100</span>
                  </div>
                ) : (
                  <Link href="/career/coding" className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-cyan-600 dark:text-cyan-400">
                    Connect
                  </Link>
                )}
              </div>

              {hasLC ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Easy', count: lcEasy, color: 'text-emerald-500' },
                      { label: 'Medium', count: lcMedium, color: 'text-amber-500' },
                      { label: 'Hard', count: lcHard, color: 'text-rose-500' },
                    ].map(({ label, count, color }) => (
                      <div key={label} className="neu-inset rounded-2xl p-3">
                        <p className={`text-xl font-bold ${color}`}>{count}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="neu-inset rounded-2xl p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Total Solved</span>
                      <span className="font-bold text-slate-900 dark:text-white">{lcSolved}</span>
                    </div>
                    {lcContest > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Contest Rating</span>
                        <span className="font-bold text-slate-900 dark:text-white">{Math.round(lcContest)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="neu-inset rounded-2xl p-6 text-center">
                  <p className="text-xs text-slate-500">Not connected</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Link account to unlock automated DSA problem tracking</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* HackerRank Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="neu-card rounded-[28px] p-6 sm:p-7 flex flex-col justify-between space-y-4 transition hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="neu-pill-inset h-12 w-12 rounded-2xl flex items-center justify-center font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    HR
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-950 dark:text-white">HackerRank</h3>
                    {hr?.hackerrank_username && (
                      <p className="text-xs text-slate-400">@{hr.hackerrank_username}</p>
                    )}
                  </div>
                </div>

                {hasHR ? (
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{hrScore}</span>
                    <span className="text-xs text-slate-400">/100</span>
                  </div>
                ) : (
                  <Link href="/career/hackerrank" className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-cyan-600 dark:text-cyan-400">
                    Connect
                  </Link>
                )}
              </div>

              {hasHR ? (
                <div className="space-y-4">
                  <div className="neu-inset rounded-2xl p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Problems Solved</span>
                      <span className="font-bold text-slate-900 dark:text-white">{hrSolved}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Certifications</span>
                      <span className="font-bold text-slate-900 dark:text-white">{hrCerts}</span>
                    </div>
                  </div>

                  {hrBadges.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Verified Badges ({hrBadges.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {hrBadges.slice(0, 8).map((badge: string) => (
                          <span key={badge} className="neu-pill rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="neu-inset rounded-2xl p-6 text-center">
                  <p className="text-xs text-slate-500">Not connected</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Link account to track badges and certifications</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Common View Study Plan Option */}
      {(hasLC || hasHR) && (
        <div className="neu-card rounded-[28px] p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-base font-bold text-slate-950 dark:text-white">
              AI-Powered Study Plan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalized practice recommendations and company-tagged questions tailored to your performance across all platforms.
            </p>
          </div>
          <Link
            href="/career/coding/study-plan"
            className="neu-btn inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-xs sm:text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shrink-0 w-full sm:w-auto"
          >
            <span>View Study Plan</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Bonus Platforms Cards */}
      {hr && (hr.codechef_data || hr.gfg_data || hr.codeforces_data) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {hr.codechef_data?.rating && (
            <div className="neu-card rounded-[24px] p-5">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">CodeChef</p>
              <p className="text-2xl font-black text-slate-950 dark:text-white mt-1">{hr.codechef_data.rating}</p>
              <p className="text-[11px] text-slate-400">Contest Rating</p>
            </div>
          )}
          {hr.gfg_data?.totalSolved && (
            <div className="neu-card rounded-[24px] p-5">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">GeeksforGeeks</p>
              <p className="text-2xl font-black text-slate-950 dark:text-white mt-1">{hr.gfg_data.totalSolved}</p>
              <p className="text-[11px] text-slate-400">Problems Solved</p>
            </div>
          )}
          {hr.codeforces_data?.rating && (
            <div className="neu-card rounded-[24px] p-5">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Codeforces</p>
              <p className="text-2xl font-black text-slate-950 dark:text-white mt-1">{hr.codeforces_data.rating}</p>
              <p className="text-[11px] text-slate-400">Contest Rating</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
