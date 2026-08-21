"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "prioryx-theme";

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

interface ThemeToggleProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", size = "md", showLabel = false }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const isDark =
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const initial: Theme = isDark ? "dark" : "light";
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const userChoice = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (!userChoice) {
        const newTheme: Theme = e.matches ? "dark" : "light";
        setTheme(newTheme);
        applyTheme(newTheme);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && (e.newValue === "dark" || e.newValue === "light")) {
        setTheme(e.newValue);
        applyTheme(e.newValue);
      }
    };

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<Theme>;
      if (customEvent.detail && (customEvent.detail === "dark" || customEvent.detail === "light")) {
        setTheme(customEvent.detail);
        applyTheme(customEvent.detail);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("prioryx-theme-change", handleCustomEvent);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("prioryx-theme-change", handleCustomEvent);
    };
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
      window.dispatchEvent(new CustomEvent("prioryx-theme-change", { detail: next }));
    } catch {
      // Safari private mode handling
    }
  }

  const isDark = theme === "dark";

  // Exact proportional sizing based on requested size tier
  const dimensions =
    size === "xs"
      ? { width: 46, height: 24, knobSize: 18, knobTravel: 22, padding: 3, scale: 0.65 }
      : size === "sm"
      ? { width: 58, height: 28, knobSize: 22, knobTravel: 30, padding: 3, scale: 0.82 }
      : size === "lg"
      ? { width: 86, height: 40, knobSize: 32, knobTravel: 46, padding: 4, scale: 1.25 }
      : { width: 68, height: 32, knobSize: 25, knobTravel: 36, padding: 3.5, scale: 1.0 };

  const { width, height, knobSize, knobTravel, padding, scale } = dimensions;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`} suppressHydrationWarning>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        onClick={toggle}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        suppressHydrationWarning
        style={{
          width: `${width}px`,
          height: `${height}px`,
        }}
        className="group relative cursor-pointer select-none rounded-full p-[2px] shadow-sm transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-500"
      >
        {/* Toggle Track Container */}
        <div
          className={`relative h-full w-full overflow-hidden rounded-full transition-colors duration-500 ${
            isDark
              ? "bg-gradient-to-r from-[#070e1c] via-[#0d1b2e] to-[#1b2b42] shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)] border border-slate-700/60"
              : "bg-gradient-to-r from-[#38bdf8] via-[#48cae4] to-[#60a5fa] shadow-[inset_0_2px_5px_rgba(0,0,0,0.25)] border border-sky-300/60"
          }`}
        >
          {/* ── Day Details: Fluffy Clouds ── */}
          <div
            className={`pointer-events-none absolute inset-0 transition-all duration-500 ease-out ${
              isDark ? "translate-y-6 opacity-0" : "translate-y-0 opacity-100"
            }`}
          >
            {/* Background cloud upper right */}
            <svg
              className="absolute text-white/50"
              style={{
                right: `${Math.round(16 * scale)}px`,
                top: `${Math.round(4 * scale)}px`,
                width: `${Math.round(18 * scale)}px`,
                height: `${Math.round(11 * scale)}px`,
              }}
              viewBox="0 0 24 14"
              fill="currentColor"
            >
              <path d="M18.5 4a4.5 4.5 0 0 0-4.4 3.5 3 3 0 0 0-2.6 1.5H5a4 4 0 0 0 0 8h13.5a4.5 4.5 0 0 0 0-9z" />
            </svg>

            {/* Foreground fluffy cloud bottom right */}
            <svg
              className="absolute text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
              style={{
                right: `${Math.round(4 * scale)}px`,
                bottom: `-${Math.round(2 * scale)}px`,
                width: `${Math.round(26 * scale)}px`,
                height: `${Math.round(16 * scale)}px`,
              }}
              viewBox="0 0 28 16"
              fill="currentColor"
            >
              <path d="M7 16h16a5 5 0 0 0 1.2-9.8A6 6 0 0 0 13 4a6.5 6.5 0 0 0-6.1 4.3A4.5 4.5 0 0 0 7 16z" />
            </svg>
          </div>

          {/* ── Night Details: Sparkle Stars & Constellation on the Left Side ── */}
          <div
            className={`pointer-events-none absolute inset-0 transition-all duration-500 ease-out ${
              isDark ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"
            }`}
          >
            {/* 4-Point Primary Sparkle Star (upper-left) */}
            <svg
              className="absolute text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.9)] animate-pulse"
              style={{
                left: `${Math.round(6 * scale)}px`,
                top: `${Math.round(4 * scale)}px`,
                width: `${Math.round(10 * scale)}px`,
                height: `${Math.round(10 * scale)}px`,
                animationDuration: "2.2s",
              }}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
            </svg>

            {/* 4-Point Secondary Sparkle Star (lower-mid-left) */}
            <svg
              className="absolute text-amber-100 drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]"
              style={{
                left: `${Math.round(16 * scale)}px`,
                top: `${Math.round(13 * scale)}px`,
                width: `${Math.round(7.5 * scale)}px`,
                height: `${Math.round(7.5 * scale)}px`,
              }}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
            </svg>

            {/* 4-Point Micro Star (upper-mid) */}
            <svg
              className="absolute text-cyan-200/90 animate-pulse"
              style={{
                left: `${Math.round(23 * scale)}px`,
                top: `${Math.round(3 * scale)}px`,
                width: `${Math.round(6 * scale)}px`,
                height: `${Math.round(6 * scale)}px`,
                animationDuration: "1.8s",
              }}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
            </svg>

            {/* Glowing Star Dot 1 (bottom left) */}
            <span
              style={{
                left: `${Math.round(8 * scale)}px`,
                bottom: `${Math.round(4 * scale)}px`,
                width: `${Math.max(2, Math.round(2.5 * scale))}px`,
                height: `${Math.max(2, Math.round(2.5 * scale))}px`,
              }}
              className="absolute rounded-full bg-white shadow-[0_0_2px_#ffffff]"
            />

            {/* Glowing Star Dot 2 (center left) */}
            <span
              style={{
                left: `${Math.round(18 * scale)}px`,
                top: `${Math.round(4 * scale)}px`,
                width: `${Math.max(1.5, Math.round(2 * scale))}px`,
                height: `${Math.max(1.5, Math.round(2 * scale))}px`,
              }}
              className="absolute rounded-full bg-white/80"
            />
          </div>

          {/* ── Sliding Knob (Sun on Left / Moon on Right) ── */}
          <div
            style={{
              width: `${knobSize}px`,
              height: `${knobSize}px`,
              top: `${padding}px`,
              left: `${padding}px`,
              transform: isDark ? `translateX(${knobTravel}px)` : "translateX(0px)",
            }}
            className="absolute rounded-full transition-transform duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)]"
          >
            {/* Sun Body (Light Mode) */}
            <div
              className={`absolute inset-0 rounded-full transition-opacity duration-400 ${
                isDark ? "opacity-0" : "opacity-100"
              }`}
              style={{
                background: "radial-gradient(circle at 35% 35%, #fff59d 0%, #ffeb3b 45%, #fbc02d 85%, #f57f17 100%)",
                boxShadow: "0 0 12px rgba(253, 224, 71, 0.95), 0 0 5px rgba(245, 127, 23, 0.7), inset 0 -1px 2px rgba(230, 81, 0, 0.4)",
              }}
            />

            {/* Moon Body with Realistic Craters (Dark Mode) */}
            <div
              className={`absolute inset-0 rounded-full transition-opacity duration-400 ${
                isDark ? "opacity-100" : "opacity-0"
              }`}
              style={{
                background: "radial-gradient(circle at 35% 35%, #ffffff 0%, #f1f5f9 45%, #e2e8f0 80%, #cbd5e1 100%)",
                boxShadow: "0 0 10px rgba(255, 255, 255, 0.75), 0 0 3px rgba(203, 213, 225, 0.5), inset 0 -1px 2px rgba(100, 116, 139, 0.4)",
              }}
            >
              {/* Moon Crater 1 (top right) */}
              <div
                style={{
                  width: `${Math.max(3, Math.round(5 * scale))}px`,
                  height: `${Math.max(3, Math.round(5 * scale))}px`,
                  top: `${Math.round(4 * scale)}px`,
                  right: `${Math.round(4 * scale)}px`,
                }}
                className="absolute rounded-full bg-[#94a3b8]/45 shadow-[inset_0_0.8px_1.5px_rgba(51,65,85,0.4)]"
              />
              {/* Moon Crater 2 (bottom left) */}
              <div
                style={{
                  width: `${Math.max(2.5, Math.round(4 * scale))}px`,
                  height: `${Math.max(2.5, Math.round(4 * scale))}px`,
                  bottom: `${Math.round(4 * scale)}px`,
                  left: `${Math.round(4 * scale)}px`,
                }}
                className="absolute rounded-full bg-[#94a3b8]/40 shadow-[inset_0_0.8px_1.5px_rgba(51,65,85,0.35)]"
              />
              {/* Moon Crater 3 (small bottom right) */}
              <div
                style={{
                  width: `${Math.max(2, Math.round(3 * scale))}px`,
                  height: `${Math.max(2, Math.round(3 * scale))}px`,
                  bottom: `${Math.round(4.5 * scale)}px`,
                  right: `${Math.round(3.5 * scale)}px`,
                }}
                className="absolute rounded-full bg-[#94a3b8]/30 shadow-[inset_0_0.5px_1px_rgba(51,65,85,0.3)]"
              />
            </div>
          </div>
        </div>
      </button>

      {showLabel && (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 select-none">
          {isDark ? "Dark mode" : "Light mode"}
        </span>
      )}
    </div>
  );
}
