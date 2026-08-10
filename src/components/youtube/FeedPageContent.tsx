'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, LayoutDashboard, Bookmark, Loader2 } from 'lucide-react';
import { RecommendedVideo } from '@/lib/youtube/types';
import { VideoRecommendationCard } from './VideoRecommendationCard';
import { motion } from 'framer-motion';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'dsa_problem', label: 'DSA & Algorithms' },
  { id: 'tech_stack', label: 'Tech Stack' },
  { id: 'trending_tech', label: 'Trending' },
  { id: 'system_design', label: 'System Design' },
  { id: 'career_growth', label: 'Career' },
  { id: 'project_tutorial', label: 'My Projects' },
  { id: 'language', label: 'Languages' },
  { id: 'saved', label: 'Saved' }
];

export function FeedPageContent() {
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendedVideo[]>([]);
  const [savedRecs, setSavedRecs] = useState<RecommendedVideo[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const fetchRecs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/youtube/recommendations');
      const data = await res.json();
      setRecommendations(data.recommendations || []);
      setGeneratedAt(data.generatedAt);
      
      const savedRes = await fetch('/api/youtube/saved');
      const savedData = await savedRes.json();
      setSavedRecs(savedData.saved || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecs();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/youtube/refresh', { method: 'POST' });
      if (res.status === 429) {
        alert('You can only refresh once every 6 hours.');
      } else {
        alert('Refresh queued! Recommendations will update shortly.');
        setTimeout(fetchRecs, 5000);
      }
    } catch (e) {
      console.error(e);
    }
    setRefreshing(false);
  };

  const handleDismissed = (id: string) => {
    setRecommendations(prev => prev.filter(r => r.id !== id));
    setSavedRecs(prev => prev.filter(r => r.id !== id));
  };

  const getFiltered = () => {
    if (activeTab === 'all') return recommendations;
    if (activeTab === 'saved') return savedRecs;
    return recommendations.filter(r => r.category === activeTab);
  };

  const filtered = getFiltered();
  const unwatchedTodayCount = recommendations.filter(r => !r.watched).length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Your Learning Feed</h1>
          <p className="mt-2 text-slate-500">
            AI-curated videos based on your LeetCode weak spots, resume gaps, and career goals.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-200">
              <span className="text-xs font-bold text-indigo-700">{Math.min(unwatchedTodayCount, 2)}</span>
            </div>
            <span className="text-sm font-medium text-indigo-700">Today's goal: Watch 2 videos</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex w-full overflow-x-auto border-b border-slate-200 pb-px hide-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex min-w-max items-center px-4 py-3 text-sm font-medium transition ${
              activeTab === tab.id ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.id === 'saved' && <Bookmark size={14} className="mr-1.5" />}
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="feed-tab-active"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="animate-pulse flex flex-col rounded-xl border border-slate-200 bg-white">
              <div className="aspect-video w-full bg-slate-100 rounded-t-xl" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-full" />
                <div className="h-4 bg-slate-100 rounded w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-1/3 mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-24 text-center">
          <LayoutDashboard size={48} className="text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">No recommendations found</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-md">
            We couldn't find any recommendations for this category. Connect your LeetCode profile or upload your resume to get personalized videos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(rec => (
            <VideoRecommendationCard key={rec.id} recommendation={rec} onDismissed={handleDismissed} />
          ))}
        </div>
      )}
      
      {generatedAt && (
        <p className="mt-8 text-center text-xs text-slate-400">
          Last updated: {new Date(generatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
