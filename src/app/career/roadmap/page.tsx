"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Compass, HelpCircle, ChevronRight, Search } from "lucide-react";
import {
  CATALOG,
  isCurated,
  totalTopicCount,
  listRoadmaps,
  getRoadmap,
  type RoadmapCatalogEntry,
} from "@/lib/roadmaps/data";
import { matchRoadmaps, type RoadmapMatch } from "@/lib/roadmaps/match";
import { ROLE_ICONS, ROLE_ACCENTS, CATEGORY_LABELS } from "./shared";

type CategoryFilter = "all" | "role" | "skill" | "beginner" | "practice";

export default function RoadmapDashboard() {
  const [userStream, setUserStream] = useState<string | null>(null);
  const [recommended, setRecommended] = useState<RoadmapMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");

  useEffect(() => {
    let cancelled = false;

    async function loadSignals() {
      const signals: string[] = [];

      try {
        const profileRes = await fetch("/api/user/profile");
        const profileData = await profileRes.json();
        const stream = profileData?.profile?.stream as string | undefined;
        const subjects = profileData?.profile?.subjects as string[] | undefined;
        const githubLangs = profileData?.profile?.top_repos as Array<{ language?: string }> | undefined;

        if (stream) {
          if (!cancelled) setUserStream(stream);
          signals.push(stream);
        }
        if (Array.isArray(subjects)) signals.push(...subjects);
        if (Array.isArray(githubLangs)) {
          signals.push(...githubLangs.map((r) => r.language).filter(Boolean) as string[]);
        }
      } catch {}

      try {
        const resumeRes = await fetch("/api/career/resume");
        const resumeData = await resumeRes.json();
        const resume = resumeData?.data;
        const skillEntities = resume?.skill_entities;
        if (Array.isArray(skillEntities)) {
          signals.push(...skillEntities.map((s: any) => (typeof s === "string" ? s : s?.name)).filter(Boolean));
        } else if (skillEntities && typeof skillEntities === "object" && Array.isArray(skillEntities.skills)) {
          signals.push(...skillEntities.skills.filter(Boolean));
        }
        const parsedSkills = resume?.parsed_data?.skills;
        if (Array.isArray(parsedSkills)) signals.push(...parsedSkills.filter(Boolean));
      } catch {}

      if (!cancelled) {
        setRecommended(matchRoadmaps(signals).filter((m) => isCurated(m.id)));
        setLoading(false);
      }
    }

    loadSignals();
    return () => {
      cancelled = true;
    };
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return CATALOG.filter((entry) => {
      if (entry.label.toLowerCase().includes(q)) return true;
      if (entry.id.toLowerCase().includes(q)) return true;
      const r = getRoadmap(entry.id);
      if (r?.tagline?.toLowerCase().includes(q)) return true;
      if (
        r?.sections?.some(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.topics.some((t) => t.title.toLowerCase().includes(q))
        )
      ) {
        return true;
      }
      return false;
    });
  }, [searchQuery]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-3 py-6 sm:px-6 sm:py-8">
      {/* 1. Career Roadmap Header — Floating Neumorphism Banner Card */}
      <header className="neu-card rounded-[28px] p-6 sm:rounded-[32px] sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="neu-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <img src="/logo.png" alt="PrioryxAI" className="h-4 w-4 shrink-0 object-contain" />
                <span>PrioryxAI workspace</span>
              </div>
              <span className="neu-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Compass size={14} className="text-cyan-500" />
                <span>{CATALOG.length} Roadmaps</span>
              </span>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
                Career Roadmap
              </h1>
              <p className="mt-2 max-w-2xl text-sm sm:text-base font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                A guided, step-by-step path for every role — matched to your onboarding stream and resume skills where possible.
              </p>
            </div>
          </div>

          {/* Search bar inside the header */}
          <div className="relative w-full md:max-w-xs lg:max-w-sm">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <input
              type="text"
              placeholder="Search 90+ roadmaps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="neu-inset w-full rounded-2xl py-3 pl-11 pr-10 text-sm font-medium text-slate-900 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50 dark:text-white dark:placeholder-slate-400"
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
      </header>

      {/* 2. Recommended Section — Floating Neumorphic Card Header + Floating Cards */}
      {!loading && recommended.length > 0 && !searchQuery.trim() && (
        <section className="space-y-4">
          <div className="neu-card rounded-[24px] p-5 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              Recommended for you
            </h2>
            <p className="mt-1 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
              Matched to your profile stream and resume signals
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.slice(0, 6).map((match) => {
              const roadmap = listRoadmaps().find((r) => r.id === match.id);
              if (!roadmap) return null;
              const Icon = ROLE_ICONS[match.id] ?? HelpCircle;
              const topicCount = totalTopicCount(roadmap);

              return (
                <Link
                  key={match.id}
                  href={`/career/roadmap/${match.id}`}
                  className="neu-card group relative flex flex-col justify-between rounded-[24px] p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${ROLE_ACCENTS[match.id] ?? "from-slate-500 to-slate-600"} text-white shadow-sm transition-transform duration-200 group-hover:scale-105`}
                      >
                        <Icon size={22} />
                      </div>
                      <span className="neu-pill rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Matched
                      </span>
                    </div>

                    <h3 className="mt-3.5 text-base font-bold text-slate-950 dark:text-white transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                      {match.label}
                    </h3>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
                      {roadmap.tagline}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-200/80 pt-3 dark:border-white/10">
                    <span className="neu-pill rounded-lg px-2 py-0.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      {topicCount} topics
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 transition-transform duration-200 group-hover:translate-x-0.5">
                      Explore <ChevronRight size={13} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Catalog Section with Search Results or Categorized Streams */}
      {searchQuery.trim() ? (
        <section className="space-y-4">
          <div className="neu-card flex flex-col gap-3 rounded-[24px] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-center gap-3">
              <div className="neu-pill flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-cyan-600 dark:text-cyan-400">
                <Search size={18} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-950 dark:text-white">
                  Search Results
                </h2>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Showing roadmaps matching &ldquo;{searchQuery}&rdquo;
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="neu-pill rounded-full px-3.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                {searchResults.length} {searchResults.length === 1 ? "Match" : "Matches"}
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="neu-pill rounded-full px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-400"
              >
                Clear
              </button>
            </div>
          </div>

          {searchResults.length === 0 ? (
            <div className="neu-card rounded-[28px] p-8 text-center space-y-3">
              <p className="text-base font-bold text-slate-950 dark:text-white">
                No roadmaps match &ldquo;{searchQuery}&rdquo;
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Try searching for another role, technology, or clear the search query.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="neu-pill rounded-xl px-4 py-2 text-xs font-bold text-cyan-600 dark:text-cyan-400"
              >
                Show all roadmaps
              </button>
            </div>
          ) : (
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((entry) => (
                <CatalogCard key={entry.id} entry={entry} isRecommended={entry.id === userStream} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <CatalogPicker
          userStream={userStream}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      )}
    </div>
  );
}

function CatalogPicker({
  userStream,
  selectedCategory,
  onSelectCategory,
}: {
  userStream: string | null;
  selectedCategory: CategoryFilter;
  onSelectCategory: (cat: CategoryFilter) => void;
}) {
  const allCategories: Array<"role" | "skill" | "beginner" | "practice"> = [
    "role",
    "skill",
    "beginner",
    "practice",
  ];

  const filterTabs: Array<{ id: CategoryFilter; label: string; count: number }> = [
    { id: "all", label: "All Tracks", count: CATALOG.length },
    { id: "role", label: "Roles", count: CATALOG.filter((e) => e.category === "role").length },
    { id: "skill", label: "Skills", count: CATALOG.filter((e) => e.category === "skill").length },
    { id: "beginner", label: "Foundational", count: CATALOG.filter((e) => e.category === "beginner").length },
    { id: "practice", label: "Best Practices", count: CATALOG.filter((e) => e.category === "practice").length },
  ];

  const visibleCategories =
    selectedCategory === "all" ? allCategories : allCategories.filter((c) => c === selectedCategory);

  const displayedCount =
    selectedCategory === "all"
      ? CATALOG.length
      : CATALOG.filter((e) => e.category === selectedCategory).length;

  return (
    <div className="space-y-8">
      {/* 3. "All Roadmaps" Section Header — Floating Neumorphic Card */}
      <div className="neu-card flex flex-col gap-4 rounded-[28px] p-5 sm:rounded-[32px] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="neu-pill flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-cyan-600 dark:text-cyan-400">
              <Compass size={20} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                All Roadmaps
              </h2>
              <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                Every roadmap opens with videos, certifications, and progress tracking — pick a track to get started.
              </p>
            </div>
          </div>
          <span className="neu-pill self-start sm:self-auto rounded-full px-3.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            {displayedCount} Tracks Available
          </span>
        </div>

        {/* Category Filter Tabs in Neumorphic Style */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200/60 pt-3.5 dark:border-white/5">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectCategory(tab.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                selectedCategory === tab.id
                  ? "neu-btn-pressed bg-cyan-500/15 text-cyan-600 border border-cyan-500/30 dark:bg-cyan-500/25 dark:text-cyan-400"
                  : "neu-pill text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* 4. Category Streams — Each with Floating Neumorphic Category Bar and Floating Cards */}
      <div className="space-y-10">
        {visibleCategories.map((cat) => {
          const entries = [...CATALOG.filter((e) => e.category === cat)].sort((a, b) => {
            if (a.id === userStream) return -1;
            if (b.id === userStream) return 1;
            const aCurated = isCurated(a.id) ? 0 : 1;
            const bCurated = isCurated(b.id) ? 0 : 1;
            return aCurated - bCurated;
          });
          if (entries.length === 0) return null;

          return (
            <div key={cat} className="space-y-4">
              {/* Category Stream Header: Floating Neumorphic Bar */}
              <div className="neu-card flex items-center justify-between rounded-[22px] px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="h-4 w-1.5 rounded-full bg-cyan-500 shadow-sm shadow-cyan-500/50" />
                  <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-950 dark:text-white">
                    {CATEGORY_LABELS[cat]}
                  </h3>
                </div>
                <span className="neu-pill rounded-full px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                  {entries.length} {entries.length === 1 ? "track" : "tracks"}
                </span>
              </div>

              {/* Floating Cards Grid — each card floats directly on page background */}
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {entries.map((entry) => (
                  <CatalogCard key={entry.id} entry={entry} isRecommended={entry.id === userStream} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CatalogCard({ entry, isRecommended }: { entry: RoadmapCatalogEntry; isRecommended: boolean }) {
  const curated = isCurated(entry.id);
  const Icon = ROLE_ICONS[entry.id] ?? HelpCircle;

  if (!curated) {
    return (
      <div
        title="This roadmap is being built — check back soon"
        className="neu-card relative flex w-full items-center justify-between gap-3 rounded-[22px] p-4 opacity-90 transition-all duration-200 hover:opacity-100 hover:-translate-y-0.5"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${ROLE_ACCENTS[entry.id] ?? "from-slate-500 to-slate-600"} text-white shadow-sm`}
          >
            <Icon size={17} />
          </div>
          <span className="truncate text-sm font-bold text-slate-900 dark:text-white">
            {entry.label}
          </span>
        </div>
        <span className="neu-pill shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
          Coming soon
        </span>
      </div>
    );
  }

  const roadmap = getRoadmap(entry.id);
  const topicCount = roadmap ? totalTopicCount(roadmap) : 0;

  return (
    <Link
      href={`/career/roadmap/${entry.id}`}
      className="neu-card group relative flex flex-col justify-between rounded-[24px] p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${ROLE_ACCENTS[entry.id] ?? "from-slate-500 to-slate-600"} text-white shadow-sm transition-transform duration-200 group-hover:scale-105`}
          >
            <Icon size={20} />
          </div>
          {isRecommended && (
            <span className="neu-pill rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Recommended
            </span>
          )}
        </div>

        <h4 className="mt-3.5 text-sm font-bold text-slate-950 dark:text-white transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
          {entry.label}
        </h4>

        {roadmap?.tagline && (
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
            {roadmap.tagline}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-200/70 pt-2.5 dark:border-white/10">
        <span className="neu-pill rounded-lg px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
          {topicCount > 0 ? `${topicCount} topics` : "Interactive track"}
        </span>
        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 transition-transform duration-200 group-hover:translate-x-0.5">
          Explore <ChevronRight size={13} />
        </span>
      </div>
    </Link>
  );
}
