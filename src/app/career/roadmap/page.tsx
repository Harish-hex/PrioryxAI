"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  Bot,
  CheckCircle2,
  ChevronDown,
  Circle,
  Code2,
  ExternalLink,
  HelpCircle,
  Play,
  Sparkles,
} from "lucide-react";
import {
  CATALOG,
  isCurated,
  listRoadmaps,
  totalTopicCount,
  type RoadmapCatalogEntry,
  type RoadmapDefinition,
  type RoadmapTopic,
} from "@/lib/roadmaps/data";

const ROLE_ICONS: Record<string, any> = {
  "ai-engineer": Bot,
  frontend: Code2,
  backend: Code2,
  python: Code2,
  sql: Code2,
};

const ROLE_ACCENTS: Record<string, string> = {
  "ai-engineer": "from-violet-500 to-purple-600",
  frontend: "from-cyan-500 to-blue-600",
  backend: "from-emerald-500 to-teal-600",
  python: "from-amber-500 to-orange-600",
  sql: "from-sky-500 to-indigo-600",
};

const CATEGORY_LABELS: Record<string, string> = {
  role: "Role Based Roadmaps",
  skill: "Skill Based Roadmaps",
  beginner: "Absolute Beginners",
  practice: "Best Practices",
};

export default function RoadmapPage() {
  const roadmaps = listRoadmaps();

  const [userStream, setUserStream] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(true);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        const stream = data?.profile?.stream as string | undefined;
        if (stream && CATALOG.some((c) => c.id === stream)) {
          setUserStream(stream);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedStream) return;
    fetch(`/api/roadmap/progress?stream=${selectedStream}`)
      .then((r) => r.json())
      .then((data) => {
        const ids = (data?.completed ?? []).map((c: { topic_id: string }) => c.topic_id);
        setCompletedIds(new Set(ids));
      })
      .catch(() => setCompletedIds(new Set()));
  }, [selectedStream]);

  function chooseStream(id: string) {
    setSelectedStream(id);
    setShowPicker(false);
    setExpandedTopic(null);
  }

  async function toggleComplete(topicId: string) {
    if (!selectedStream) return;
    const willBeCompleted = !completedIds.has(topicId);
    setCompletedIds((prev) => {
      const next = new Set(Array.from(prev));
      if (willBeCompleted) next.add(topicId);
      else next.delete(topicId);
      return next;
    });
    try {
      await fetch("/api/roadmap/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stream: selectedStream, topicId, completed: willBeCompleted }),
      });
    } catch {}
  }

  const roadmap: RoadmapDefinition | undefined = roadmaps.find((r) => r.id === selectedStream);
  const total = roadmap ? totalTopicCount(roadmap) : 0;
  const doneCount = useMemo(() => {
    if (!roadmap) return 0;
    return roadmap.sections.reduce(
      (sum, s) => sum + s.topics.filter((t) => completedIds.has(t.id)).length,
      0
    );
  }, [roadmap, completedIds]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
          Career Roadmap
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
          A guided, step-by-step path — pick your role and follow the map from first principles to production.
        </p>
      </div>

      {(showPicker || !roadmap) && !loadingProfile && (
        <CatalogPicker userStream={userStream} onChoose={chooseStream} />
      )}

      {loadingProfile && (
        <div className="neu-card rounded-[28px] p-8 text-center text-sm text-slate-600 dark:text-slate-400">
          Loading your roadmap…
        </div>
      )}

      {roadmap && !showPicker && (
        <div>
          {/* Header bar with progress + change path */}
          <div className="neu-card mb-8 flex flex-col gap-4 rounded-[28px] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${ROLE_ACCENTS[roadmap.id] ?? "from-slate-500 to-slate-600"} text-white shadow-sm`}
              >
                {(() => {
                  const Icon = ROLE_ICONS[roadmap.id] ?? HelpCircle;
                  return <Icon size={20} />;
                })()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">{roadmap.label}</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">{roadmap.tagline}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="neu-pill flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-slate-950 dark:text-white">
                {total > 0 && doneCount === total ? (
                  <>
                    <Sparkles size={14} className="text-emerald-500" />
                    <span>Roadmap complete!</span>
                  </>
                ) : (
                  <>
                    <span className="text-emerald-600 dark:text-emerald-400">{doneCount}</span>
                    <span>/ {total} done</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="neu-btn rounded-2xl px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Change path
              </button>
            </div>
          </div>

          {/* Hero "start here" resources */}
          {(roadmap.heroVideoUrl || roadmap.heroCertUrl) && (
            <div className="mb-8 grid gap-3 sm:grid-cols-2">
              {roadmap.heroVideoUrl && (
                <Link
                  href={roadmap.heroVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neu-card flex items-start gap-3 rounded-[22px] p-4 transition hover:-translate-y-0.5"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                    <Play size={16} className="fill-current" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-500">Best video to start</p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-slate-950 dark:text-white">
                      {roadmap.heroVideoLabel ?? "Watch now"}
                    </p>
                  </div>
                </Link>
              )}
              {roadmap.heroCertUrl && (
                <Link
                  href={roadmap.heroCertUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neu-card flex items-start gap-3 rounded-[22px] p-4 transition hover:-translate-y-0.5"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Award size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-500">Best certification</p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-slate-950 dark:text-white">
                      {roadmap.heroCertLabel ?? "View certification"}
                    </p>
                  </div>
                </Link>
              )}
            </div>
          )}

          {/* Status legend */}
          <div className="mb-6 flex items-center gap-5 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Circle size={12} className="text-slate-400 dark:text-slate-500" /> To learn
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-emerald-500" /> Done
            </span>
          </div>

          {/* Visual tree */}
          <RoadmapTree
            roadmap={roadmap}
            completedIds={completedIds}
            expandedTopic={expandedTopic}
            onExpand={setExpandedTopic}
            onToggleComplete={toggleComplete}
          />
        </div>
      )}
    </div>
  );
}

function CatalogPicker({
  userStream,
  onChoose,
}: {
  userStream: string | null;
  onChoose: (id: string) => void;
}) {
  const categories: Array<"role" | "skill" | "beginner" | "practice"> = ["role", "skill", "beginner", "practice"];

  return (
    <div>
      <h2 className="mb-1 text-lg font-bold text-slate-950 dark:text-white">
        What are you learning?
      </h2>
      <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
        Pick a track. Curated tracks open a full visual roadmap in-app with videos, certifications, and progress
        tracking — everything else opens the matching roadmap.sh guide in a new tab.
      </p>

      {categories.map((cat) => {
        const entries = [...CATALOG.filter((e) => e.category === cat)].sort((a, b) => {
          if (a.id === userStream) return -1;
          if (b.id === userStream) return 1;
          const aCurated = isCurated(a.id) ? 0 : 1;
          const bCurated = isCurated(b.id) ? 0 : 1;
          return aCurated - bCurated;
        });
        if (entries.length === 0) return null;

        return (
          <div key={cat} className="mb-8">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              {CATEGORY_LABELS[cat]}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry) => (
                <CatalogCard key={entry.id} entry={entry} isRecommended={entry.id === userStream} onChoose={onChoose} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CatalogCard({
  entry,
  isRecommended,
  onChoose,
}: {
  entry: RoadmapCatalogEntry;
  isRecommended: boolean;
  onChoose: (id: string) => void;
}) {
  const curated = isCurated(entry.id);
  const Icon = ROLE_ICONS[entry.id] ?? HelpCircle;

  if (!curated) {
    return (
      <div
        title="This roadmap is being built — check back soon"
        className="neu-inset relative flex w-full items-center justify-between gap-2 rounded-2xl px-4 py-3.5 opacity-80"
      >
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{entry.label}</span>
        <span className="shrink-0 text-[11px] font-bold text-amber-600 dark:text-amber-400">Coming soon</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onChoose(entry.id)}
      className="neu-card group relative rounded-[28px] p-5 text-left transition hover:-translate-y-0.5"
    >
      {isRecommended && (
        <span className="absolute right-4 top-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
          Recommended
        </span>
      )}
      <div
        className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${ROLE_ACCENTS[entry.id] ?? "from-slate-500 to-slate-600"} text-white shadow-sm`}
      >
        <Icon size={20} />
      </div>
      <h3 className="text-sm font-bold text-slate-950 dark:text-white">{entry.label}</h3>
      <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">In-app roadmap</p>
    </button>
  );
}

function RoadmapTree({
  roadmap,
  completedIds,
  expandedTopic,
  onExpand,
  onToggleComplete,
}: {
  roadmap: RoadmapDefinition;
  completedIds: Set<string>;
  expandedTopic: string | null;
  onExpand: (id: string | null) => void;
  onToggleComplete: (id: string) => void;
}) {
  return (
    <div className="relative">
      {/* Center spine */}
      <div className="absolute bottom-0 left-5 top-2 w-px bg-slate-300 dark:bg-white/15 sm:left-1/2" />

      <div className="space-y-10">
        {roadmap.sections.map((section, sIdx) => {
          const sectionDone = section.topics.every((t) => completedIds.has(t.id));
          return (
            <div key={section.id}>
              {/* Section milestone node */}
              <div className="relative z-10 flex items-center gap-3 sm:justify-center">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black ${
                    sectionDone
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "neu-card border-slate-300 text-slate-950 dark:border-white/20 dark:text-white"
                  }`}
                >
                  {sectionDone ? <CheckCircle2 size={18} /> : sIdx + 1}
                </div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white sm:absolute sm:left-1/2 sm:ml-6">
                  {section.title}
                </h3>
              </div>

              {/* Topic nodes — alternate sides on desktop, stacked on mobile */}
              <div className="mt-4 space-y-3 pl-[52px] sm:space-y-4 sm:pl-0">
                {section.topics.map((topic, tIdx) => {
                  const isDone = completedIds.has(topic.id);
                  const isExpanded = expandedTopic === topic.id;
                  const alignRight = tIdx % 2 === 1;

                  return (
                    <div key={topic.id} className="relative sm:grid sm:grid-cols-2 sm:gap-x-10">
                      {/* Connector: spine -> node, desktop only */}
                      <div
                        className={`hidden sm:block absolute top-1/2 h-px w-10 bg-slate-300 dark:bg-white/15 ${
                          alignRight ? "left-1/2" : "right-1/2"
                        }`}
                      />
                      <div className={alignRight ? "sm:col-start-2 sm:pl-10" : "sm:col-start-1 sm:flex sm:justify-end sm:pr-10"}>
                        <TopicNode
                          topic={topic}
                          isDone={isDone}
                          isExpanded={isExpanded}
                          onExpand={() => onExpand(isExpanded ? null : topic.id)}
                          onToggleComplete={() => onToggleComplete(topic.id)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopicNode({
  topic,
  isDone,
  isExpanded,
  onExpand,
  onToggleComplete,
}: {
  topic: RoadmapTopic;
  isDone: boolean;
  isExpanded: boolean;
  onExpand: () => void;
  onToggleComplete: () => void;
}) {
  return (
    <div className="w-full max-w-md">
      <button
        type="button"
        onClick={onExpand}
        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
          isDone
            ? "border border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
            : "neu-card"
        }`}
      >
        {isDone ? (
          <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
        ) : (
          <Circle size={18} className="shrink-0 text-slate-400 dark:text-slate-500" />
        )}
        <span
          className={`flex-1 text-sm font-semibold ${
            isDone ? "text-emerald-700 dark:text-emerald-300" : "text-slate-950 dark:text-white"
          }`}
        >
          {topic.title}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-500 dark:text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {isExpanded && (
        <div className="neu-inset mt-2 rounded-2xl p-4">
          <p className="text-sm text-slate-700 dark:text-slate-300">{topic.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {topic.videoUrl && (
              <Link
                href={topic.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
              >
                <Play size={12} className="fill-current" /> Watch <ExternalLink size={10} className="opacity-60" />
              </Link>
            )}
            {topic.certUrl && (
              <Link
                href={topic.certUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="neu-pill inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <Award size={12} /> {topic.certLabel ?? "Certification"} <ExternalLink size={10} className="opacity-60" />
              </Link>
            )}
          </div>
          <button
            type="button"
            onClick={onToggleComplete}
            className={`mt-3 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
              isDone
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "neu-btn text-slate-700 dark:text-slate-300"
            }`}
          >
            {isDone ? <CheckCircle2 size={14} /> : <Circle size={14} />}
            {isDone ? "Completed — click to undo" : "Mark complete"}
          </button>
        </div>
      )}
    </div>
  );
}
