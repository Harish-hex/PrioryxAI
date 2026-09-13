"use client";

import { useState, useEffect, useMemo } from "react";
import { Play, Search, CheckCircle2, Tv, ExternalLink, BookOpen, Code2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ALL_CODING_PROBLEMS, type CodingProblem } from "@/lib/daily-challenges";
import { recordUserActivity } from "@/lib/activity-tracker";

// ── Masterclasses and Full Courses ──
export const MASTERCLASS_VIDEOS: Record<string, Array<{
  videoId: string;
  title: string;
  channel: string;
  duration: string;
  views: string;
  problemLink?: string | null;
  solutionArticle?: string | null;
}>> = {
  "Tech Stack & Courses": [
    { videoId: "w7ejDZ8SWv8", title: "React JS Full Course 2024", channel: "Traversy Media", duration: "1:49:00", views: "1.5M" },
    { videoId: "Ke90Tje7VS0", title: "Node.js Crash Course", channel: "Traversy Media", duration: "1:30:49", views: "2.1M" },
    { videoId: "f2EqECiTBL8", title: "TypeScript Full Course", channel: "Traversy Media", duration: "1:30:00", views: "920K" },
    { videoId: "_uQrJ0TkZlc", title: "Python for Beginners - Full Course", channel: "Programming with Mosh", duration: "6:14:07", views: "4.2M" },
  ],
  "System Design": [
    { videoId: "xpDnVSmNFX0", title: "System Design for Beginners", channel: "NeetCode", duration: "32:45", views: "720K" },
    { videoId: "lX4CrbXMsNQ", title: "System Design Interview - Step By Step", channel: "freeCodeCamp", duration: "2:31:00", views: "1.1M" },
    { videoId: "i53Gi_K3o7I", title: "Microservices Explained", channel: "TechWorld with Nana", duration: "32:00", views: "1.5M" },
  ],
  "Trending Tech & AI": [
    { videoId: "kCc8FmEb1nY", title: "Build GPT From Scratch (Karpathy)", channel: "Andrej Karpathy", duration: "2:25:21", views: "3.1M" },
    { videoId: "fqMOX6JJhGo", title: "Docker Tutorial for Beginners", channel: "TechWorld with Nana", duration: "2:00:18", views: "2.8M" },
    { videoId: "jgpVdJB29zk", title: "Redis Crash Course", channel: "Traversy Media", duration: "40:00", views: "680K" },
    { videoId: "lG7Uxts9SXs", title: "LangChain Full Course - Build LLM Apps", channel: "freeCodeCamp", duration: "6:53:00", views: "780K" },
  ],
  "Career & FAANG Interview": [
    { videoId: "r1MXwyiGi_U", title: "How to Get a FAANG / MAANG Job", channel: "CS Dojo", duration: "15:00", views: "2.5M" },
    { videoId: "a1zDuOPkMSw", title: "Resume Tips for Software Engineers", channel: "Clément Mihailescu", duration: "14:00", views: "900K" },
    { videoId: "w887NI7NlJg", title: "How to Prepare for Coding Interviews", channel: "CS Dojo", duration: "18:00", views: "2.2M" },
    { videoId: "k9Y6eB0c9_s", title: "Coding Interview Tips - How to Get Offers", channel: "TechLead", duration: "12:00", views: "1.8M" },
  ],
};

export interface VideoItem {
  videoId: string;
  title: string;
  channel: string;
  duration?: string;
  views?: string;
  problemLink?: string | null;
  solutionArticle?: string | null;
  topic?: string;
  category?: string;
}

function buildAllCategories(): Record<string, VideoItem[]> {
  const categories: Record<string, VideoItem[]> = {};

  // 1. Group Curious Freaks DSA Solution Videos by category
  for (const item of ALL_CODING_PROBLEMS) {
    if (item.youtubeId) {
      const catKey = `${item.category} Solutions`;
      if (!categories[catKey]) {
        categories[catKey] = [];
      }
      categories[catKey].push({
        videoId: item.youtubeId,
        title: item.title,
        channel: "Curious Freaks / Striver",
        duration: "Tutorial",
        views: "Curated",
        problemLink: item.problemLink,
        solutionArticle: item.solutionArticle,
        topic: item.topic,
        category: item.category,
      });
    }
  }

  // 2. Add standard masterclasses
  for (const [catName, vids] of Object.entries(MASTERCLASS_VIDEOS)) {
    categories[catName] = vids.map((v) => ({
      ...v,
      category: catName,
    }));
  }

  return categories;
}

