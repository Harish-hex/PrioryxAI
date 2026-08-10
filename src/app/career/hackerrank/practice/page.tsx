'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function HackerRankPracticePage() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hackerrank/practice')
      .then(res => res.json())
      .then(d => {
        if (d && !d.error) {
          setRecommendations(d.recommendations || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">HackerRank Practice Plan</h1>
        <p className="text-slate-900/60">Targeted practice domains to earn stream-relevant badges.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((rec, i) => (
          <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500/50 transition-colors">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-bold text-slate-900">{rec.subdomain}</h2>
                <span className={`px-2 py-1 text-xs font-bold rounded-lg text-slate-900 ${
                  rec.priority === 'CRITICAL' ? 'bg-red-500' : 'bg-blue-500'
                }`}>
                  {rec.priority}
                </span>
              </div>
              <p className="text-sm text-slate-900/50 mb-4">{rec.domain}</p>
              <p className="text-sm text-slate-900/80 mb-6 leading-relaxed">{rec.whyThisForStream}</p>
            </div>
            
            <div className="space-y-4">
               <div className="flex justify-between text-sm text-slate-900/60">
                 <span>Difficulty: {rec.difficulty}</span>
                 <span>Target: {rec.estimatedProblems} probs</span>
               </div>
               <button 
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-slate-900 font-semibold rounded-xl transition-colors"
                onClick={() => window.open(rec.hackerrankUrl, '_blank')}
               >
                Practice Now →
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
