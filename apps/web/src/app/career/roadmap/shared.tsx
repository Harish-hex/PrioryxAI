"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Apple,
  Atom,
  Award,
  BarChart3,
  Binary,
  Blocks,
  BookOpen,
  Bot,
  Box,
  Boxes,
  Building2,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Circle,
  Cloud,
  CloudLightning,
  Code,
  Code2,
  Coffee,
  Cog,
  Cpu,
  Crosshair,
  Database,
  ExternalLink,
  Feather,
  FileCode,
  FileCode2,
  Flame,
  Gamepad,
  Gamepad2,
  Gauge,
  Gem,
  GitBranch,
  GitPullRequest,
  Globe,
  HelpCircle,
  Infinity,
  Layers,
  Layout,
  LineChart,
  Lock,
  Megaphone,
  Network,
  Palette,
  PieChart,
  Play,
  Rocket,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Ship,
  Smartphone,
  Sparkles,
  Target,
  Terminal,
  Train,
  Trophy,
  Users,
  Webhook,
  Workflow,
  Zap,
} from "lucide-react";
import { getRoadmap, totalTopicCount, type RoadmapDefinition, type RoadmapTopic } from "@/lib/roadmaps/data";

export function AndroidLogo({ size = 20, className = "" }: { size?: number | string; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v6c0 .83.67 1.5 1.5 1.5S5 16.33 5 15.5v-6C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v6c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-6c0-.83-.67-1.5-1.5-1.5zm-4.97-4.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.72 2.24 12.88 2 12 2c-.88 0-1.72.24-2.64.63L7.88.75c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.3 1.3C6.73 3.93 5.5 5.81 5.5 8h13c0-2.19-1.23-4.07-2.97-5.16zM9 6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
    </svg>
  );
}

export function PostgresLogo({ size = 20, className = "" }: { size?: number | string; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.07 2.05c-3.13 0-5.7 1.83-6.68 4.43-.59.18-1.12.52-1.52.98-.67.78-.92 1.84-.71 2.89.2.98.81 1.82 1.66 2.31v1.17c0 2.21 1.79 4 4 4h.24c.48 1.81 2.11 3.17 4.07 3.17 1.61 0 3.01-.91 3.73-2.25.75-.12 1.44-.45 1.99-.95.84-.77 1.25-1.87 1.13-2.99-.1-1-.69-1.87-1.58-2.36.03-.23.05-.46.05-.7 0-3.17-2.61-5.74-5.83-5.74h-.55v.04zm-.55 2.04h.55c2.1 0 3.8 1.67 3.8 3.7 0 .28-.04.56-.1.83-.8.25-1.47.8-1.85 1.54-.42.82-.47 1.76-.14 2.62.29.74.83 1.34 1.51 1.7-.1.49-.36.92-.75 1.22-.38.3-.86.46-1.35.46-.22 0-.44-.04-.65-.11-.47-.16-.86-.49-1.08-.94-.36-.71-.35-1.56.03-2.26.43-.8 1.23-1.33 2.13-1.42v-1.02c0-.55-.45-1-1-1s-1 .45-1 1v1.07c-1.14.34-2.03 1.23-2.34 2.4-.33 1.24.06 2.53.98 3.39-.77.16-1.57-.1-2.07-.69-.51-.6-.62-1.42-.3-2.12.24-.52.68-.92 1.22-1.13v-2.02c-1.11-.23-1.99-1.06-2.29-2.16-.31-1.15.11-2.35 1.04-3.1.48-.39 1.07-.59 1.68-.59h.03c.51-1.15 1.64-1.92 2.98-1.92v.04z" />
    </svg>
  );
}

export function PythonLogo({ size = 20, className = "" }: { size?: number | string; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M11.91 2c-5.08 0-4.76 2.2-4.76 2.2l.01 2.28h4.84v.69H5.16S2 6.8 2 11.92c0 5.11 2.76 4.93 2.76 4.93h1.65v-2.32s-.09-2.76 2.72-2.76h4.69s2.63.04 2.63-2.62V4.62S16.99 2 11.91 2zm-2.6 1.45a.98.98 0 1 1 0 1.96.98.98 0 0 1 0-1.96zM12.09 22c5.08 0 4.76-2.2 4.76-2.2l-.01-2.28h-4.84v-.69h6.84S22 17.2 22 12.08c0-5.11-2.76-4.93-2.76-4.93h-1.65v2.32s.09 2.76-2.72 2.76h-4.69s-2.63-.04-2.63 2.62v4.53S7.01 22 12.09 22zm2.6-1.45a.98.98 0 1 1 0-1.96.98.98 0 0 1 0 1.96z" />
    </svg>
  );
}

