'use client';

import { useState, useEffect } from 'react';

// ── Curated videos — always shown even without a YouTube API key ──
const CURATED_VIDEOS: Record<string, Array<{
  videoId: string; title: string; channel: string; duration: string; views: string;
}>> = {
  'DSA & Algorithms': [
    { videoId: 'pkYVOmU3MgA', title: 'Dynamic Programming - Full Course', channel: 'freeCodeCamp', duration: '5:02:46', views: '2.1M' },
    { videoId: 'RBSGKlAvoiM', title: 'Data Structures - Full Course', channel: 'freeCodeCamp', duration: '9:36:57', views: '3.4M' },
    { videoId: 'B31LgI4Y4DQ', title: 'Graph Algorithms for Technical Interviews', channel: 'freeCodeCamp', duration: '2:52:26', views: '854K' },
    { videoId: 'tWVWeAqZ0WU', title: 'Binary Search - Full Course', channel: 'freeCodeCamp', duration: '3:05:00', views: '650K' },
  ],
  'Tech Stack': [
    { videoId: 'w7ejDZ8SWv8', title: 'React JS Full Course 2024', channel: 'Traversy Media', duration: '1:49:00', views: '1.5M' },
    { videoId: 'Ke90Tje7VS0', title: 'Node.js Crash Course', channel: 'Traversy Media', duration: '1:30:49', views: '2.1M' },
    { videoId: 'f2EqECiTBL8', title: 'TypeScript Full Course', channel: 'Traversy Media', duration: '1:30:00', views: '920K' },
    { videoId: 'rHux0gMZ3Eg', title: 'Python for Beginners - Full Course', channel: 'Programming with Mosh', duration: '6:14:07', views: '4.2M' },
  ],
  'System Design': [
    { videoId: 'xpDnVSmNFX0', title: 'System Design for Beginners', channel: 'NeetCode', duration: '32:45', views: '720K' },
    { videoId: 'lX4CrbXMsNQ', title: 'System Design Interview - Step By Step', channel: 'freeCodeCamp', duration: '2:31:00', views: '1.1M' },
    { videoId: 'i53Gi_K3o7I', title: 'Microservices Explained', channel: 'TechWorld with Nana', duration: '32:00', views: '1.5M' },
  ],
  'Trending Tech': [
    { videoId: 'sFmi9AzF7E0', title: 'Build GPT From Scratch (Karpathy)', channel: 'Andrej Karpathy', duration: '2:25:21', views: '3.1M' },
    { videoId: 'AhyznRSDjw8', title: 'Docker Tutorial for Beginners', channel: 'TechWorld with Nana', duration: '2:00:18', views: '2.8M' },
    { videoId: '8aGhZQkoFbQ', title: 'Redis Crash Course', channel: 'Traversy Media', duration: '40:00', views: '680K' },
    { videoId: 'pTFZFxd5uri', title: 'LangChain Full Course - Build LLM Apps', channel: 'freeCodeCamp', duration: '6:53:00', views: '780K' },
  ],
  'Career & Interview': [
    { videoId: 'Mv5ALWA6zTk', title: 'How to Get a FAANG Job', channel: 'CS Dojo', duration: '15:00', views: '2.5M' },
    { videoId: 'BN3L7MvSAqY', title: 'Resume Tips for Software Engineers', channel: 'Clément Mihailescu', duration: '14:00', views: '900K' },
    { videoId: 'qIMFR7o7PHY', title: 'How to Prepare for Coding Interviews', channel: 'CS Dojo', duration: '18:00', views: '2.2M' },
    { videoId: 'GJsBn4Oys6c', title: 'Coding Interview Tips - How to Get Offers', channel: 'TechLead', duration: '12:00', views: '1.8M' },
  ],
  'Languages': [
    { videoId: '_uQrJ0TkZlc', title: 'Python Full Course - 12 Hours', channel: 'Programming with Mosh', duration: '12:10:00', views: '5.1M' },
    { videoId: 'W6NZfCO5SIk', title: 'JavaScript Full Course', channel: 'Programming with Mosh', duration: '7:21:00', views: '3.8M' },
    { videoId: 'GjqeZzvgsHc', title: 'Java Full Course', channel: 'Programming with Mosh', duration: '2:30:00', views: '3.2M' },
    { videoId: 'vLnPwxZdW4Y', title: 'C++ Full Course', channel: 'freeCodeCamp', duration: '31:00:00', views: '2.1M' },
  ],
};

