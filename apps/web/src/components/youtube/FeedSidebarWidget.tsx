'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, ChevronRight, Tv } from 'lucide-react';
import { RecommendedVideo } from '@/lib/youtube/types';

const STARTER_VIDEOS = [
  {
    id: 'fallback-1',
    video: {
      videoId: 'pWbOOmQxKgw',
      title: 'How to build a career in AI and Machine Learning',
      thumbnail: 'https://i.ytimg.com/vi/pWbOOmQxKgw/mqdefault.jpg',
    }
  },
  {
    id: 'fallback-2',
    video: {
      videoId: '8hly31xKli0',
      title: 'Algorithms and Data Structures Tutorial',
      thumbnail: 'https://i.ytimg.com/vi/8hly31xKli0/mqdefault.jpg',
    }
  },
  {
    id: 'fallback-3',
    video: {
      videoId: 'v2e_Pj_A2Zc',
      title: 'System Design Interview Prep',
      thumbnail: 'https://i.ytimg.com/vi/v2e_Pj_A2Zc/mqdefault.jpg',
    }
  }
];

function FeedFallback() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm mb-6">
      <h3 className="mb-4 text-sm font-bold text-slate-800 flex items-center gap-2">
        <Tv size={16} className="text-indigo-500" /> Recommended (Starter Pack)
      </h3>
      <div className="space-y-4">
        {STARTER_VIDEOS.map(rec => (
          <div key={rec.id} className="flex gap-3 group">
            <a href={`https://www.youtube.com/watch?v=${rec.video.videoId}`} target="_blank" rel="noopener noreferrer" className="shrink-0 relative overflow-hidden rounded bg-slate-100">
              <Image src={rec.video.thumbnail} alt={rec.video.title} width={80} height={45} className="h-[45px] w-[80px] object-cover transition-transform group-hover:scale-105" />
            </a>
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <a href={`https://www.youtube.com/watch?v=${rec.video.videoId}`} target="_blank" rel="noopener noreferrer" className="line-clamp-2 text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                {rec.video.title}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeedSidebarWidget() {
  const [recommendations, setRecommendations] = useState<RecommendedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchTopRecs() {
      try {
        const res = await fetch('/api/youtube/recommendations');
        if (!res.ok) throw new Error('Failed to fetch recommendations');
        
        const data = await res.json();
        const recs: RecommendedVideo[] = data.recommendations || [];
        
        const topRecs = recs
          .filter(r => !r.watched && !r.dismissed)
          .slice(0, 3);
          
        setRecommendations(topRecs);
      } catch (error) {
        console.error(error);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTopRecs();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm mb-6">
        <h3 className="mb-4 text-sm font-bold text-slate-800 flex items-center gap-2">
          <Tv size={16} className="text-indigo-500" /> Recommended for You
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-[45px] w-[80px] rounded bg-slate-100 shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 w-full bg-slate-100 rounded"></div>
                <div className="h-3 w-2/3 bg-slate-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return <FeedFallback />;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm mb-6">
      <h3 className="mb-4 text-sm font-bold text-slate-800 flex items-center gap-2">
        <Tv size={16} className="text-indigo-500" /> Recommended for You
      </h3>
      
      <div className="space-y-4">
        {recommendations.map(rec => (
          <div key={rec.id} className="flex gap-3 group">
            <a 
              href={`https://www.youtube.com/watch?v=${rec.video.videoId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="shrink-0 relative overflow-hidden rounded bg-slate-100"
              onClick={() => fetch(`/api/youtube/${rec.video.videoId}/watched`, { method: 'POST' }).catch(console.error)}
            >
              <Image 
                src={rec.video.thumbnail} 
                alt={rec.video.title} 
                width={80} 
                height={45} 
                className="h-[45px] w-[80px] object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play size={16} className="text-white" fill="currentColor" />
              </div>
            </a>
            
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <a 
                href={`https://www.youtube.com/watch?v=${rec.video.videoId}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="line-clamp-2 text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight"
                title={rec.video.title}
                onClick={() => fetch(`/api/youtube/${rec.video.videoId}/watched`, { method: 'POST' }).catch(console.error)}
              >
                {rec.video.title}
              </a>
              <span className="text-[10px] text-slate-500 mt-1 truncate">
                {rec.video.channelName}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Link 
        href="/feed" 
        className="mt-5 flex w-full items-center justify-center gap-1 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
      >
        See all recommendations <ChevronRight size={14} />
      </Link>
    </div>
  );
}