export const ROLE_ICONS: Record<string, any> = {
  // Role-based Roadmaps
  frontend: Layout,
  backend: Server,
  "full-stack": Layers,
  android: AndroidLogo,
  devops: Infinity,
  devsecops: ShieldCheck,
  "data-analyst": BarChart3,
  "ai-engineer": Bot,
  "ai-data-scientist": Sparkles,
  "data-engineer": Database,
  "machine-learning": Cpu,
  "postgresql-dba": PostgresLogo,
  ios: Apple,
  blockchain: Blocks,
  qa: CheckCheck,
  "software-architect": Building2,
  "api-design": Webhook,
  "cyber-security": ShieldAlert,
  "ux-design": Palette,
  "technical-writer": BookOpen,
  "game-developer": Gamepad2,
  "server-side-game-developer": Gamepad,
  mlops: Workflow,
  "product-manager": Target,
  "engineering-manager": Users,
  devrel: Megaphone,
  "bi-analyst": PieChart,
  "ai-red-teaming": Crosshair,
  "network-engineer": Network,
  "forward-deployed-engineer": Rocket,

  // Skill-based Roadmaps
  "claude-code": Sparkles,
  "python-data-analysis": LineChart,
  "r-programming": Binary,
  "vibe-coding": Sparkles,
  "power-bi": BarChart3,
  leetcode: Trophy,
  python: PythonLogo,
  "computer-science": Binary,
  sql: Database,
  openclaw: Terminal,
  react: Atom,
  vue: Layers,
  angular: Shield,
  javascript: FileCode2,
  typescript: FileCode,
  nodejs: Server,
  "system-design": Network,
  java: Coffee,
  "aspnet-core": Globe,
  "spring-boot": Zap,
  flutter: Feather,
  "c-programming": Terminal,
  cpp: Cpu,
  rust: Cog,
  golang: Zap,
  "ai-product-builders": Sparkles,
  "software-design-architecture": Building2,
  "react-native": Atom,
  "design-system": Palette,
  "prompt-engineering": Sparkles,
  mongodb: Database,
  linux: Terminal,
  kubernetes: Ship,
  docker: Box,
  aws: Cloud,
  terraform: Boxes,
  "datastructures-and-algorithms": Binary,
  redis: Zap,
  "git-github": GitBranch,
  php: Globe,
  cloudflare: CloudLightning,
  "ai-agents": Bot,
  nextjs: Globe,
  kotlin: Code2,
  html: Code,
  css: Palette,
  "swift-ui": Smartphone,
  "shell-bash": Terminal,
  laravel: Box,
  elasticsearch: Search,
  wordpress: Globe,
  django: Server,
  ruby: Gem,
  "ruby-on-rails": Train,
  scala: Flame,

  // Absolute Beginners
  "frontend-beginner": Layout,
  "backend-beginner": Server,
  "devops-beginner": Infinity,
  "git-github-beginner": GitBranch,

  // Best Practices
  "aws-best-practices": Cloud,
  "api-security-best-practices": ShieldCheck,
  "backend-performance-best-practices": Zap,
  "frontend-performance-best-practices": Gauge,
  "code-review-best-practices": GitPullRequest,
};

