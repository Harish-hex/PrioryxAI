'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function HackerRankAnalysisPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetch('/api/hackerrank/analysis')
      .then(res => {
        if (res.status === 202) {
          setLoading(false);
          return;
        }
        return res.json();
      })
      .then(d => {
        if (d && !d.error) {
          setData(d);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  if (!data || !data.ai_analysis) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center">
          <h2 className="text-xl text-slate-900 font-semibold mb-2">Analysis in Progress</h2>
          <p className="text-slate-900/60">Your profile is currently being analyzed by AI or could not be found. Please check back shortly.</p>
        </div>
      </div>
    );
  }

  const { ai_analysis, hackerrank_analysis } = data;

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">HackerRank Deep Analysis</h1>
        <p className="text-slate-900/60">AI-driven insights on your stream alignment and badge profile.</p>
      </div>
      
      <div className="flex space-x-2 border-b border-slate-200 mb-6">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 ${activeTab === 'overview' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-slate-900/60 hover:text-slate-900'}`}
        >
          Profile Overview
        </button>
        <button 
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2 ${activeTab === 'badges' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-slate-900/60 hover:text-slate-900'}`}
        >
          Badge Analysis
        </button>
        <button 
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 ${activeTab === 'ai' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-slate-900/60 hover:text-slate-900'}`}
        >
          AI Feedback
        </button>
      </div>
      
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
             <h3 className="text-slate-900/60 font-medium mb-2">Total Score</h3>
             <p className="text-4xl font-bold text-slate-900">{hackerrank_analysis.totalScore}/100</p>
           </div>
           <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
             <h3 className="text-slate-900/60 font-medium mb-2">Stream Alignment</h3>
             <p className="text-2xl font-bold text-slate-900">{hackerrank_analysis.streamAlignment}</p>
           </div>
        </div>
      )}

      {activeTab === 'badges' && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Missing Badges</h2>
          <ul className="list-disc pl-5 text-slate-900/80 space-y-2">
            {hackerrank_analysis.missingBadges?.map((b: string) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Overall Assessment</h2>
          <p className="text-slate-900/80 leading-relaxed">{ai_analysis.overallAssessment}</p>
        </div>
      )}
    </div>
  );
}