const ALL_TABS = ['All', ...Object.keys(CURATED_VIDEOS)];

interface VideoItem {
  videoId: string;
  title: string;
  channel: string;
  duration: string;
  views: string;
}

function VideoCard({ video, watched, onWatch }: {
  video: VideoItem; watched: boolean; onWatch: () => void
}) {
  const thumb = `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`;
  return (
    <div className={`border border-slate-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow ${watched ? 'opacity-60' : ''}`}>
      <div className="relative aspect-video bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb}
          alt={video.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">
          {video.duration}
        </div>
        {watched && (
          <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">
            ✓ Watched
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium line-clamp-2 text-slate-900">{video.title}</h3>
        <p className="text-xs text-slate-500 mt-1">{video.channel}</p>
        <p className="text-xs text-slate-400 mt-0.5">{video.views} views</p>
        <button
          onClick={onWatch}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors"
        >
          ▶ Watch
        </button>
      </div>
    </div>
  );
}

export function FeedPageContent() {
  const [activeTab, setActiveTab] = useState('All');
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VideoItem[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Persist watched state in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('prioryxai_watched_videos');
      if (saved) setWatchedIds(new Set(JSON.parse(saved) as string[]));
    } catch {}
  }, []);

  const markWatched = (videoId: string) => {
    setWatchedIds(prev => {
      const next = new Set(Array.from(prev));
      next.add(videoId);
      try { localStorage.setItem('prioryxai_watched_videos', JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
    window.open(`https://youtube.com/watch?v=${videoId}`, '_blank');
  };

  // Debounced Search API call
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.videos || []);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter videos by tab for CURATED view
  const displaySections: Record<string, VideoItem[]> = activeTab === 'All'
    ? CURATED_VIDEOS
    : { [activeTab]: CURATED_VIDEOS[activeTab] ?? [] };

  const filteredSections: Record<string, VideoItem[]> = Object.fromEntries(
    Object.entries(displaySections).map(([cat, vids]) => [
      cat, vids
    ]).filter(([, vids]) => (vids as VideoItem[]).length > 0)
  );

  const flatVideos = Object.values(filteredSections).flat() as VideoItem[];
  const totalVideos = flatVideos.length;
  const watchedCount = flatVideos.filter((v: VideoItem) => watchedIds.has(v.videoId)).length;

  return (
    <div className="w-full text-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Learning Feed</h1>
            <p className="text-sm text-slate-500 mt-1">
              {watchedCount > 0
                ? `${watchedCount} / ${totalVideos} videos watched`
                : 'Curated tech resources to boost your career'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full max-w-sm px-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 overflow-x-auto mb-8">
          {ALL_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Video Sections */}
        {searchQuery.trim() ? (
          // SEARCH RESULTS VIEW
          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Search Results
              {!isSearching && searchResults && (
                <span className="text-sm font-normal text-slate-400 ml-2">({searchResults.length})</span>
              )}
            </h2>

            {isSearching ? (
              // SKELETON LOADERS
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="aspect-video bg-slate-200 animate-pulse"></div>
                    <div className="p-3">
                      <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded animate-pulse w-1/2 mb-1"></div>
                      <div className="h-3 bg-slate-200 rounded animate-pulse w-1/3 mt-3"></div>
                      <div className="mt-3 h-8 bg-slate-200 rounded-lg animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchResults && searchResults.length === 0 ? (
              // EMPTY STATE
              <div className="text-center py-16">
                <p className="text-slate-500">No videos match your search.</p>
                <button onClick={() => setSearchQuery('')} className="mt-2 text-sm text-indigo-500 hover:underline">
                  Clear search
                </button>
              </div>
            ) : (
              // RESULTS
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {searchResults?.map(video => (
                  <VideoCard
                    key={video.videoId}
                    video={video}
                    watched={watchedIds.has(video.videoId)}
                    onWatch={() => markWatched(video.videoId)}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          // CURATED VIEW
          <div className="space-y-10">
            {Object.entries(filteredSections).map(([category, videos]) => (
              <section key={category}>
                <h2 className="text-lg font-semibold text-slate-800 mb-4">
                  {category}
                  <span className="text-sm font-normal text-slate-400 ml-2">({videos.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {videos.map(video => (
                    <VideoCard
                      key={video.videoId}
                      video={video}
                      watched={watchedIds.has(video.videoId)}
                      onWatch={() => markWatched(video.videoId)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