export const ROLE_ACCENTS: Record<string, string> = {
  // Role-based Roadmaps
  frontend: "from-cyan-500 to-blue-600",
  backend: "from-emerald-500 to-teal-700",
  "full-stack": "from-indigo-500 to-purple-600",
  android: "from-emerald-500 to-green-600",
  devops: "from-blue-600 to-indigo-600",
  devsecops: "from-rose-500 to-indigo-600",
  "data-analyst": "from-amber-500 to-orange-600",
  "ai-engineer": "from-violet-500 to-purple-600",
  "ai-data-scientist": "from-fuchsia-500 to-pink-600",
  "data-engineer": "from-cyan-600 to-teal-700",
  "machine-learning": "from-purple-600 to-indigo-700",
  "postgresql-dba": "from-sky-600 to-blue-800",
  ios: "from-slate-700 to-zinc-900",
  blockchain: "from-amber-500 to-yellow-600",
  qa: "from-teal-500 to-emerald-600",
  "software-architect": "from-blue-600 to-slate-800",
  "api-design": "from-orange-500 to-red-600",
  "cyber-security": "from-red-600 to-rose-700",
  "ux-design": "from-pink-500 to-rose-500",
  "technical-writer": "from-emerald-600 to-teal-700",
  "game-developer": "from-violet-600 to-purple-800",
  "server-side-game-developer": "from-indigo-600 to-slate-800",
  mlops: "from-fuchsia-600 to-purple-800",
  "product-manager": "from-blue-500 to-indigo-600",
  "engineering-manager": "from-amber-600 to-orange-700",
  devrel: "from-rose-500 to-pink-600",
  "bi-analyst": "from-blue-600 to-cyan-600",
  "ai-red-teaming": "from-red-600 to-rose-900",
  "network-engineer": "from-sky-500 to-blue-600",
  "forward-deployed-engineer": "from-violet-600 to-blue-600",

  // Skill-based Roadmaps
  "claude-code": "from-amber-500 to-orange-600",
  "python-data-analysis": "from-blue-500 to-amber-600",
  "r-programming": "from-blue-600 to-sky-700",
  "vibe-coding": "from-fuchsia-500 to-pink-600",
  "power-bi": "from-yellow-500 to-amber-600",
  leetcode: "from-amber-500 to-yellow-600",
  python: "from-blue-500 to-amber-500",
  "computer-science": "from-slate-600 to-indigo-700",
  sql: "from-sky-500 to-indigo-600",
  openclaw: "from-slate-600 to-slate-800",
  react: "from-cyan-400 to-blue-600",
  vue: "from-emerald-500 to-teal-600",
  angular: "from-red-500 to-rose-700",
  javascript: "from-amber-400 to-yellow-500",
  typescript: "from-blue-500 to-blue-700",
  nodejs: "from-green-600 to-emerald-700",
  "system-design": "from-indigo-600 to-purple-600",
  java: "from-red-500 to-orange-600",
  "aspnet-core": "from-purple-600 to-indigo-700",
  "spring-boot": "from-emerald-500 to-green-600",
  flutter: "from-sky-400 to-blue-600",
  "c-programming": "from-slate-600 to-slate-800",
  cpp: "from-blue-600 to-indigo-700",
  rust: "from-orange-600 to-amber-700",
  golang: "from-cyan-500 to-teal-600",
  "ai-product-builders": "from-violet-500 to-purple-600",
  "software-design-architecture": "from-blue-600 to-indigo-700",
  "react-native": "from-cyan-500 to-blue-600",
  "design-system": "from-pink-500 to-violet-600",
  "prompt-engineering": "from-purple-500 to-violet-600",
  mongodb: "from-green-500 to-emerald-700",
  linux: "from-amber-500 to-yellow-600",
  kubernetes: "from-blue-600 to-indigo-700",
  docker: "from-blue-500 to-sky-600",
  aws: "from-amber-500 to-orange-600",
  terraform: "from-purple-600 to-indigo-600",
  "datastructures-and-algorithms": "from-emerald-500 to-teal-600",
  redis: "from-red-500 to-rose-700",
  "git-github": "from-orange-500 to-red-600",
  php: "from-indigo-400 to-blue-600",
  cloudflare: "from-orange-500 to-amber-600",
  "ai-agents": "from-violet-500 to-fuchsia-600",
  nextjs: "from-slate-800 to-black",
  kotlin: "from-purple-500 to-orange-500",
  html: "from-orange-500 to-red-500",
  css: "from-blue-500 to-cyan-500",
  "swift-ui": "from-orange-500 to-amber-600",
  "shell-bash": "from-slate-700 to-slate-900",
  laravel: "from-red-500 to-rose-600",
  elasticsearch: "from-yellow-500 to-teal-600",
  wordpress: "from-sky-600 to-blue-700",
  django: "from-emerald-700 to-teal-800",
  ruby: "from-red-600 to-rose-700",
  "ruby-on-rails": "from-red-600 to-rose-800",
  scala: "from-red-500 to-rose-600",

  // Absolute Beginners
  "frontend-beginner": "from-cyan-400 to-blue-500",
  "backend-beginner": "from-emerald-400 to-teal-600",
  "devops-beginner": "from-blue-500 to-indigo-600",
  "git-github-beginner": "from-orange-400 to-red-500",

  // Best Practices
  "aws-best-practices": "from-amber-500 to-orange-600",
  "api-security-best-practices": "from-rose-500 to-red-600",
  "backend-performance-best-practices": "from-emerald-500 to-teal-600",
  "frontend-performance-best-practices": "from-cyan-500 to-blue-600",
  "code-review-best-practices": "from-purple-500 to-indigo-600",
};

