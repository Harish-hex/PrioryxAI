"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, TrendingUp, Calendar, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

export default function ProgressDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [dailyProblem, setDailyProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profRes, recRes, dailyRes] = await Promise.all([
        fetch('/api/leetcode/profile').then(r => r.json()),
        supabase.from('problem_recommendations').select('*').eq('user_id', user.id),
        fetch('/api/leetcode/daily').then(r => r.json())
      ]);

      if (profRes.data) setProfile(profRes.data);
      if (recRes.data) setRecommendations(recRes.data);
      if (dailyRes?.data) setDailyProblem(dailyRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const completedCount = recommendations.filter(r => r.completed).length;
  const totalCount = recommendations.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Group completed problems by week (mocking data if none completed)
  const completedHistory = recommendations.filter(r => r.completed && r.completed_at);
  
  // For the bar chart, we'll just show difficulty breakdown of solved problems from profile
  const solvedData = profile?.solved_data;
  let diffData: any[] = [];
  if (solvedData) {
    diffData = [
      { name: 'Easy', count: solvedData.easySolved, fill: '#4ade80' },
      { name: 'Medium', count: solvedData.mediumSolved, fill: '#facc15' },
      { name: 'Hard', count: solvedData.hardSolved, fill: '#f87171' }
    ];
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Progress Tracking</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-slate-900/70 font-medium">Study Plan Completion</h3>
          </div>
          <div className="mt-4 flex items-end gap-2 mb-3">
            <span className="text-4xl font-bold text-slate-900">{completedCount}</span>
            <span className="text-slate-500 mb-1">/ {totalCount} problems</span>
          </div>
          <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${completionPct}%` }} />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="text-slate-900/70 font-medium">Placement Readiness Score</h3>
          </div>
          <div className="mt-4 flex items-end gap-2 mb-1">
            <span className="text-4xl font-bold text-emerald-400">{profile?.placement_readiness_score || 0}</span>
            <span className="text-slate-500 mb-1">/ 100</span>
          </div>
          <p className="text-xs text-slate-500">Last synced: {new Date(profile?.last_synced_at).toLocaleDateString()}</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-orange-400" />
              <h3 className="text-slate-900/70 font-medium">Daily Challenge</h3>
            </div>
            {dailyProblem ? (
              <div className="mt-4">
                <a 
                  href={`https://leetcode.com/problems/${dailyProblem.titleSlug}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium text-slate-900 hover:text-indigo-400 transition-colors line-clamp-1"
                >
                  {dailyProblem.title}
                </a>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border mt-2 inline-block ${
                  dailyProblem.difficulty === 'Easy' ? 'text-green-400 border-green-400/20 bg-green-400/10' :
                  dailyProblem.difficulty === 'Medium' ? 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10' :
                  'text-red-400 border-red-400/20 bg-red-400/10'
                }`}>
                  {dailyProblem.difficulty}
                </span>
              </div>
            ) : (
              <p className="text-sm text-slate-500 mt-4">Unable to load daily problem.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 h-80">
          <h3 className="text-slate-900/70 font-medium mb-6">Total Solved (LeetCode)</h3>
          {diffData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diffData} margin={{ top: 0, right: 0, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-900/30">No data</div>
          )}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 overflow-hidden flex flex-col">
          <h3 className="text-slate-900/70 font-medium mb-4">Recently Completed (Study Plan)</h3>
          <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-2">
            {completedHistory.length === 0 ? (
              <p className="text-sm text-slate-900/30 text-center mt-10">No problems completed yet.</p>
            ) : (
              completedHistory.sort((a,b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()).map(r => (
                <div key={r.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-white/5">
                  <div className="overflow-hidden pr-4">
                    <p className="text-sm text-slate-900/90 font-medium truncate">{r.problem_title}</p>
                    <p className="text-xs text-indigo-400 capitalize">{r.topic.replace(/-/g, ' ')}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-500">{new Date(r.completed_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
