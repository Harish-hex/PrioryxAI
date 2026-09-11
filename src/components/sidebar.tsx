"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code2,
  FileText,
  GraduationCap,
  Hammer,
  LayoutDashboard,
  Loader2,
  LogOut,
  Map,
  Settings,
  Swords,
  Trophy,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { GitHubLogo } from "@/components/icons/github-logo";

const primaryNavItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/feed" },
  { id: "assistant", label: "Assistant", icon: Bot, path: "/assistant" },
  { id: "learning", label: "Learning", icon: GraduationCap, path: "/learning" },
];

const careerNavItems = [
  { id: "roadmap", label: "Roadmap", icon: Map, path: "/career/roadmap" },
  { id: "resume", label: "Resume Intelligence", icon: FileText, path: "/career/resume/upload" },
  { id: "foundry", label: "Project Foundry", icon: Hammer, path: "/career/foundry/dashboard" },
  { id: "unified", label: "Unified Profile", icon: Code2, path: "/career/coding/unified" },
  { id: "github", label: "GitHub Intelligence", icon: GitHubLogo, path: "/career/coding/github" },
  { id: "market", label: "Job Market", icon: Briefcase, path: "/career/market/jobs" },
];

const collabNavItems = [
  { id: "collab-friends", label: "Friends & Match", icon: Users, path: "/career/collab/match?tab=friends", tab: "friends" },
  { id: "collab-challenges", label: "Duels & Challenges", icon: Swords, path: "/career/collab/match?tab=challenges", tab: "challenges" },
  { id: "collab-requests", label: "Connect Requests", icon: UserCheck, path: "/career/collab/match?tab=requests", tab: "requests" },
  { id: "collab-leaderboard", label: "XP Leaderboard", icon: Trophy, path: "/career/collab/match?tab=leaderboard", tab: "leaderboard" },
];