export const CATEGORY_LABELS: Record<string, string> = {
  role: "Role Based Roadmaps",
  skill: "Skill Based Roadmaps",
  beginner: "Absolute Beginners",
  practice: "Best Practices",
};

export function RoadmapDetailView({ roadmapId }: { roadmapId: string }) {
  const roadmap = getRoadmap(roadmapId);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    fetch(`/api/roadmap/progress?stream=${roadmapId}`)
      .then((r) => r.json())
      .then((data) => {
        const ids = (data?.completed ?? []).map((c: { topic_id: string }) => c.topic_id);
        setCompletedIds(new Set(ids));
      })
      .catch(() => setCompletedIds(new Set()));
  }, [roadmapId]);

  useEffect(() => {
    fetch(`/api/user/status`)
      .then((r) => r.json())
      .then((data) => {
        const active = Boolean(data?.pro_status) && (!data?.pro_expires_at || new Date(data.pro_expires_at) > new Date());
        setIsPro(active);
      })
      .catch(() => setIsPro(false));
  }, []);

  async function toggleComplete(topicId: string) {
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
        body: JSON.stringify({ stream: roadmapId, topicId, completed: willBeCompleted }),
      });
    } catch {}
  }

  const total = roadmap ? totalTopicCount(roadmap) : 0;
  const doneCount = useMemo(() => {
    if (!roadmap) return 0;
    return roadmap.sections.reduce(
      (sum, s) => sum + s.topics.filter((t) => completedIds.has(t.id)).length,
      0
    );
  }, [roadmap, completedIds]);

  if (!roadmap) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <div className="neu-card rounded-[28px] p-8 text-center">
          <p className="text-sm font-semibold text-slate-950 dark:text-white">This roadmap isn't available yet.</p>
          <Link href="/career/roadmap" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-600 dark:text-cyan-400">
            <ChevronLeft size={14} /> Back to all roadmaps
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link
          href="/career/roadmap"
          className="neu-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-slate-800 hover:text-cyan-600 dark:text-slate-200 dark:hover:text-cyan-400 transition-all hover:neu-raised-sm"
        >
          <ChevronLeft size={15} /> All roadmaps
        </Link>
      </div>

      {/* Header bar with progress */}
      <div className="neu-card mb-8 flex flex-col gap-4 rounded-[28px] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${ROLE_ACCENTS[roadmap.id] ?? "from-slate-500 to-slate-600"} text-white shadow-md shadow-cyan-500/20`}
          >
            {(() => {
              const Icon = ROLE_ICONS[roadmap.id] ?? HelpCircle;
              return <Icon size={26} />;
            })()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">{roadmap.label}</h1>
              <span className="neu-pill rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                Interactive
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">{roadmap.tagline}</p>
          </div>
        </div>

        {/* Completed Progress Bar Pill */}
        <div className="neu-pill flex items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-950 dark:text-white">
          {total > 0 && doneCount === total ? (
            <>
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm shadow-emerald-500/40">
                <CheckCircle2 size={14} className="stroke-[2.5]" />
              </div>
              <span className="text-emerald-700 dark:text-emerald-400 font-black">All {total} Completed!</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{doneCount}</span>
                <span className="text-slate-500 dark:text-slate-400 font-semibold">/ {total} done</span>
              </div>
              <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10 neu-inset">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${total > 0 ? (doneCount / total) * 100 : 0}%` }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hero "start here" resources */}
      {(roadmap.heroVideoUrl || roadmap.heroCertUrl) && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          {/* Neumorphic Red Video Card */}
          {roadmap.heroVideoUrl && (
            <Link
              href={roadmap.heroVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="neu-card group flex items-start gap-4 rounded-[26px] p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl border-2 border-red-500/30 dark:border-red-500/30"
            >
              <div className="neu-pill flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/35 transition-transform duration-200 group-hover:scale-105">
                <Play size={20} className="fill-current ml-0.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="neu-pill rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 border border-red-500/30">
                    Video Guide
                  </span>
                </div>
                <p className="mt-1.5 truncate text-base font-black text-slate-950 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                  {roadmap.heroVideoLabel ?? "Watch full course"}
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                  Best video tutorial to start this roadmap
                </p>
              </div>
              <div className="neu-pill flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-red-500 dark:text-red-400 transition-transform group-hover:translate-x-0.5">
                <ExternalLink size={14} />
              </div>
            </Link>
          )}

          {roadmap.heroCertUrl && (
            <Link
              href={roadmap.heroCertUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="neu-card group flex items-start gap-4 rounded-[26px] p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl border-2 border-amber-500/30 dark:border-amber-500/30"
            >
              <div className="neu-pill flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white shadow-lg shadow-amber-500/35 transition-transform duration-200 group-hover:scale-105">
                <Award size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="neu-pill rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Certification
                  </span>
                </div>
                <p className="mt-1.5 truncate text-base font-black text-slate-950 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {roadmap.heroCertLabel ?? "View certification"}
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                  Earn proof of mastery for your resume
                </p>
              </div>
              <div className="neu-pill flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-amber-500 dark:text-amber-400 transition-transform group-hover:translate-x-0.5">
                <ExternalLink size={14} />
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Visual tree */}
      <RoadmapTree
        roadmap={roadmap}
        completedIds={completedIds}
        expandedTopic={expandedTopic}
        onExpand={setExpandedTopic}
        onToggleComplete={toggleComplete}
        isPro={isPro}
      />
    </div>
  );
}

function RoadmapTree({
  roadmap,
  completedIds,
  expandedTopic,
  onExpand,
  onToggleComplete,
  isPro,
}: {
  roadmap: RoadmapDefinition;
  completedIds: Set<string>;
  expandedTopic: string | null;
  onExpand: (id: string | null) => void;
  onToggleComplete: (id: string) => void;
  isPro: boolean;
}) {
  // Flatten every topic across all sections into one running order so the
  // "first 4 topics free" rule applies to the roadmap as a whole, not per section.
  const topicGlobalIndex = new Map<string, number>();
  let topicCounter = 0;
  for (const section of roadmap.sections) {
    for (const topic of section.topics) {
      topicGlobalIndex.set(topic.id, topicCounter++);
    }
  }
  const FREE_TOPIC_LIMIT = 4;

  return (
    <div className="relative">
      <div className="absolute bottom-0 left-5 top-2 w-px bg-slate-300 dark:bg-white/15 sm:left-1/2" />

      <div className="space-y-12">
        {roadmap.sections.map((section, sIdx) => {
          const sectionDone = section.topics.every((t) => completedIds.has(t.id));
          return (
            <div key={section.id}>
              <div className="relative z-10 flex items-center gap-3 sm:justify-center">
                {/* Section Step Circle — Neumorphic with high-contrast emerald when completed */}
                <div
                  className={`neu-card flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black transition-all ${
                    sectionDone
                      ? "border-2 border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/40"
                      : "text-slate-950 dark:text-white"
                  }`}
                >
                  {sectionDone ? <CheckCircle2 size={20} className="stroke-[2.5]" /> : sIdx + 1}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:absolute sm:left-1/2 sm:ml-6">
                  <h3 className="text-base font-black text-slate-950 dark:text-white">{section.title}</h3>
                  {sectionDone && (
                    <span className="neu-pill inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 size={11} className="stroke-[2.5]" /> Section Complete
                    </span>
                  )}
                  {/* Neumorphic Red Video Button for section */}
                  {section.videoUrl && (
                    <Link
                      href={section.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="neu-pill group inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-red-600 dark:text-red-400 border border-red-500/30 hover:neu-raised-sm hover:scale-105 transition-all"
                      title="Best video for this topic"
                    >
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white shadow-sm shadow-red-500/30">
                        <Play size={8} className="fill-current ml-0.5" />
                      </div>
                      <span>Video Guide</span>
                    </Link>
                  )}
                  {section.certUrl && (
                    <Link
                      href={section.certUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="neu-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:neu-raised-sm hover:scale-105 transition-all"
                      title={section.certLabel ?? "Certification"}
                    >
                      <Award size={10} />
                      <span>Cert</span>
                    </Link>
                  )}
                </div>
              </div>

              <div className="mt-5 space-y-3 pl-[52px] sm:space-y-4 sm:pl-0">
                {section.topics.map((topic, tIdx) => {
                  const isDone = completedIds.has(topic.id);
                  const isExpanded = expandedTopic === topic.id;
                  const alignRight = tIdx % 2 === 1;
                  const topicLocked = !isPro && (topicGlobalIndex.get(topic.id) ?? 0) >= FREE_TOPIC_LIMIT;

                  return (
                    <div key={topic.id} className="relative sm:grid sm:grid-cols-2 sm:gap-x-10">
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
                          isPro={isPro}
                          locked={topicLocked}
                          roadmapId={roadmap.id}
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
  isPro,
  locked = false,
  roadmapId,
}: {
  topic: RoadmapTopic;
  isDone: boolean;
  isExpanded: boolean;
  onExpand: () => void;
  onToggleComplete: () => void;
  isPro: boolean;
  locked?: boolean;
  roadmapId: string;
}) {
  const [starting, setStarting] = useState(false);
  const [started, setStarted] = useState(false);

  async function handleStart() {
    if (starting || started) return;
    setStarting(true);
    try {
      const res = await fetch("/api/roadmap/start-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roadmapId, topicId: topic.id, title: topic.title }),
      });
      if (res.ok) setStarted(true);
    } catch {}
    setStarting(false);
  }
  return (
    <div className="w-full max-w-md">
      {/* Neumorphic Topic Card — Always neu-card, with distinct high-contrast styling when completed */}
      <button
        type="button"
        onClick={onExpand}
        className={`neu-card group flex w-full items-center gap-3.5 rounded-[22px] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
          isDone
            ? "border-2 border-emerald-500/60 dark:border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.2)] bg-emerald-50/40 dark:bg-emerald-950/20"
            : ""
        }`}
      >
        {isDone ? (
          <div className="neu-pill flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/40">
            <CheckCircle2 size={18} className="stroke-[2.5]" />
          </div>
        ) : locked ? (
          <div className="neu-pill flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-md shadow-amber-500/30">
            <Lock size={15} />
          </div>
        ) : (
          <div className="neu-pill flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500">
            <Circle size={16} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-sm font-bold transition-colors ${
                isDone
                  ? "text-slate-950 dark:text-white font-black"
                  : "text-slate-950 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400"
              }`}
            >
              {topic.title}
            </span>
            {isDone && (
              <span className="neu-pill shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 bg-emerald-500/10">
                <CheckCircle2 size={11} className="stroke-[2.5]" /> Completed
              </span>
            )}
            {!isDone && locked && (
              <span className="neu-pill shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <Lock size={10} /> Pro
              </span>
            )}
          </div>
        </div>

        <div className="neu-pill flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300">
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Expanded Topic Details */}
      {isExpanded && (
        <div className="neu-inset mt-2.5 rounded-[22px] p-5">
          <p className="text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">{topic.description}</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {locked ? (
              <Link
                href="/pricing"
                className="neu-pill group inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:neu-raised-sm hover:-translate-y-0.5 transition-all"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-sm shadow-amber-500/30">
                  <Lock size={10} />
                </div>
                <span>Unlock video + certification with Pro</span>
              </Link>
            ) : (
              <>
                {/* Neumorphic Red Video Button */}
                {topic.videoUrl ? (
                  <Link
                    href={topic.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neu-pill group inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 border border-red-500/30 hover:neu-raised-sm hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-red-500 text-white shadow-sm shadow-red-500/30">
                      <Play size={10} className="fill-current ml-0.5" />
                    </div>
                    <span>Watch Tutorial</span>
                    <ExternalLink size={11} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ) : (
                  <span className="neu-pill inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 opacity-75">
                    Video coming soon
                  </span>
                )}

                {topic.certUrl && (
                  <Link
                    href={topic.certUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neu-pill group inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:neu-raised-sm hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm shadow-amber-500/30">
                      <Award size={10} />
                    </div>
                    <span>{topic.certLabel ?? "Certification"}</span>
                    <ExternalLink size={11} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Neumorphic Complete Toggle Button + Start-in-Task */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onToggleComplete}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
                isDone
                  ? "neu-btn-pressed bg-emerald-600 text-white border border-emerald-400 shadow-md shadow-emerald-500/30 hover:bg-emerald-700"
                  : "neu-btn text-slate-800 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white"
              }`}
            >
              {isDone ? (
                <>
                  <CheckCircle2 size={15} className="stroke-[2.5]" />
                  <span>Completed (Click to undo)</span>
                </>
              ) : (
                <>
                  <Circle size={15} />
                  <span>Mark as completed</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleStart}
              disabled={starting || started}
              title="Adds this topic to your daily Task list"
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
                started
                  ? "neu-pill text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                  : "neu-btn text-cyan-700 hover:text-cyan-900 dark:text-cyan-400 dark:hover:text-cyan-300"
              }`}
            >
              {started ? (
                <>
                  <CheckCircle2 size={15} className="stroke-[2.5]" />
                  <span>Added to Tasks</span>
                </>
              ) : (
                <>
                  <Play size={13} className="fill-current" />
                  <span>{starting ? "Starting…" : "Start"}</span>
                </>
              )}
            </button>
          </div>

          {topic.subtopics && topic.subtopics.length > 0 && (
            <div className="mt-5 space-y-2.5 border-t border-slate-200/70 pt-4 dark:border-white/10">
              {topic.subtopics.map((sub, i) => {
                // If the parent topic is already Pro-locked, every subtopic is
                // locked too. Otherwise the first 2 subtopics are free and the
                // 3rd onward require Pro — title/description stay visible either way.
                const subLocked = locked || (i >= 2 && !isPro);

                if (typeof sub === "string") {
                  return (
                    <div
                      key={i}
                      className="neu-pill flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-200"
                    >
                      <Circle size={10} className="shrink-0 text-slate-400 dark:text-slate-500" />
                      <span className="flex-1">{sub}</span>
                      <span className="neu-pill rounded-full px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        Upcoming
                      </span>
                    </div>
                  );
                }
                return <SubtopicNode key={sub.id} topic={sub} locked={subLocked} />;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SubtopicNode({ topic, locked = false }: { topic: RoadmapTopic; locked?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="neu-card rounded-2xl p-1 transition-all">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left"
      >
        {locked ? (
          <Lock size={11} className="shrink-0 text-amber-500" />
        ) : (
          <Circle size={11} className="shrink-0 text-slate-400 dark:text-slate-500" />
        )}
        <span className="flex-1 text-xs font-bold text-slate-950 dark:text-white">{topic.title}</span>
        <ChevronDown size={12} className={`shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="neu-inset m-1.5 rounded-xl p-3.5">
          <p className="text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-300">{topic.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {locked ? (
              <Link
                href="/settings#billing"
                className="neu-pill group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:neu-raised-sm transition-all"
              >
                <Lock size={11} />
                <span>Unlock video + certification with Pro</span>
              </Link>
            ) : topic.videoUrl ? (
              <Link
                href={topic.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="neu-pill group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 border border-red-500/30 hover:neu-raised-sm transition-all"
              >
                <div className="flex h-4 w-4 items-center justify-center rounded-md bg-red-500 text-white shadow-sm shadow-red-500/30">
                  <Play size={8} className="fill-current ml-0.5" />
                </div>
                <span>Watch Video</span>
                <ExternalLink size={10} className="opacity-70" />
              </Link>
            ) : (
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Video coming soon</span>
            )}
            {!locked && topic.certUrl && (
              <Link
                href={topic.certUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="neu-pill group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:neu-raised-sm transition-all"
              >
                <Award size={10} />
                <span>{topic.certLabel ?? "Certification"}</span>
                <ExternalLink size={10} className="opacity-70" />
              </Link>
            )}
          </div>
          {topic.subtopics && topic.subtopics.length > 0 && (
            <div className="mt-3 space-y-1.5 border-l-2 border-slate-200 pl-3 dark:border-white/10">
              {topic.subtopics.map((sub, i) =>
                typeof sub === "string" ? (
                  <div key={i} className="text-xs text-slate-600 dark:text-slate-400">
                    · {sub}
                  </div>
                ) : (
                  <SubtopicNode key={sub.id} topic={sub} locked={locked} />
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
