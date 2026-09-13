'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function HackerRankCertificationsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hackerrank/analysis')
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

  const ai_analysis = data?.ai_analysis;
  
  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">HackerRank Certifications</h1>
        <p className="text-slate-900/60">Validate your skills and enhance your resume.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">AI Certification Advice</h2>
          <p className="text-slate-900/80 leading-relaxed mb-6">
            {ai_analysis?.certificationAdvice || 'No advice generated yet.'}
          </p>
          <button 
            onClick={() => window.open('https://hackerrank.com/skills-verification', '_blank')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-slate-900 font-semibold rounded-xl transition-colors"
          >
            View HackerRank Certifications →
          </button>
        </div>
      </div>
    </div>
  );
}