const secondaryNavItems = [
  { id: "profile", label: "Profile", icon: UserRound, path: "/profile" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

interface SidebarProps {
  activeView?: string;
  collapsed: boolean;
  isPro: boolean;
  onNavigate: (view: string) => void;
  onOpenPricing: () => void;
  onToggle: () => void;
  /** Warms an in-shell view's JS chunk (assistant/learning/profile/settings) on hover, ahead of the click. */
  onPrefetchView?: (view: string) => void;
}

export function Sidebar({ activeView, collapsed, isPro, onNavigate, onOpenPricing, onToggle, onPrefetchView }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [careerOpen, setCareerOpen] = useState(true);
  const [collabOpen, setCollabOpen] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const [currentTab, setCurrentTab] = useState("friends");
  const isCareerRoute = pathname?.startsWith("/career") && !pathname?.startsWith("/career/collab");
  const isCollabRoute = pathname?.startsWith("/career/collab");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tab = new URLSearchParams(window.location.search).get("tab") || "friends";
      setCurrentTab(tab);
    }
  }, [pathname]);

  // Auto-expand sections if active on their routes
  useEffect(() => {
    if (isCareerRoute) {
      setCareerOpen(true);
    }
    if (isCollabRoute) {
      setCollabOpen(true);
    }
  }, [isCareerRoute, isCollabRoute]);

  // Pre-load all routes in the background so transitions take <0.2s
  useEffect(() => {
    const routesToPrefetch = [
      "/feed",
      "/assistant",
      "/learning",
      "/profile",
      "/settings",
      "/career/resume/upload",
      "/career/resume/swot",
      "/career/resume/builder",
      "/career/foundry/dashboard",
      "/career/coding/unified",
      "/career/coding/github",
      "/career/market/jobs",
      "/career/collab/match?tab=friends",
      "/career/collab/match?tab=challenges",
      "/career/collab/match?tab=leaderboard",
    ];
    routesToPrefetch.forEach((route) => {
      try {
        router.prefetch(route);
      } catch {}
    });
  }, [router]);

  function handleItemClick(id: string, path: string) {
    if (path.startsWith("/career")) {
      router.push(path);
      return;
    }
    onNavigate(id);
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <aside
      className={`fixed bottom-6 left-6 top-6 z-40 hidden flex-col rounded-[32px] neu-card p-4 sm:p-5 transition-[width] duration-300 lg:flex ${
        collapsed ? "w-24" : "w-72"
      }`}
    >
      {/* Brand Header */}
      {!collapsed ? (
        <div className="flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleItemClick("dashboard", "/feed")}
            className="flex min-w-0 items-center gap-3 rounded-2xl p-2 text-left transition hover:opacity-85"
          >
            <img
              src="/logo.png"
              alt="PrioryxAI"
              className="h-10 w-10 shrink-0 object-contain drop-shadow-sm"
            />
            <span className="min-w-0 block">
              <span className="truncate block text-sm font-bold text-slate-950 dark:text-white">PrioryxAI</span>
              <span className="truncate block text-xs font-medium text-slate-500 dark:text-slate-400">Student command OS</span>
            </span>
          </button>

          <button
            type="button"
            onClick={onToggle}
            className="neu-btn rounded-2xl p-2 text-slate-600 transition dark:text-slate-300 flex items-center justify-center shrink-0"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={17} />
          </button>
        </div>
      ) : (
        <div className="flex w-full items-center justify-center shrink-0">
          <button
            type="button"
            onClick={onToggle}
            className="neu-btn h-10 w-10 rounded-2xl flex items-center justify-center text-slate-600 transition dark:text-slate-300 hover:scale-105 active:scale-95"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Navigation list — scrollable */}
      <nav className="mt-6 flex-1 space-y-4 overflow-y-auto pr-1 no-scrollbar">
        {/* Primary Workspace Links: Dashboard, Assistant, Learning */}
        <div className="space-y-1.5">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = !isCareerRoute && !isCollabRoute && (activeView === item.id || pathname === item.path);

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => handleItemClick(item.id, item.path)}
                onMouseEnter={() => onPrefetchView?.(item.id)}
                onFocus={() => onPrefetchView?.(item.id)}
                title={collapsed ? item.label : undefined}
                className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "neu-inset text-slate-950 dark:text-white"
                    : "text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:translate-x-0.5"
                }`}
              >
                <Icon className={`relative z-10 shrink-0 ${active ? "text-slate-950 dark:text-cyan-400 stroke-[2.2]" : ""}`} size={18} />
                {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
                {active && !collapsed && (
                  <span className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-slate-900 dark:bg-cyan-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── AI Career Guidance Section ── */}
        <div className="space-y-1.5 pt-1">
          {!collapsed ? (
            <>
              <button
                type="button"
                onClick={() => setCareerOpen(!careerOpen)}
                className="flex w-full items-center justify-between px-3.5 py-1.5 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 select-none"
              >
                <span>AI Career Guidance</span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 ${careerOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence initial={false}>
                {careerOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden space-y-1.5 pt-0.5"
                  >
                    {careerNavItems.map((item) => {
                      const Icon = item.icon;
                      const active =
                        pathname === item.path ||
                        (item.path === "/career/resume/upload" && pathname?.startsWith("/career/resume")) ||
                        (item.path === "/career/foundry/dashboard" && pathname?.startsWith("/career/foundry")) ||
                        (item.path === "/career/coding/unified" && pathname?.startsWith("/career/coding/unified")) ||
                        (item.path === "/career/coding/github" && pathname?.startsWith("/career/coding/github")) ||
                        (item.path === "/career/market/jobs" && pathname?.startsWith("/career/market"));

                      return (
                        <Link
                          key={item.id}
                          href={item.path}
                          prefetch={true}
                          className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
                            active
                              ? "neu-inset text-slate-950 dark:text-white"
                              : "text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200 hover:translate-x-0.5"
                          }`}
                        >
                          <Icon className={`relative z-10 shrink-0 ${active ? "text-slate-950 dark:text-cyan-400" : ""}`} size={17} />
                          <span className="relative z-10 truncate text-[13.5px]">{item.label}</span>
                          {active && (
                            <span className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-slate-900 dark:bg-cyan-400" />
                          )}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            /* Collapsed Career Item */
            <Link
              href="/career/resume/upload"
              prefetch={true}
              title="AI Career Guidance"
              className={`group relative flex w-full items-center justify-center overflow-hidden rounded-2xl p-2.5 text-sm transition-all duration-200 ${
                isCareerRoute
                  ? "neu-inset text-slate-950 dark:text-white"
                  : "text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Briefcase size={18} />
            </Link>
          )}
        </div>

        {/* ── Peer Collab Portal Section (Below AI Career Guidance & Above Profile) ── */}
        <div className="space-y-1.5 pt-1">
          {!collapsed ? (
            <Link
              href="/career/collab/match"
              prefetch={true}
              className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
                isCollabRoute
                  ? "neu-inset text-purple-900 dark:text-purple-200"
                  : "text-slate-600 hover:text-purple-700 dark:text-slate-400 dark:hover:text-purple-300 hover:translate-x-0.5"
              }`}
            >
              <Users className={`relative z-10 shrink-0 ${isCollabRoute ? "text-purple-600 dark:text-purple-400" : ""}`} size={17} />
              <span className="relative z-10 truncate text-[13.5px]">Peer Collab Portal</span>
              {isCollabRoute && (
                <span className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-purple-400" />
              )}
            </Link>
          ) : (
            /* Collapsed Collab Item */
            <Link
              href="/career/collab/match"
              prefetch={true}
              title="Peer Collab Portal"
              className={`group relative flex w-full items-center justify-center overflow-hidden rounded-2xl p-2.5 text-sm transition-all duration-200 ${
                isCollabRoute
                  ? "neu-inset text-purple-600 dark:text-purple-300"
                  : "text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Users size={18} />
            </Link>
          )}
        </div>

        {/* Secondary Navigation (Profile & Settings) */}
        <div className="space-y-1.5 pt-1">
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = !isCareerRoute && !isCollabRoute && (activeView === item.id || pathname === item.path);

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => handleItemClick(item.id, item.path)}
                onMouseEnter={() => onPrefetchView?.(item.id)}
                onFocus={() => onPrefetchView?.(item.id)}
                title={collapsed ? item.label : undefined}
                className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "neu-inset text-slate-950 dark:text-white"
                    : "text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200 hover:translate-x-0.5"
                }`}
              >
                <Icon className={`relative z-10 shrink-0 ${active ? "text-slate-950 dark:text-cyan-400 stroke-[2.2]" : ""}`} size={18} />
                {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
                {active && !collapsed && (
                  <span className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-slate-900 dark:bg-cyan-400" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer (Theme toggle, Pro / Upgrade & Sign Out) */}
      <div className="mt-auto space-y-2.5 shrink-0 pt-3 border-t border-slate-200/50 dark:border-white/5">
        <div className={`neu-card rounded-[24px] ${collapsed ? "p-2 flex justify-center items-center" : "p-3.5"}`}>
          {!collapsed ? (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Theme</p>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Day / night mode</p>
              </div>
              <ThemeToggle size="sm" />
            </div>
          ) : (
            <div className="flex w-full justify-center items-center py-1">
              <ThemeToggle size="xs" />
            </div>
          )}
        </div>

        {/* Upgrade to Pro / Pro Active */}
        {isPro ? (
          <div className={`neu-pill-inset inline-flex w-full items-center justify-center gap-2 rounded-2xl ${collapsed ? "px-1 py-2 text-[10px]" : "px-4 py-2.5 text-xs"} font-bold text-emerald-700 dark:text-emerald-400`}>
            {collapsed ? "Pro" : "Pro Active"}
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenPricing}
            className={`neu-btn inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 ${
              collapsed ? "h-10 w-10 mx-auto p-0" : "px-4 py-2.5 text-xs"
            } font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100`}
            title={collapsed ? "Upgrade to Pro" : undefined}
          >
            {collapsed ? "↑" : "Upgrade to Pro"}
          </button>
        )}

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          title={collapsed ? "Sign Out" : undefined}
          className={`neu-btn inline-flex w-full items-center justify-center gap-2 rounded-2xl ${
            collapsed ? "h-10 w-10 mx-auto p-0" : "px-4 py-2 text-xs"
          } font-bold text-rose-600 transition hover:bg-rose-500/10 hover:text-rose-700 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300`}
        >
          {signingOut ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <LogOut size={15} />
          )}
          {!collapsed && <span>{signingOut ? "Signing out..." : "Sign Out"}</span>}
        </button>
      </div>
    </aside>
  );
}
