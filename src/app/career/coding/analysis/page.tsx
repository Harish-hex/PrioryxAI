"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";

const TopicRadarChart = dynamic(() => import("@/components/leetcode/TopicRadarChart").then(mod => mod.TopicRadarChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
});

const ContestRatingChart = dynamic(() => import("@/components/leetcode/ContestRatingChart").then(mod => mod.ContestRatingChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
});

const ContributionHeatmap = dynamic(() => import("@/components/leetcode/ContributionHeatmap").then(mod => mod.ContributionHeatmap), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
});
import { PriorityTopicTable } from "@/components/leetcode/PriorityTopicTable";
import { createClient } from "@/lib/supabase/client";

export default function AnalysisDashboard() {
  const [analysis, setAnalysis] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileRow } = await supabase
        .from('leetcode_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (profileRow) {
        setProfile(profileRow);
        
        // Fetch AI Analysis from our route (handles 'analyzing' state)
        const res = await fetch('/api/leetcode/analysis');
        const aiData = await res.json();
        
        if (aiData.status === 'analyzing') {
          // Poll every 5s if still analyzing
          setTimeout(fetchData, 5000);
        } else if (aiData.data) {
          setAnalysis(aiData.data);
          setLoading(false);
        } else {
          setError("Failed to fetch analysis.");
          setLoading(false);
        }
      } else {
        setError("No profile found.");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading || (profile && !analysis && !error)) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-slate-600 animate-pulse">Running deep AI analysis on your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      </div>
    );
  }

  // Formatting topics for Radar
  const radarTopics = (analysis?.priority_topics || []).map((t: any) => {
    const levelMap: Record<string, number> = { 'NONE': 1, 'BEGINNER': 2, 'INTERMEDIATE': 3, 'ADVANCED': 4 };
    return {
      topic: t.topic.replace(/-/g, ' '),
      score: levelMap[t.current_level] || 1,
      max: 4
    };
  }).slice(0, 8); // top 8 for radar

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">AI Profile Analysis</h1>
        <div className="px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-sm font-medium">
          Status: <span className="text-indigo-400">{analysis.placement_readiness.replace(/_/g, ' ')}</span>
        </div>
      </div>

      {/* TABS */}
      <div className="flex space-x-1 border-b border-slate-200 mb-8 overflow-x-auto custom-scrollbar">
        {['overview', 'skills', 'contest', 'streak', 'feedback'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium capitalize whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-transparent text-slate-500 hover:text-slate-900/80 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(analysis.score_breakdown).map(([key, val]) => (
                <div key={key} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">{key}</h4>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-slate-900">{val as number}</span>
                    <span className="text-sm text-slate-500 mb-1">/ 25</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
                <h3 className="text-emerald-400 font-semibold mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Key Strengths
                </h3>
                <ul className="space-y-3">
                  {analysis.strengths?.map((s: string, i: number) => (
                    <li key={i} className="text-sm text-emerald-100/70 flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                <h3 className="text-red-400 font-semibold mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> Critical Gaps
                </h3>
                <ul className="space-y-3">
                  {analysis.critical_gaps?.map((g: string, i: number) => (
                    <li key={i} className="text-sm text-red-100/70 flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span> {g}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SKILLS TAB */}
        {activeTab === 'skills' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center">
              <h3 className="text-sm font-medium text-slate-600 w-full mb-4 text-center">Topic Mastery Radar</h3>
              <TopicRadarChart topics={radarTopics} />
            </div>
            
            <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-6 overflow-hidden">
              <h3 className="text-sm font-medium text-slate-600 mb-4">Topic Priority Analysis</h3>
              <PriorityTopicTable topics={analysis.priority_topics} />
            </div>
          </div>
        )}

        {/* CONTEST TAB */}
        {activeTab === 'contest' && (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium text-slate-600">Contest Rating History</h3>
                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-semibold rounded-full border border-indigo-500/20">
                  Tier: {analysis.contest_assessment?.rating_tier}
                </span>
              </div>
              <ContestRatingChart history={profile?.contest_history || []} />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <h3 className="text-sm font-medium text-slate-600 mb-3">AI Contest Advice</h3>
              <p className="text-slate-900/80 text-sm leading-relaxed">{analysis.contest_assessment?.contest_advice}</p>
            </div>
          </div>
        )}

        {/* STREAK TAB */}
        {activeTab === 'streak' && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-slate-600 mb-6">Submission Heatmap (1 Year)</h3>
            <ContributionHeatmap calendarString={profile?.calendar_data?.submissionCalendar} />
          </div>
        )}

        {/* FEEDBACK TAB */}
        {activeTab === 'feedback' && (
          <div className="space-y-6">
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-indigo-400 mb-4">Personalized Assessment</h3>
              <p className="text-slate-900/80 text-sm leading-relaxed whitespace-pre-wrap">
                {analysis.personalized_feedback}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Your 12-Week Roadmap</h3>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                {analysis['12_week_roadmap']?.map((week: any, i: number) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-500 text-xs font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                      W{week.week}
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-indigo-500/30 transition-colors">
                      <h4 className="font-semibold text-slate-900/90 mb-1">{week.focus}</h4>
                      <p className="text-xs text-slate-500 mb-3">{week.milestone}</p>
                      <div className="flex flex-wrap gap-1">
                        {week.topics?.map((t: string) => (
                          <span key={t} className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
