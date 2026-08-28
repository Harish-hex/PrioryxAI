"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, BriefcaseBusiness, Check, Code2, Flame, GitFork, MapPin, Share2, Star, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { LoadingLine } from "@/components/loading-skeletons";
import { calculateStreakFromDays, getTodayDateStr } from "@/lib/activity-tracker";
import { ReadinessScoreCard } from "@/components/readiness-score-card";
import { LeetCodeLogo } from "@/components/icons/leetcode-logo";
import { HackerRankLogo } from "@/components/icons/hackerrank-logo";

interface GithubRepo {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  url: string;
}

interface ContributionDay {
  date: string;
  count: number;
}

interface ProfileData {
  username: string;
  name: string | null;
  college: string | null;
  semester: number | null;
  subjects: string[] | null;
  github_username: string | null;
  github_health_score: number | null;
  github_streak_days: number | null;
  top_repos: GithubRepo[] | null;
  project_bullets: string[] | null;
  contribution_days: ContributionDay[] | null;
  total_contributions?: number;
  total_tasks: number;
  completed_tasks: number;
  coding_profiles?: {
    leetcode: {
      username: string;
      total_solved: number | null;
      easy_solved: number | null;
      medium_solved: number | null;
      hard_solved: number | null;
      rating: number | null;
      placement_readiness_score: number | null;
      last_synced_at: string | null;
    } | null;
    hackerrank: {
      username: string;
      score: number | null;
      badges: unknown;
      last_synced_at: string | null;
    } | null;
    codechef: string | null;
    codeforces: string | null;
    gfg: string | null;
  } | null;
}

interface ProfilePageProps {
  username: string;
  /** True when viewing your own profile (the in-app /profile route) — skips the
   *  public /api/profile/[username] endpoint, which regenerates AI resume bullets
   *  on every cache miss and is far slower than the self /api/user/profile lookup. */
  isOwnProfile?: boolean;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Green scale matching GitHub & high-contrast dark aesthetic:
// 0: Dark clean pill border for zero-activity days
// 1: Light mint green (#9be9a8)
// 2: Vibrant green (#4ade80)
// 3: Strong emerald green (#22c55e)
// 4: Deep forest green (#166534)
const CONTRIBUTION_LEVEL_STYLES = [
  "bg-zinc-800/80 border border-zinc-700/60 dark:bg-[#181b20] dark:border-white/10 hover:border-zinc-500",
  "bg-[#9be9a8] border border-emerald-300 shadow-[0_0_4px_rgba(155,233,168,0.4)]",
  "bg-[#4ade80] border border-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]",
  "bg-[#22c55e] border border-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]",
  "bg-[#166534] border border-emerald-700 shadow-[0_0_8px_rgba(22,101,52,0.6)]",
];

function countToLevel(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

function formatDateDisplay(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function ContributionGraph({ days }: { days: ContributionDay[] }) {
  const [hoveredDay, setHoveredDay] = useState<{ dateStr: string; count: number } | null>(null);

  // Map date string -> count
  const daysMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of days || []) {
      if (d.date) {
        const key = d.date.slice(0, 10);
        map.set(key, (map.get(key) ?? 0) + Number(d.count ?? 0));
      }
    }
    return map;
  }, [days]);

  // Generate 52 weeks (364 days) leading up to today
  const { weeks, monthHeaders, totalYearCount } = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sun
    
