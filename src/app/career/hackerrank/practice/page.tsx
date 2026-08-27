'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, RefreshCw, ListChecks } from 'lucide-react';

interface PracticeRec {
  domain: string;
  subdomain: string;
  difficulty: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  hackerrankUrl: string;
  estimatedProblems: number;
  whyThisForStream: string;
}

export default function HackerRankPracticePage() {
  const [recommendations, setRecommendations] = useState<PracticeRec[]>([]);
  const [connected, setConnected] = useState(true);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    fetch('/api/hackerrank/practice')
      .then(async res => {
        const d = await res.json();
        if (!res.ok) throw new Error(d?.error ?? `Request failed (${res.status})`);
        return d;
      })
      .then(d => {
        setConnected(d.connected !== false);
        setRecommendations(d.recommendations || []);
      })
      .catch(e => setError(e.message || 'Failed to load your practice plan'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError('');
      const res = await fetch('/api/hackerrank/practice', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to generate practice plan');
      setRecommendations(data.recommendations || []);
      setConnected(true);
    } catch (e: any) {
      setError(e.message || 'Failed to generate practice plan');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">HackerRank Practice Plan</h1>
          <p className="text-slate-600 dark:text-white/60">Targeted practice domains to earn stream-relevant badges.</p>
        </div>
        {connected && recommendations.length > 0 && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Regenerate Plan
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
          {error}
        </div>
      )}

      {!connected ? (
        <div className="flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-12">
          <ListChecks className="w-16 h-16 text-slate-300 dark:text-white/20 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Connect HackerRank First</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">Link your HackerRank profile to generate a personalized practice plan.</p>
          <Link
            href="/career/hackerrank"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
          >
            Connect HackerRank
          </Link>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-12">
          <ListChecks className="w-16 h-16 text-slate-300 dark:text-white/20 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Practice Plan Yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">Generate a personalized practice plan based on your badges and target stream.</p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {generating && <Loader2 className="w-5 h-5 animate-spin" />}
            Generate Practice Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((rec, i) => (
            <div key={i} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500/50 dark:hover:border-indigo-400/50 transition-colors">
              <div>
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{rec.subdomain}</h2>
                  <span className={`shrink-0 px-2 py-1 text-xs font-bold rounded-lg text-white ${
                    rec.priority === 'CRITICAL' ? 'bg-red-500' : rec.priority === 'HIGH' ? 'bg-amber-500' : 'bg-blue-500'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-white/50 mb-4">{rec.domain}</p>
                <p className="text-sm text-slate-700 dark:text-white/80 mb-6 leading-relaxed">{rec.whyThisForStream}</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-sm text-slate-500 dark:text-white/60">
                  <span>Difficulty: {rec.difficulty}</span>
                  <span>Target: {rec.estimatedProblems} probs</span>
                </div>
                <button
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
                  onClick={() => window.open(rec.hackerrankUrl, '_blank')}
                >
                  Practice Now →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
