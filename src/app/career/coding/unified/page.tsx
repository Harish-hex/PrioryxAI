'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

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

  useEffect(() => {
    fetch('/api/platforms/unified')
      .then(res => res.json())
      .then((d: UnifiedData) => {
        if (d && !(d as { error?: string }).error) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Pull scores — use placement_readiness_score first, fall back to quick_score
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

  const scoreColor = overallScore >= 75 ? '#22c55e'
    : overallScore >= 50 ? '#3b82f6'
    : overallScore >= 35 ? '#f59e0b' : '#ef4444';

  const scoreLabel = overallScore >= 75 ? 'Interview Ready'
    : overallScore >= 50 ? 'Getting There'
    : overallScore >= 35 ? 'Keep Practicing' : 'Just Starting';

  return (
    <div className="max-w-5xl mx-auto py-8 px-6 space-y-8 bg-white text-slate-900 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Unified Coding Profile</h1>
        <p className="text-slate-500 mt-1">Aggregated insights across all your coding platforms</p>
      </div>

      {/* Overall Score Hero */}
      <div className="rounded-2xl border border-slate-200 p-8 flex flex-col items-center bg-slate-50">
        <div className="relative h-44 w-44">
          <svg viewBox="0 0 100 100" className="transform -rotate-90 h-44 w-44">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              strokeWidth="8"
              stroke={scoreColor}
              strokeDasharray={`${overallScore * 2.639} 263.9`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black text-slate-900">{overallScore}</span>
            <span className="text-sm text-slate-500">/ 100</span>
          </div>
        </div>
        <p className="text-xl font-semibold mt-4" style={{ color: scoreColor }}>{scoreLabel}</p>
        <p className="text-sm text-slate-500 mt-1">
          {hasLC && hasHR ? 'Combined LeetCode (60%) + HackerRank (40%)'
            : hasLC ? 'Based on LeetCode score'
            : 'Based on HackerRank score'}
        </p>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* LeetCode Card */}
        <div className={`rounded-2xl border-2 p-6 ${
          hasLC ? 'border-yellow-300 bg-yellow-50' : 'border-dashed border-slate-200 bg-white'
        }`}>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-11 w-11 bg-yellow-100 rounded-xl flex items-center justify-center">
              <span className="font-black text-yellow-600 text-sm">LC</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">LeetCode</h3>
              {lc?.leetcode_username && (
                <p className="text-xs text-slate-500">@{lc.leetcode_username}</p>
              )}
            </div>
            {hasLC ? (
              <div className="ml-auto text-right">
                <span className="text-3xl font-black text-yellow-600">{lcScore}</span>
                <span className="text-sm text-slate-400">/100</span>
              </div>
            ) : (
              <a href="/career/coding" className="ml-auto text-sm text-blue-500 hover:underline font-medium">
                Connect →
              </a>
            )}
          </div>

          {hasLC ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Easy', count: lcEasy, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Medium', count: lcMedium, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                  { label: 'Hard', count: lcHard, color: 'text-red-600', bg: 'bg-red-50' },
                ].map(({ label, count, color, bg }) => (
                  <div key={label} className={`${bg} rounded-xl p-3`}>
                    <p className={`text-xl font-bold ${color}`}>{count}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Solved</span>
                <span className="font-semibold">{lcSolved}</span>
              </div>
              {lcContest > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Contest Rating</span>
                  <span className="font-semibold">{Math.round(lcContest)}</span>
                </div>
              )}
              <a href="/career/coding/analysis"
                className="block text-center text-sm text-yellow-600 hover:text-yellow-700 font-medium">
                View Full LeetCode Analysis →
              </a>
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-slate-500">Not connected</p>
              <p className="text-xs text-slate-400 mt-1">Connect to unlock DSA analysis and study plan</p>
            </div>
          )}
        </div>

        {/* HackerRank Card */}
        <div className={`rounded-2xl border-2 p-6 ${
          hasHR ? 'border-green-300 bg-green-50' : 'border-dashed border-slate-200 bg-white'
        }`}>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-11 w-11 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="font-black text-green-700 text-sm">HR</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">HackerRank</h3>
              {hr?.hackerrank_username && (
                <p className="text-xs text-slate-500">@{hr.hackerrank_username}</p>
              )}
            </div>
            {hasHR ? (
              <div className="ml-auto text-right">
                <span className="text-3xl font-black text-green-700">{hrScore}</span>
                <span className="text-sm text-slate-400">/100</span>
              </div>
            ) : (
              <a href="/career/hackerrank" className="ml-auto text-sm text-blue-500 hover:underline font-medium">
                Connect →
              </a>
            )}
          </div>

          {hasHR ? (
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Problems Solved</span>
                <span className="font-semibold">{hrSolved}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Certifications</span>
                <span className="font-semibold">{hrCerts}</span>
              </div>
              {hrBadges.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Badges ({hrBadges.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {hrBadges.slice(0, 6).map((badge: string) => (
                      <span key={badge}
                        className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full border border-green-200">
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <a href="/career/hackerrank"
                className="block text-center text-sm text-green-700 hover:text-green-800 font-medium">
                View Full HackerRank Analysis →
              </a>
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-slate-500">Not connected</p>
              <p className="text-xs text-slate-400 mt-1">Connect to unlock badge and certification tracking</p>
            </div>
          )}
        </div>
      </div>

      {/* Bonus Platforms */}
      {hr && (hr.codechef_data || hr.gfg_data || hr.codeforces_data) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {hr.codechef_data?.rating && (
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">CodeChef</h4>
              <p className="text-2xl font-bold text-slate-900">{hr.codechef_data.rating}</p>
              <p className="text-xs text-slate-500 mt-0.5">Rating</p>
            </div>
          )}
          {hr.gfg_data?.totalSolved && (
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">GeeksforGeeks</h4>
              <p className="text-2xl font-bold text-slate-900">{hr.gfg_data.totalSolved}</p>
              <p className="text-xs text-slate-500 mt-0.5">Problems Solved</p>
            </div>
          )}
          {hr.codeforces_data?.rating && (
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Codeforces</h4>
              <p className="text-2xl font-bold text-slate-900">{hr.codeforces_data.rating}</p>
              <p className="text-xs text-slate-500 mt-0.5">Rating</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
