"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, GraduationCap, Bot, UserRound, Menu, X,
  FileText, Hammer, Code2, Briefcase, Users, GitBranch, Settings,
  Swords, Trophy, UserCheck
} from "lucide-react";

const primary = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/feed" },
  { label: "Assistant", icon: Bot, path: "/assistant" },
  { label: "Learning", icon: GraduationCap, path: "/learning" },
  { label: "Career", icon: Briefcase, path: "/career/resume/upload" },
  { label: "Collab", icon: Users, path: "/career/collab/match" },
  { label: "Profile", icon: UserRound, path: "/profile" },
];

const career = [
  { label: "Resume Intelligence", icon: FileText, path: "/career/resume/upload" },
  { label: "Project Foundry", icon: Hammer, path: "/career/foundry/dashboard" },
  { label: "Unified Profile", icon: Code2, path: "/career/coding/unified" },
  { label: "GitHub Intelligence", icon: GitBranch, path: "/career/coding/github" },
  { label: "Job Market", icon: Briefcase, path: "/career/market/jobs" },
];

const collab = [
  { label: "Friends & Match", icon: Users, path: "/career/collab/match?tab=friends" },
  { label: "Duels & Challenges", icon: Swords, path: "/career/collab/match?tab=challenges" },
  { label: "Connect Requests", icon: UserCheck, path: "/career/collab/match?tab=requests" },
  { label: "XP Leaderboard", icon: Trophy, path: "/career/collab/match?tab=leaderboard" },
];

function useIsActive() {
  const pathname = usePathname();
  return (p: string) => {
    if (p.includes("?")) {
      return pathname === p.split("?")[0];
    }
    return pathname === p || (pathname?.startsWith(p + "/") ?? false);
  };
}

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
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <button
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-slate-900/50 backdrop-blur-sm"
      />
      <div className="neu-card absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[32px] p-5 pb-8 shadow-2xl space-y-5">
        <div className="mx-auto h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="PrioryxAI" className="h-5 w-5 object-contain" />
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Workspace Portals
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="neu-btn rounded-xl p-2 text-slate-500 transition active:scale-95 dark:text-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* AI Career Guidance Group */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            AI Career Guidance
          </p>
          <div className="grid grid-cols-2 gap-2">
            {career.map(({ label, icon: Icon, path }) => (
              <Link
                key={path}
                href={path}
                className={`flex items-center gap-2 rounded-2xl p-2.5 text-xs font-semibold transition active:scale-[0.98] ${
                  isActive(path)
                    ? "neu-inset text-slate-950 dark:text-white"
                    : "neu-raised-sm text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                }`}
              >
                <Icon size={15} className={`shrink-0 ${isActive(path) ? "text-slate-950 dark:text-cyan-400 stroke-[2.2]" : ""}`} />
                <span className="truncate">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Peer Collab Portal Group */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
            <Users size={13} /> Peer Collab Portal
          </p>
          <div className="grid grid-cols-2 gap-2">
            {collab.map(({ label, icon: Icon, path }) => (
              <Link
                key={path}
                href={path}
                className={`flex items-center gap-2 rounded-2xl p-2.5 text-xs font-semibold transition active:scale-[0.98] ${
                  isActive(path)
                    ? "neu-inset text-purple-900 dark:text-purple-200"
                    : "neu-raised-sm text-slate-700 hover:text-purple-700 dark:text-slate-300 dark:hover:text-purple-300"
                }`}
              >
                <Icon size={15} className={`shrink-0 ${isActive(path) ? "text-purple-600 dark:text-purple-400 stroke-[2.2]" : ""}`} />
                <span className="truncate">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="pt-1">
          <Link
            href="/settings"
            className="flex items-center justify-center gap-2 rounded-2xl p-3 text-xs font-bold neu-btn text-slate-700 dark:text-slate-300"
          >
            <Settings size={15} />
            <span>Workspace Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const isActive = useIsActive();
  const [careerOpen, setCareerOpen] = useState(false);

  return (
    <>
      <CareerSheet open={careerOpen} onClose={() => setCareerOpen(false)} />

      <nav
        className="neu-card fixed inset-x-0 bottom-0 z-40 rounded-t-[28px] lg:hidden"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
        aria-label="Primary"
      >
        <div className="flex items-stretch justify-around px-2 pt-1.5">
          {primary.map(({ label, icon: Icon, path }) => (
            <Link
              key={path}
              href={path}
              aria-current={isActive(path) ? "page" : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-[10px] font-semibold transition active:scale-95 ${
                isActive(path)
                  ? "neu-pill text-slate-950 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Icon size={17} className={isActive(path) ? "text-slate-950 dark:text-cyan-400 stroke-[2.2]" : ""} />
              <span className="truncate">{label}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setCareerOpen((v) => !v)}
            aria-label="Open more menu"
            className="flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-[10px] font-semibold text-slate-500 transition hover:text-slate-900 active:scale-95 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <Menu size={17} />
            <span className="truncate">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
