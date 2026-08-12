"use client";

/**
 * Dark-mode toggle.
 *
 * tailwind.config.ts already sets `darkMode: "class"`, and the codebase is
 * full of `dark:` variants — but nothing ever added the `dark` class to
 * <html>, so none of them could ever apply. This is the missing switch.
 *
 * The initial class is applied by a blocking inline script in layout.tsx so
 * there is no flash of the wrong theme; this component only handles user
 * toggling afterwards.
 */

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "prioryx-theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  // Keeps native form controls, scrollbars and caret colours in step.
  root.style.colorScheme = theme;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const initial: Theme =
      stored ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* Safari private mode throws on setItem — the toggle still works for
         this session, it just won't persist. */
    }
  }

  // Render a placeholder of identical size until mounted, so the button does
  // not shift layout and the server/client markup match.
  if (!mounted) {
    return (
      <div
        aria-hidden
        className={`h-9 w-9 rounded-2xl border border-slate-200 dark:border-slate-700 ${className}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white ${className}`}
    >
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