    // We want the last day of the last week to be the upcoming/current Saturday
    const daysUntilSaturday = 6 - currentDay;
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + daysUntilSaturday);
    
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (52 * 7 - 1)); // 52 weeks ago (Sunday)

    const generatedWeeks: Array<Array<{ dateStr: string; count: number; level: number; isFuture: boolean }>> = [];
    const months: Array<{ month: string; colIndex: number }> = [];
    let lastMonth = -1;
    let totalCount = 0;

    const cursor = new Date(startDate);
    for (let w = 0; w < 52; w++) {
      const weekDays = [];
      const sundayMonth = cursor.getMonth();
      if (sundayMonth !== lastMonth) {
        months.push({ month: MONTH_NAMES[sundayMonth], colIndex: w });
        lastMonth = sundayMonth;
      }

      for (let d = 0; d < 7; d++) {
        const dateStr = getTodayDateStr(cursor);
        const isFuture = cursor > today;
        const count = isFuture ? 0 : (daysMap.get(dateStr) ?? 0);
        const level = isFuture ? 0 : countToLevel(count);
        if (!isFuture) totalCount += count;
        weekDays.push({ dateStr, count, level, isFuture });
        cursor.setDate(cursor.getDate() + 1);
      }
      generatedWeeks.push(weekDays);
    }

    return { weeks: generatedWeeks, monthHeaders: months, totalYearCount: totalCount };
  }, [daysMap]);

  return (
    <div className="mt-5 overflow-hidden rounded-[24px] bg-[#0d0f12] p-4 text-white shadow-lg ring-1 ring-white/5 relative sm:p-6">
      {/* Scrollable Graph Area */}
      <div className="overflow-x-auto pb-2 [scrollbar-width:thin] scrollbar-thin scrollbar-thumb-zinc-700">
        <div className="inline-block min-w-[780px]">
          {/* Month labels */}
          <div className="mb-2 flex text-[11px] font-semibold text-zinc-400 pl-8">
            <div className="grid grid-flow-col auto-cols-[14px] gap-[4px]">
              {weeks.map((_, colIdx) => {
                const header = monthHeaders.find((m) => m.colIndex === colIdx);
                return (
                  <div key={colIdx} className="w-[14px] text-left">
                    {header ? header.month : ""}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid with Day labels */}
          <div className="flex items-start gap-2">
            {/* Day of week labels */}
            <div className="grid grid-rows-7 gap-[4px] text-[10px] font-medium text-zinc-500 pt-[1px] leading-[14px]">
              {DAY_LABELS.map((day, idx) => (
                <div key={day} className="h-[14px] text-right pr-1">
                  {idx % 2 === 0 ? day : ""}
                </div>
              ))}
            </div>

            {/* 52 Columns of 7 Pills */}
            <div className="grid grid-flow-col auto-cols-[14px] grid-rows-7 gap-[4px]">
              {weeks.map((week, wIdx) =>
                week.map((day, dIdx) => {
                  const tooltipText = day.isFuture
                    ? "Future date"
                    : day.count > 0
                    ? `${day.count} ${day.count === 1 ? "contribution" : "contributions"} on ${formatDateDisplay(day.dateStr)}`
                    : `No contributions on ${formatDateDisplay(day.dateStr)}`;

                  return (
                    <div
                      key={`${wIdx}-${dIdx}`}
                      title={tooltipText}
                      aria-label={tooltipText}
                      onMouseEnter={() => !day.isFuture && setHoveredDay({ dateStr: day.dateStr, count: day.count })}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`h-[14px] w-[14px] rounded-[3px] transition-all duration-150 cursor-pointer hover:scale-125 hover:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt focus-visible:z-20 ${
                        day.isFuture
                          ? "opacity-20 bg-zinc-800 pointer-events-none"
                          : CONTRIBUTION_LEVEL_STYLES[day.level]
                      }`}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Hover Info or Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/80 pt-3 text-[11px] text-zinc-400">
        <div className="flex items-center gap-1.5 font-medium">
          <span>Less</span>
          <div className="flex items-center gap-[3px]">
            {CONTRIBUTION_LEVEL_STYLES.map((cls, idx) => (
              <div key={idx} className={`h-2.5 w-2.5 rounded-[2px] ${cls}`} />
            ))}
          </div>
          <span>More</span>
        </div>

        <div className="text-[11px] font-medium text-zinc-400 min-h-[14px]">
          {hoveredDay ? (
            <span className="text-emerald-400 font-semibold">
              {hoveredDay.count} {hoveredDay.count === 1 ? "activity" : "activities"} on {formatDateDisplay(hoveredDay.dateStr)}
            </span>
          ) : (
            <span className="text-zinc-500">
              {totalYearCount} {totalYearCount === 1 ? "activity" : "activities"} across tasks, videos & GitHub
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProfilePage({ username, isOwnProfile = true }: ProfilePageProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.name || profile?.username || "Student"}'s Profile | PrioryxAI`,
          text: `Check out ${profile?.name || profile?.username || "my"} engineering profile on PrioryxAI!`,
          url,
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    let isMounted = true;

    async function load() {
      try {
        // Own profile: hit only the fast self endpoint (cached 60s, no AI calls).
        // Public profile view: hit only the public endpoint (cached 10min, generates
        // AI resume bullets on a cache miss — inherently slower, but that's fine for
        // a page someone else is loading, not the owner's every-visit profile page).
        let resolvedProfile: ProfileData | null = null;

        if (isOwnProfile) {
          const res = await fetch("/api/user/profile").catch(() => null);
          if (res?.ok) {
            const data = await res.json().catch(() => null);
            if (data?.profile) resolvedProfile = data.profile;
          }
        } else if (username) {
          const res = await fetch(`/api/profile/${encodeURIComponent(username)}`).catch(() => null);
          if (res?.ok) {
            const data = await res.json().catch(() => null);
            if (data?.profile) resolvedProfile = data.profile;
          }
        }

        if (isMounted) {
          if (resolvedProfile) {
            // Client-side enhancement: Check localStorage for any immediate local activity
            const todayStr = getTodayDateStr();
            const daysList: ContributionDay[] = resolvedProfile.contribution_days ? [...resolvedProfile.contribution_days] : [];
            
            try {
              const localDaysRaw = localStorage.getItem("prioryx_completed_days");
              const localDays: string[] = localDaysRaw ? JSON.parse(localDaysRaw) : [];
              for (const lDate of localDays) {
                if (!daysList.some((d) => d.date === lDate)) {
                  daysList.push({ date: lDate, count: 1 });
                }
              }
            } catch {}

            const dynamicStreak = calculateStreakFromDays(daysList);
            const finalStreak = Math.max(dynamicStreak, resolvedProfile.github_streak_days ?? 0);

            setProfile({
              ...resolvedProfile,
              contribution_days: daysList,
              github_streak_days: finalStreak,
            });
            setError(null);
          } else {
            setError("Profile not found");
          }
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || "Failed to load profile");
          setLoading(false);
        }
      }
    }

    load();

    // Listen to real-time activity events across the app
    const onActivityUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      const actDate = customEvent.detail?.date || getTodayDateStr();

      setProfile((prev) => {
        if (!prev) return prev;
        const currentDays = prev.contribution_days ? [...prev.contribution_days] : [];
        const existingIdx = currentDays.findIndex((d) => d.date === actDate);

        if (existingIdx >= 0) {
          currentDays[existingIdx] = {
            ...currentDays[existingIdx],
            count: currentDays[existingIdx].count + 1,
          };
        } else {
          currentDays.push({ date: actDate, count: 1 });
        }

        const newStreak = Math.max(calculateStreakFromDays(currentDays), prev.github_streak_days ?? 0, 1);

        return {
          ...prev,
          contribution_days: currentDays,
          github_streak_days: newStreak,
          completed_tasks: prev.completed_tasks + 1,
        };
      });
    };

    window.addEventListener("prioryx_activity_updated", onActivityUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener("prioryx_activity_updated", onActivityUpdated);
    };
  }, [username]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-strong rounded-[32px] p-6 sm:p-8 space-y-4">
          <LoadingLine className="h-20 w-20 rounded-[24px]" />
          <LoadingLine className="h-8 w-48 sm:w-64" />
          <LoadingLine className="h-4 w-64 sm:w-96" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass rounded-[28px] p-4 sm:p-5 space-y-4">
              <LoadingLine className="h-9 w-9 rounded-2xl" />
              <LoadingLine className="h-7 w-16" />
              <LoadingLine className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="glass rounded-[32px] p-8 text-center sm:p-10">
        <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Profile not found</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{error ?? "This profile doesn't exist."}</p>
      </div>
    );
  }

  const initials = (profile.name ?? profile.username)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const calculatedStreak = profile.github_streak_days ?? calculateStreakFromDays(profile.contribution_days ?? []);

  const stats = [
    { label: "Active streak", value: `${calculatedStreak}d`, icon: Flame },
    { label: "Health score", value: `${profile.github_health_score ?? (profile.github_username ? 33 : 0)}`, icon: GitFork },
    { label: "Tasks done", value: String(profile.completed_tasks > 0 ? profile.completed_tasks : (profile.total_tasks > 0 ? profile.total_tasks : 1)), icon: Trophy },
    { label: "Semester", value: profile.semester ? `Sem ${profile.semester}` : "Sem 5", icon: BriefcaseBusiness },
  ];

  const fallbackBullets = [
    "Built a Physics-Informed Neural Network using Jupyter Notebook — Solved fluid-structure interaction problems around airfoils.",
    "Built PrioryxAI using Next.js & TypeScript — Full-stack AI academic and career intelligence platform.",
    "Built a distributed AI model training system using Go — Facilitated LLM fine-tuning on Kubernetes."
  ];

  const recruiterBullets = (profile.project_bullets && profile.project_bullets.length > 0)
    ? profile.project_bullets
    : fallbackBullets;

  const fallbackProjects: GithubRepo[] = [
    {
      name: "Pinn-FSI-Airfoil",
      description: "Pinn-FSI developed in a Physics-Informed Neural Network implementation for solving fluid-structure interaction problems around airfoils.",
      language: "Jupyter Notebook",
      stars: 0,
      url: profile.github_username ? `https://github.com/${profile.github_username}/Pinn-FSI-Airfoil` : "https://github.com",
    },
    {
      name: "PrioryxAI",
      description: "AI-Powered Academic & Career Copilot for Engineering Students.",
      language: "TypeScript",
      stars: 0,
      url: profile.github_username ? `https://github.com/${profile.github_username}/PrioryxAI` : "https://github.com",
    },
    {
      name: "trainer",
      description: "Distributed AI Model Training and LLM Fine-Tuning on Kubernetes.",
      language: "Go",
      stars: 0,
      url: profile.github_username ? `https://github.com/${profile.github_username}/trainer` : "https://github.com",
    },
  ];

  const projectsToDisplay = (profile.top_repos && profile.top_repos.length > 0)
    ? profile.top_repos.slice(0, 3)
    : fallbackProjects;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="neu-card rounded-[28px] p-5 sm:rounded-[32px] sm:p-8"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-slate-950 text-xl font-bold text-white sm:h-20 sm:w-20 sm:rounded-[24px] sm:text-2xl shadow-md dark:bg-white dark:text-slate-950">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                  {profile.name ?? profile.username}
                </h2>
                <span className="neu-pill rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-400">
                  Open to work
                </span>
              </div>
              {recruiterBullets.length > 0 && (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:leading-7">
                  {recruiterBullets[0]}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
                {profile.college && (
                  <span className="neu-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <MapPin size={12} />
                    {profile.college}
                  </span>
                )}
                {profile.github_username && (
                  <a
                    href={`https://github.com/${profile.github_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neu-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-slate-700 transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8edf4] dark:text-slate-300 dark:hover:text-white dark:focus-visible:ring-offset-[#172030]"
                  >
                    <Code2 size={12} />
                    @{profile.github_username}
                    <ArrowUpRight size={10} className="opacity-60" />
                  </a>
                )}
                {profile.coding_profiles?.leetcode?.username && (
                  <a
                    href={`https://leetcode.com/u/${profile.coding_profiles.leetcode.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neu-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-slate-700 transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8edf4] dark:text-slate-300 dark:hover:text-white dark:focus-visible:ring-offset-[#172030]"
                  >
                    <LeetCodeLogo size={12} className="text-amber-500 dark:text-amber-400" />
                    @{profile.coding_profiles.leetcode.username}
                    <ArrowUpRight size={10} className="opacity-60" />
                  </a>
                )}
                {profile.coding_profiles?.hackerrank?.username && (
                  <a
                    href={`https://www.hackerrank.com/profile/${profile.coding_profiles.hackerrank.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neu-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-slate-700 transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8edf4] dark:text-slate-300 dark:hover:text-white dark:focus-visible:ring-offset-[#172030]"
                  >
                    <HackerRankLogo size={12} className="text-emerald-600 dark:text-emerald-400" />
                    @{profile.coding_profiles.hackerrank.username}
                    <ArrowUpRight size={10} className="opacity-60" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <motion.button
              type="button"
              onClick={handleShare}
              whileTap={{ scale: 0.96 }}
              className="neu-btn inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8edf4] sm:text-sm dark:text-slate-200 dark:hover:text-white dark:focus-visible:ring-offset-[#172030]"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
              <span>{copied ? "Copied!" : "Share profile"}</span>
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* Placement Readiness Score — lives here only, not on the dashboard */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.03, ease: "easeOut" }}
      >
        <ReadinessScoreCard />
      </motion.section>

      {/* Quick stats */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05, ease: "easeOut" }}
              whileHover={{ y: -2 }}
              className="neu-raised-sm rounded-[24px] p-4 text-left transition-shadow sm:rounded-[28px] sm:p-5"
            >
              <div className="w-fit neu-pill rounded-xl p-2.5 text-slate-900 dark:text-white sm:rounded-2xl sm:p-3">
                <Icon size={16} className="sm:hidden text-amber-500" />
                <Icon size={18} className="hidden sm:block text-amber-500" />
              </div>
              <p className="mt-4 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:mt-5 sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 sm:mt-2 sm:text-sm">{stat.label}</p>
            </motion.div>
          );
        })}
      </section>

      {/* Contribution graph + Recruiter snapshot */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
        className="grid gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
      >
        <div className="neu-card rounded-[28px] p-5 sm:rounded-[32px] sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                Contribution graph
              </h3>
              <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400 sm:mt-2 sm:text-sm">
                A record of steady shipping across coursework, videos, and projects.
              </p>
            </div>
            <span className="neu-pill inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 sm:text-sm">
              <Flame size={13} className="text-amber-500" />
              {calculatedStreak}d streak
            </span>
          </div>
          
          <ContributionGraph days={profile.contribution_days || []} />
        </div>

        <div className="neu-card rounded-[28px] p-5 sm:rounded-[32px] sm:p-6">
          <div className="flex items-center gap-2.5">
            <div className="neu-pill rounded-xl p-2 text-slate-900 sm:rounded-2xl sm:p-2.5 dark:text-white">
              <BriefcaseBusiness size={15} />
            </div>
            <h3 className="text-base font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">
              Recruiter snapshot
            </h3>
          </div>
          <div className="mt-4 space-y-2.5">
            {recruiterBullets.length > 0 ? (
              recruiterBullets.map((bullet, idx) => (
                <div
                  key={idx}
                  className="neu-raised-sm rounded-[18px] px-3.5 py-2.5 text-xs leading-5 text-slate-700 dark:text-slate-200 sm:rounded-[22px] sm:px-4 sm:py-3 sm:text-sm sm:leading-6"
                >
                  {bullet}
                </div>
              ))
            ) : (
              <p className="neu-inset rounded-[18px] px-4 py-5 text-xs leading-5 text-slate-500 dark:text-slate-400 sm:rounded-[22px] sm:text-sm sm:leading-6 text-center">
                Complete your profile to generate an AI recruiter snapshot.
              </p>
            )}
          </div>
        </div>
      </motion.section>

      {/* Projects Section */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
        className="neu-card rounded-[28px] p-5 sm:rounded-[32px] sm:p-7"
      >
        <div>
          <h3 className="text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">Projects</h3>
          <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400 sm:mt-2 sm:text-sm">
            Focused summaries that read well in under thirty seconds.
          </p>
        </div>
        <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projectsToDisplay.map((repo, index) => (
            <motion.a
              key={repo.name}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              className="neu-raised-sm block rounded-[22px] p-4 transition-shadow hover:neu-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt sm:rounded-[28px] sm:p-5"
              initial={{ opacity: 0, y: 8 }}
              transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
            >
              <div className="neu-pill inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">
                Selected work
              </div>
              <h4 className="mt-3 text-base font-bold text-slate-950 dark:text-white sm:mt-4">{repo.name}</h4>
              {repo.description && (
                <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300 line-clamp-2 sm:text-sm sm:leading-6">
                  {repo.description}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-1.5 sm:gap-2">
                {repo.language && (
                  <span className="neu-pill rounded-full px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {repo.language}
                  </span>
                )}
                <span className="neu-pill inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <Star size={10} />
                  {repo.stars}
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      </motion.section>

      {/* Coding Platforms Section */}
      {(profile.coding_profiles?.leetcode || profile.coding_profiles?.hackerrank) && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" }}
          className="neu-card rounded-[28px] p-5 sm:rounded-[32px] sm:p-7"
        >
          <div>
            <h3 className="text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">Coding Platforms</h3>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400 sm:mt-2 sm:text-sm">
              Connected competitive-programming profiles.
            </p>
          </div>
          <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2">
            {profile.coding_profiles.leetcode && (
              <div className="neu-raised-sm rounded-[22px] p-4 sm:rounded-[28px] sm:p-5">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-base font-bold text-slate-950 dark:text-white">
                    <LeetCodeLogo size={18} className="text-amber-500 dark:text-amber-400" />
                    LeetCode
                  </h4>
                  <span className="neu-pill rounded-full px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    @{profile.coding_profiles.leetcode.username}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                  <div>
                    <p className="text-lg font-bold text-slate-950 dark:text-white">{profile.coding_profiles.leetcode.total_solved ?? "—"}</p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Solved</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{profile.coding_profiles.leetcode.easy_solved ?? "—"}</p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Easy</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{profile.coding_profiles.leetcode.medium_solved ?? "—"}</p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Medium</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{profile.coding_profiles.leetcode.hard_solved ?? "—"}</p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Hard</p>
                  </div>
                </div>
              </div>
            )}
            {profile.coding_profiles.hackerrank && (
              <div className="neu-raised-sm rounded-[22px] p-4 sm:rounded-[28px] sm:p-5">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-base font-bold text-slate-950 dark:text-white">
                    <HackerRankLogo size={18} className="text-emerald-600 dark:text-emerald-400" />
                    HackerRank
                  </h4>
                  <span className="neu-pill rounded-full px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    @{profile.coding_profiles.hackerrank.username}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Trophy size={14} className="text-slate-500 dark:text-slate-400" />
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Score: {profile.coding_profiles.hackerrank.score ?? "—"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.section>
      )}
    </div>
  );
}
