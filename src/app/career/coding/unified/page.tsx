'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function UnifiedCodingDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/platforms/unified')
      .then(res => res.json())
      .then(d => {
        if (d && !d.error) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  const hasLeetcode = !!data?.leetcode;
  const hasHackerRank = !!data?.multiPlatform;

  if (!hasLeetcode && !hasHackerRank) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">No Profiles Connected</h2>
        <p className="text-slate-500 mb-6 max-w-md">Connect your LeetCode or HackerRank accounts to see your unified coding profile and skill analysis.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-8 bg-white text-slate-900 min-h-screen">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold text-slate-900">Unified Coding Profile</h1>
        <p className="text-slate-600">Aggregated insights across all your coding platforms.</p>
      </div>

      <div className="flex justify-center mb-12">
        <div className="flex flex-col items-center justify-center w-48 h-48 rounded-full border-8 border-indigo-500 bg-white shadow-xl">
          <span className="text-6xl font-black text-slate-900">{data?.overallScore || 0}</span>
          <span className="text-slate-600 font-medium mt-2">Overall Score</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data?.leetcode && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">LeetCode</h2>
            <p className="text-4xl font-bold text-slate-900">{data.leetcode.quick_score || 0}</p>
            <p className="text-sm text-slate-500 mt-1">Platform Score</p>
          </div>
        )}

        {data?.multiPlatform?.hackerrank_score > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">HackerRank</h2>
            <p className="text-4xl font-bold text-slate-900">{data.multiPlatform.hackerrank_score}</p>
            <p className="text-sm text-slate-500 mt-1">Platform Score</p>
          </div>
        )}

        {data?.multiPlatform?.codechef_data && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">CodeChef</h2>
            <p className="text-4xl font-bold text-slate-900">{data.multiPlatform.codechef_data.rating}</p>
            <p className="text-sm text-slate-500 mt-1">Rating</p>
          </div>
        )}
        
        {data?.multiPlatform?.gfg_data && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">GeeksforGeeks</h2>
            <p className="text-4xl font-bold text-slate-900">{data.multiPlatform.gfg_data.totalSolved}</p>
            <p className="text-sm text-slate-500 mt-1">Problems Solved</p>
          </div>
        )}
      </div>
    </div>
  );
}
