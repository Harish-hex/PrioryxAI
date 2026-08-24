"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, GraduationCap, Bot, UserRound, Menu, X,
  FileText, Hammer, Code2, Briefcase, Users, GitBranch, Settings,
  Swords, Trophy, UserCheck, Plus, Sparkles, UploadCloud,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

const careerPortals = [
  { label: "Resume Intelligence", desc: "ATS score & AI SWOT analysis", icon: FileText, path: "/career/resume/upload", color: "from-blue-500/20 to-cyan-500/20 text-cyan-400" },
  { label: "Project Foundry", desc: "Step-by-step resume builder", icon: Hammer, path: "/career/foundry/dashboard", color: "from-amber-500/20 to-orange-500/20 text-amber-400" },
  { label: "Unified Coding", desc: "LeetCode & HackerRank sync", icon: Code2, path: "/career/coding/unified", color: "from-emerald-500/20 to-teal-500/20 text-emerald-400" },
  { label: "GitHub Intelligence", desc: "Repo health & commit audit", icon: GitBranch, path: "/career/coding/github", color: "from-purple-500/20 to-indigo-500/20 text-purple-400" },
  { label: "Job & Internship Market", desc: "AI-matched student openings", icon: Briefcase, path: "/career/market/jobs", color: "from-rose-500/20 to-pink-500/20 text-rose-400" },
];

const collabPortals = [
  { label: "Friends & Match", desc: "Find study partners & peers", icon: Users, path: "/career/collab/match?tab=friends" },
  { label: "Coding Duels", desc: "Live 1v1 DSA challenges", icon: Swords, path: "/career/collab/match?tab=challenges" },
  { label: "Connection Requests", desc: "Pending peer invites", icon: UserCheck, path: "/career/collab/match?tab=requests" },
  { label: "XP Leaderboard", desc: "Weekly student rankings", icon: Trophy, path: "/career/collab/match?tab=leaderboard" },
];

function triggerHaptic() {
  if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(8);
  }
}

function useIsActive() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (p: string) => {
    if (p.includes("?")) {
      const [pPath, pQuery] = p.split("?");
      if (pathname !== pPath) return false;
      const targetParams = new URLSearchParams(pQuery);
      let matches = true;
      targetParams.forEach((value, key) => {
        if (searchParams.get(key) !== value) matches = false;
      });
      return matches;
    }
    return pathname === p || (pathname?.startsWith(p + "/") ?? false);
  };
}

/* ── Quick Actions Action Sheet ── */
export function QuickActionSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="neu-card absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[32px] p-5 pb-9 shadow-2xl border-t border-slate-200/80 dark:border-white/10"
      >
        <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700 mb-4" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-500">
              <Sparkles size={16} />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Quick Actions
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="neu-btn rounded-xl p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {/* Action 1: Upload Resume */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onClose();
              router.push("/career/resume/upload");
            }}
            className="neu-raised-sm flex items-center gap-3.5 rounded-2xl p-3.5 text-left transition active:scale-[0.98] hover:translate-x-0.5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500 dark:bg-cyan-500/20">
              <UploadCloud size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white">Resume Intelligence</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Scan CV & extract SWOT match</p>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>

          {/* Action 2: AI Assistant Study Plan */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onClose();
              router.push("/assistant");
            }}
            className="neu-raised-sm flex items-center gap-3.5 rounded-2xl p-3.5 text-left transition active:scale-[0.98] hover:translate-x-0.5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500 dark:bg-purple-500/20">
              <Bot size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white">AI Study Assistant</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Ask questions & plan study blocks</p>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>

          {/* Action 3: Duel a Peer */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onClose();
              router.push("/career/collab/match?tab=challenges");
            }}
            className="neu-raised-sm flex items-center gap-3.5 rounded-2xl p-3.5 text-left transition active:scale-[0.98] hover:translate-x-0.5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 dark:bg-amber-500/20">
              <Swords size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white">Start a Coding Duel</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">1v1 real-time DSA challenge</p>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>

          {/* Action 4: Learning Feed */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onClose();
              router.push("/learning");
            }}
            className="neu-raised-sm flex items-center gap-3.5 rounded-2xl p-3.5 text-left transition active:scale-[0.98] hover:translate-x-0.5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20">
              <GraduationCap size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white">Curated Learning Feed</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Watch targeted tech tutorials</p>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Full Workspace Portals Bottom Sheet ── */
