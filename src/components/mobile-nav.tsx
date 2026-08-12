"use client";

/**
 * Mobile navigation.
 *
 * The desktop sidebar is `hidden lg:flex`, so on the /career/* routes there
 * was NO navigation at all below 1024px — every career page was a dead end
 * unless the user edited the URL. app-shell (used by /feed, /assistant,
 * /profile, /settings) does ship a bottom bar, but it has no career links,
 * so the career section was unreachable from there on mobile too.
 *
 * Exports:
 *   MobileNav   — bottom tab bar + career sheet, for the career layout.
 *   CareerSheet — the sheet alone, so app-shell can hang it off a "More" tab
 *                 instead of stacking a second bar on top of its own.
 *
 * Both render only below `lg`; the desktop experience is untouched.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Play, Bot, UserRound, Menu, X,
  FileText, Hammer, Code2, Briefcase, Users, GitBranch, Settings,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const primary = [
  { label: "Home", icon: LayoutDashboard, path: "/feed" },
  { label: "Feed", icon: Play, path: "/learning" },
  { label: "Assistant", icon: Bot, path: "/assistant" },
  { label: "Profile", icon: UserRound, path: "/profile" },
];

const career = [
  { label: "Resume Intelligence", icon: FileText, path: "/career/resume/upload" },
  { label: "Project Foundry", icon: Hammer, path: "/career/foundry/dashboard" },
  { label: "Unified Profile", icon: Code2, path: "/career/coding/unified" },
  { label: "GitHub Intelligence", icon: GitBranch, path: "/career/coding/github" },
  { label: "Job Market", icon: Briefcase, path: "/career/market/jobs" },
  { label: "Peer Collab", icon: Users, path: "/career/collab/match" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

function useIsActive() {
  const pathname = usePathname();
  return (p: string) => pathname === p || (pathname?.startsWith(p + "/") ?? false);
}

export function CareerSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const isActive = useIsActive();

  // Close whenever the route changes, otherwise the sheet stays open on top of
  // the page the user just navigated to.
  useEffect(() => {
    onClose();
    // Intentionally keyed on pathname only — including onClose would re-fire
    // whenever the parent re-renders with a new closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Prevent the page behind the sheet from scrolling while it's open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Escape closes, matching the backdrop click.
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
      <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white p-5 pb-8 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            AI Career Guidance
          </p>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 active:scale-95 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {career.map(({ label, icon: Icon, path }) => (
            <Link
              key={path}
              href={path}
              className={`flex items-center gap-2.5 rounded-2xl border p-3 text-sm font-medium transition active:scale-[0.98] ${
                isActive(path)
                  ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                  : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <Icon size={16} className="shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const isActive = useIsActive();
  const [open, setOpen] = useState(false);

  return (
    <>
      <CareerSheet open={open} onClose={() => setOpen(false)} />

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-lg lg:hidden dark:border-slate-700 dark:bg-slate-900/95"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
        aria-label="Primary"
      >
        <div className="flex items-stretch justify-around pt-1">
          {primary.map(({ label, icon: Icon, path }) => (
            <Link
              key={path}
              href={path}
              aria-current={isActive(path) ? "page" : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition active:scale-95 ${
                isActive(path)
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Icon size={20} />
              <span className="truncate">{label}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="More navigation"
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition active:scale-95 ${
              open || pathname?.startsWith("/career")
                ? "text-slate-900 dark:text-white"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Menu size={20} />
            <span className="truncate">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