const ALL_CATEGORIES_DATA = buildAllCategories();
const ALL_TABS = ["All", ...Object.keys(ALL_CATEGORIES_DATA)];

function VideoCard({
  video,
  watched,
  onWatch,
}: {
  video: VideoItem;
  watched: boolean;
  onWatch: () => void;
}) {
  const [imgSrc, setImgSrc] = useState(
    `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`
  );
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`neu-card group flex flex-col justify-between overflow-hidden rounded-[24px] p-3.5 transition-all duration-300 hover:neu-raised-sm ${
        watched ? "opacity-75" : ""
      }`}
    >
      <div>
        {/* Thumbnail preview */}
        <div className="relative aspect-video w-full overflow-hidden rounded-[18px] bg-slate-900 shadow-inner">
          {!imgFailed ? (
            <img
              src={imgSrc}
              alt={video.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={() => {
                if (imgSrc.includes("mqdefault.jpg")) {
                  setImgSrc(`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`);
                } else {
                  setImgFailed(true);
                }
              }}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-4 text-center text-white">
              <Tv size={28} className="text-slate-400 opacity-60" />
              <span className="mt-2 line-clamp-1 text-xs font-semibold text-slate-300">
                {video.channel}
              </span>
            </div>
          )}

          {/* Duration / Tag badge */}
          <div className="absolute bottom-2 right-2 rounded-md bg-slate-950/85 px-2 py-0.5 font-mono text-[11px] font-bold text-white shadow backdrop-blur-sm">
            {video.duration || "Video"}
          </div>

          {/* Watched badge */}
          {watched && (
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow backdrop-blur-sm">
              <CheckCircle2 size={11} /> Watched
            </div>
          )}
        </div>

        {/* Video Metadata */}
        <div className="mt-3.5 px-1">
          <div className="flex items-center gap-2">
            {video.topic && (
              <span className="neu-pill rounded-full px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                {video.topic}
              </span>
            )}
          </div>

          <h3
            className="mt-1.5 line-clamp-2 text-sm font-bold leading-snug text-slate-950 transition-colors group-hover:text-red-600 dark:text-white dark:group-hover:text-red-400"
            title={video.title}
          >
            {video.title}
          </h3>

          <p className="mt-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
            {video.channel}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 space-y-2 px-1 pb-1">
        {/* Watch Button */}
        <button
          type="button"
          onClick={onWatch}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-red-500/20 transition-all duration-200 hover:from-red-500 hover:to-rose-500 hover:shadow-lg hover:shadow-red-500/30 active:scale-[0.98]"
        >
          <Play size={13} className="fill-white stroke-none" />
          <span>Watch Solution</span>
        </button>

        {/* Practice Links (Problem & Article) */}
        {(video.problemLink || video.solutionArticle) && (
          <div className="flex items-center gap-2 pt-0.5">
            {video.problemLink && (
              <a
                href={video.problemLink}
                target="_blank"
                rel="noopener noreferrer"
                className="neu-btn flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
              >
                <Code2 size={12} />
                <span>Solve</span>
                <ExternalLink size={10} className="opacity-60" />
              </a>
            )}
            {video.solutionArticle && (
              <a
                href={video.solutionArticle}
                target="_blank"
                rel="noopener noreferrer"
                className="neu-btn flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
              >
                <BookOpen size={12} />
                <span>Article</span>
                <ExternalLink size={10} className="opacity-60" />
              </a>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function FeedPageContent() {
  const [activeTab, setActiveTab] = useState("All");
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Load and save watched state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("prioryxai_watched_videos");
      if (saved) setWatchedIds(new Set(JSON.parse(saved) as string[]));
    } catch {}
  }, []);

  const markWatched = (videoId: string) => {
    setWatchedIds((prev) => {
      const next = new Set(Array.from(prev));
      next.add(videoId);
      try {
        localStorage.setItem(
          "prioryxai_watched_videos",
          JSON.stringify(Array.from(next))
        );
      } catch {}
      return next;
    });
    recordUserActivity("youtube_watch", { videoId });
    window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank", "noopener,noreferrer");
  };

  // Local instant search filter across all 450+ curated questions & masterclasses
  const localFilteredCurated = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return ALL_CATEGORIES_DATA;

    const matched: Record<string, VideoItem[]> = {};
    for (const [cat, vids] of Object.entries(ALL_CATEGORIES_DATA)) {
      const filtered = vids.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.channel.toLowerCase().includes(q) ||
          (v.topic && v.topic.toLowerCase().includes(q)) ||
          cat.toLowerCase().includes(q)
      );
      if (filtered.length > 0) {
        matched[cat] = filtered;
      }
    }
    return matched;
  }, [searchQuery]);

  // Determine sections to display
  const displaySections: Record<string, VideoItem[]> = useMemo(() => {
    if (activeTab === "All") {
      return localFilteredCurated;
    }
    const catVideos = localFilteredCurated[activeTab];
    return catVideos ? { [activeTab]: catVideos } : {};
  }, [activeTab, localFilteredCurated]);

  const flatVideos = useMemo(
    () => Object.values(ALL_CATEGORIES_DATA).flat(),
    []
  );
  const totalCuratedCount = flatVideos.length;
  const watchedCount = flatVideos.filter((v) => watchedIds.has(v.videoId)).length;

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="neu-card rounded-[28px] p-5 sm:rounded-[32px] sm:p-8"
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-red-500 dark:text-red-400">
              <Tv size={15} /> Curious Freaks & Masterclasses Library
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Learning Feed
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {watchedCount > 0
                ? `${watchedCount} of ${totalCuratedCount} video tutorials and masterclasses completed`
                : `Explore 360+ handpicked DSA problem tutorials, masterclasses, and algorithm breakdowns.`}
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full max-w-md">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <input
              type="text"
              placeholder="Search 360+ DSA problems, algorithms, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base pl-11 pr-4"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter Category Tabs */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-1 text-sm [mask-image:linear-gradient(to_right,black_calc(100%-1.5rem),transparent)] sm:[mask-image:none]">
          {ALL_TABS.map((tab) => {
            const isActive = activeTab === tab;
            const count = ALL_CATEGORIES_DATA[tab]?.length ?? (tab === "All" ? totalCuratedCount : 0);
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`neu-btn flex items-center gap-1.5 whitespace-nowrap rounded-2xl px-4 py-2 text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? "neu-inset text-slate-950 dark:text-white"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
                }`}
              >
                <span>{tab}</span>
                <span className="opacity-60 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Video Content Grid */}
      {searchQuery.trim() && Object.keys(displaySections).length === 0 ? (
        <div className="neu-card rounded-[28px] p-12 text-center">
          <Tv size={36} className="mx-auto text-slate-400" />
          <h3 className="mt-3 text-lg font-bold text-slate-950 dark:text-white">
            No videos matched &ldquo;{searchQuery}&rdquo;
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Try searching for topics like Dynamic Programming, Graphs, Binary Search, Trees, or Two Pointer.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="neu-btn mt-4 inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(displaySections).map(([category, videos], sectionIdx) => (
            <motion.section
              key={category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(sectionIdx * 0.05, 0.25) }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">
                  <span>{category}</span>
                  <span className="neu-pill rounded-full px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                    {videos.length}
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {videos.map((video) => (
                  <VideoCard
                    key={`${video.videoId}-${video.title}`}
                    video={video}
                    watched={watchedIds.has(video.videoId)}
                    onWatch={() => markWatched(video.videoId)}
                  />
                ))}
              </div>
            </motion.section>
          ))}
        </div>
      )}
    </div>
  );
}