export function CareerSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const isActive = useIsActive();

  useEffect(() => {
    onClose();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[65] lg:hidden" role="dialog" aria-modal="true">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="neu-card absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-[32px] p-5 pb-9 shadow-2xl space-y-5 border-t border-slate-200/80 dark:border-white/10"
      >
        <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="PrioryxAI" className="h-6 w-6 object-contain drop-shadow" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-900 dark:text-white">
                Workspace Portals
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">All tools & career modules</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="neu-btn rounded-xl p-2 text-slate-500 transition active:scale-95 dark:text-slate-300"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* AI Career Guidance Group */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5">
            <Briefcase size={14} className="text-cyan-500" />
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
              AI Career Guidance
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {careerPortals.map(({ label, desc, icon: Icon, path }) => (
              <Link
                key={path}
                href={path}
                onClick={triggerHaptic}
                className={`flex items-center gap-3 rounded-2xl p-3 text-xs font-semibold transition active:scale-[0.98] ${
                  isActive(path)
                    ? "neu-inset text-slate-950 dark:text-white"
                    : "neu-raised-sm text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                }`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isActive(path) ? "bg-cyan-500 text-white" : "bg-slate-100 dark:bg-white/5 text-cyan-500"}`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">{label}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{desc}</p>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </Link>
            ))}
          </div>
        </div>

        {/* Peer Collab Portal Group */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-purple-500" />
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
              Peer Collab Portal
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {collabPortals.map(({ label, desc, icon: Icon, path }) => (
              <Link
                key={path}
                href={path}
                onClick={triggerHaptic}
                className={`flex items-center gap-3 rounded-2xl p-3 text-xs font-semibold transition active:scale-[0.98] ${
                  isActive(path)
                    ? "neu-inset text-purple-900 dark:text-purple-200"
                    : "neu-raised-sm text-slate-700 hover:text-purple-700 dark:text-slate-300 dark:hover:text-purple-300"
                }`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isActive(path) ? "bg-purple-500 text-white" : "bg-slate-100 dark:bg-white/5 text-purple-500"}`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">{label}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{desc}</p>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </Link>
            ))}
          </div>
        </div>

        {/* Primary Pages Links */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 dark:border-white/10">
          <Link
            href="/learning"
            onClick={triggerHaptic}
            className="flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center neu-raised-sm text-slate-700 dark:text-slate-300 active:scale-95"
          >
            <GraduationCap size={16} className="text-emerald-500" />
            <span className="text-[11px] font-bold">Learning</span>
          </Link>

          <Link
            href="/profile"
            onClick={triggerHaptic}
            className="flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center neu-raised-sm text-slate-700 dark:text-slate-300 active:scale-95"
          >
            <UserRound size={16} className="text-blue-500" />
            <span className="text-[11px] font-bold">Profile</span>
          </Link>

          <Link
            href="/settings"
            onClick={triggerHaptic}
            className="flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center neu-raised-sm text-slate-700 dark:text-slate-300 active:scale-95"
          >
            <Settings size={16} className="text-slate-400" />
            <span className="text-[11px] font-bold">Settings</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Native-Grade Mobile Bottom Navigation Bar ── */
export function MobileNav() {
  const isActive = useIsActive();
  const [portalsOpen, setPortalsOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  return (
    <>
      <QuickActionSheet open={quickActionsOpen} onClose={() => setQuickActionsOpen(false)} />
      <CareerSheet open={portalsOpen} onClose={() => setPortalsOpen(false)} />

      <nav
        className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 pt-1 lg:hidden pointer-events-none"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0.75rem)" }}
        aria-label="Primary Mobile Navigation"
      >
        <div className="pointer-events-auto mx-auto max-w-md rounded-[32px] neu-card p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 flex items-center justify-between">
          {/* Feed */}
          <Link
            href="/feed"
            onClick={triggerHaptic}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-1.5 rounded-2xl text-[10px] font-bold transition-all active:scale-90 ${
              isActive("/feed")
                ? "text-slate-950 dark:text-white"
                : "text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <div className={`flex h-7 w-7 items-center justify-center rounded-xl transition-all ${isActive("/feed") ? "neu-inset text-cyan-500 dark:text-cyan-400" : ""}`}>
              <LayoutDashboard size={17} strokeWidth={isActive("/feed") ? 2.5 : 2} />
            </div>
            <span className="truncate">Feed</span>
          </Link>

          {/* Assistant */}
          <Link
            href="/assistant"
            onClick={triggerHaptic}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-1.5 rounded-2xl text-[10px] font-bold transition-all active:scale-90 ${
              isActive("/assistant")
                ? "text-slate-950 dark:text-white"
                : "text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <div className={`flex h-7 w-7 items-center justify-center rounded-xl transition-all ${isActive("/assistant") ? "neu-inset text-purple-500 dark:text-purple-400" : ""}`}>
              <Bot size={17} strokeWidth={isActive("/assistant") ? 2.5 : 2} />
            </div>
            <span className="truncate">AI Chat</span>
          </Link>

          {/* Floating Central Quick Action Button */}
          <div className="flex-shrink-0 px-1">
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setQuickActionsOpen(true);
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-[0_4px_16px_rgba(6,182,212,0.5)] transition-transform hover:scale-105 active:scale-95"
              aria-label="Open Quick Actions"
            >
              <Plus size={22} strokeWidth={2.6} />
            </button>
          </div>

          {/* Career */}
          <Link
            href="/career/resume/upload"
            onClick={triggerHaptic}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-1.5 rounded-2xl text-[10px] font-bold transition-all active:scale-90 ${
              isActive("/career")
                ? "text-slate-950 dark:text-white"
                : "text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <div className={`flex h-7 w-7 items-center justify-center rounded-xl transition-all ${isActive("/career") ? "neu-inset text-cyan-500 dark:text-cyan-400" : ""}`}>
              <Briefcase size={17} strokeWidth={isActive("/career") ? 2.5 : 2} />
            </div>
            <span className="truncate">Career</span>
          </Link>

          {/* More / Portals */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              setPortalsOpen(true);
            }}
            className="relative flex flex-1 flex-col items-center gap-0.5 py-1.5 rounded-2xl text-[10px] font-bold text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all active:scale-90"
            aria-label="Open All Portals"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-xl">
              <Menu size={17} strokeWidth={2} />
            </div>
            <span className="truncate">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
