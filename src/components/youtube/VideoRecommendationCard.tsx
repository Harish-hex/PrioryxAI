'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play, Bookmark, X, BadgeCheck } from 'lucide-react';
import { RecommendedVideo } from '@/lib/youtube/types';
import { motion, AnimatePresence } from 'framer-motion';

const TRUSTED_CHANNELS = [
  'UCVa4bnpgRbNnPYMwEGFJh5A', 'UC_mB3bSM5NwpvFt2IxnXcNg',
  'UCnxhETjJtTPs37KCavpwDSw', 'UC8butISFwT-Wl7EV0hUK0BQ',
  'UCWN3xxRkmTPmbKwht9FuE5A', 'UCbmNph6atAoGfqLoCL_duAg',
  'UCW5YeuERMmlnqo4oq8vwUpg', 'UCsXVk37bltHxD1rDPwtNM8Q',
  'UClEEsT7DkdVO_fkrBx0brHQ', 'UCYO_jab_esuFRV4b17AJtAw',
  'UCJli7rFnNcCIFmjepBbJqyQ', 'UC29ju8bIPH5as8OGnQzwJyA'
];

interface Props {
  recommendation: RecommendedVideo;
  onDismissed?: (id: string) => void;
}

export function VideoRecommendationCard({ recommendation, onDismissed }: Props) {
  const { video, priority, category, whyRecommended, relevanceTopic, savedForLater } = recommendation;
  const [isSaved, setIsSaved] = useState(savedForLater);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDismissPopover, setShowDismissPopover] = useState(false);

  const formatViewCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M views`;
    if (count >= 1000) return `${Math.floor(count / 1000)}K views`;
    return `${count} views`;
  };

  const getPriorityColor = () => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-blue-500 text-white';
      case 'LOW': return 'bg-slate-500 text-white';
    }
  };

  const getCategoryLabel = () => {
    return category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const handleWatch = async () => {
    window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank', 'noopener,noreferrer');
    fetch(`/api/youtube/${video.videoId}/watched`, { method: 'POST' }).catch(console.error);
  };

  const handleToggleSave = async () => {
    setIsSaved(!isSaved);
    fetch(`/api/youtube/${video.videoId}/save`, { method: 'POST' }).catch(console.error);
  };

  const handleDismiss = async (reason?: string) => {
    setIsDismissed(true);
    fetch(`/api/youtube/${video.videoId}/dismiss`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    }).catch(console.error);
    
    setTimeout(() => {
      onDismissed?.(recommendation.id);
    }, 300);
  };

  if (isDismissed && !showDismissPopover) return null;

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
          className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md relative"
        >
          {showDismissPopover ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 p-4 backdrop-blur-sm">
              <p className="mb-4 text-sm font-medium text-slate-700">Why are you dismissing this?</p>
              <div className="flex flex-col gap-2 w-full max-w-[200px]">
                {['Too basic', 'Already know this', 'Not relevant', 'Not interested'].map(r => (
                  <button
                    key={r}
                    onClick={() => { handleDismiss(r); setShowDismissPopover(false); }}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                  >
                    {r}
                  </button>
                ))}
                <button 
                  onClick={() => setShowDismissPopover(false)}
                  className="mt-2 text-xs text-slate-500 underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {/* TOP */}
          <div className="relative aspect-video w-full overflow-hidden bg-slate-100 cursor-pointer" onClick={handleWatch}>
            <Image 
              src={video.thumbnail} 
              alt={video.title} 
              width={320} 
              height={180} 
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
            <div className={`absolute left-2 top-2 rounded px-2 py-0.5 text-[10px] font-bold tracking-wider ${getPriorityColor()}`}>
              {priority}
            </div>
            <div className="absolute right-2 top-2 rounded bg-slate-900/80 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
              {getCategoryLabel()}
            </div>
            <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
              {video.duration}
            </div>
          </div>

          {/* BODY */}
          <div className="flex flex-1 flex-col p-3">
            <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 leading-tight mb-1" title={video.title}>
              {video.title}
            </h3>
            
            <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
              <span className="truncate">{video.channelName}</span>
              {TRUSTED_CHANNELS.includes(video.channelId) && (
                <BadgeCheck size={14} className="text-blue-500 shrink-0" />
              )}
            </div>

            <div className="flex items-center text-[11px] text-slate-500 mb-3">
              <span>{formatViewCount(video.viewCount)}</span>
              <span className="mx-1">•</span>
              <span>{new Date(video.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</span>
            </div>

            <div className="mt-auto">
              <p className="line-clamp-1 text-[11px] italic text-slate-500 mb-2">
                &ldquo;{whyRecommended}&rdquo;
              </p>
              <div className="inline-block rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-medium text-indigo-700">
                {relevanceTopic}
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-between border-t border-slate-100 p-2">
            <button
              onClick={handleWatch}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
            >
              <Play size={14} fill="currentColor" /> Watch
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={handleToggleSave}
                className={`rounded-lg p-1.5 transition ${isSaved ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                title={isSaved ? "Saved for later" : "Save for later"}
              >
                <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
              </button>
              <button
                onClick={() => setShowDismissPopover(true)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
