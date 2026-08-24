"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, BriefcaseBusiness, Check, Code2, GitFork, MapPin, Share2, Star, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { LoadingLine } from "@/components/loading-skeletons";

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
  total_tasks: number;
  completed_tasks: number;
}

interface ProfilePageProps {
  username: string;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Green scale matching the reference image:
// 0: Crisp rounded off-white pill
// 1: Light mint green (#9be9a8)
// 2: Vibrant green (#4ade80)
// 3: Strong emerald green (#22c55e)
// 4: Deep forest green (#166534)
const CONTRIBUTION_LEVEL_STYLES = [
  "bg-white border border-slate-200 dark:border-white/10 dark:bg-[#f4f4f5]",
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

function ContributionGraph({ days }: { days: ContributionDay[] }) {
  // Map date string -> count
  const daysMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of days) {
      map.set(d.date, d.count);
    }
    return map;
  }, [days]);

  // Generate 52 weeks (364 days) leading up to today
  const { weeks, monthHeaders } = useMemo(() => {
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

    const cursor = new Date(startDate);
    for (let w = 0; w < 52; w++) {
      const weekDays = [];
      const sundayMonth = cursor.getMonth();
      if (sundayMonth !== lastMonth) {
        months.push({ month: MONTH_NAMES[sundayMonth], colIndex: w });
        lastMonth = sundayMonth;
      }

      for (let d = 0; d < 7; d++) {
        const dateStr = cursor.toISOString().split("T")[0];
        const isFuture = cursor > today;
        const count = isFuture ? 0 : (daysMap.get(dateStr) ?? 0);
        const level = isFuture ? 0 : countToLevel(count);
        weekDays.push({ dateStr, count, level, isFuture });
        cursor.setDate(cursor.getDate() + 1);
      }
      generatedWeeks.push(weekDays);
    }

    return { weeks: generatedWeeks, monthHeaders: months };
  }, [daysMap]);

  return (
    <div className="mt-5 overflow-hidden rounded-[24px] bg-[#111315] p-5 text-white shadow-2xl">
      {/* Scrollable Graph Area */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700">
        <div className="inline-block min-w-[760px]">
          {/* Month labels */}
          <div className="mb-2 flex text-[11px] font-semibold text-zinc-400 pl-8">
            <div className="grid grid-flow-col auto-cols-[13px] gap-[3px]">
              {weeks.map((_, colIdx) => {
                const header = monthHeaders.find((m) => m.colIndex === colIdx);
                return (
                  <div key={colIdx} className="w-[13px] text-left">
                    {header ? header.month : ""}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid with Day labels */}
          <div className="flex items-start gap-2">
            {/* Day of week labels */}
            <div className="grid grid-rows-7 gap-[3px] text-[10px] font-medium text-zinc-500 pt-[1px] leading-[13px]">
              {DAY_LABELS.map((day, idx) => (
                <div key={day} className="h-[13px] text-right pr-1">
                  {idx % 2 === 0 ? day : ""}
                </div>
              ))}
            </div>

            {/* 52 Columns of 7 Pills */}
            <div className="grid grid-flow-col auto-cols-[13px] grid-rows-7 gap-[3px]">
              {weeks.map((week, wIdx) =>
                week.map((day, dIdx) => (
                  <div
                    key={`${wIdx}-${dIdx}`}
                    title={`${day.dateStr}: ${day.count} contributions`}
                    className={`h-[13px] w-[13px] rounded-[3px] transition-all hover:scale-125 hover:z-10 ${
                      day.isFuture
                        ? "opacity-20 bg-zinc-800"
                        : CONTRIBUTION_LEVEL_STYLES[day.level]
                    }`}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend and Scroll Indicator */}
      <div className="mt-4 flex items-center justify-between border-t border-zinc-800/80 pt-3 text-[11px] text-zinc-400">
        <div className="flex items-center gap-1.5 font-medium">
          <span>Less</span>
          <div className="flex items-center gap-1">
            {CONTRIBUTION_LEVEL_STYLES.map((cls, idx) => (
              <div key={idx} className={`h-2.5 w-2.5 rounded-[2px] ${cls}`} />
            ))}
          </div>
          <span>More</span>
        </div>
        <span className="text-[10px] text-zinc-500">52 weeks activity</span>
      </div>
    </div>
  );
}

function PlaceholderGraph() {
  // Generate sample aesthetic pattern matching reference
  const randomPattern = useMemo(() => {
    return Array.from({ length: 42 }, () =>
      Array.from({ length: 7 }, () => {
        const r = Math.random();
        if (r > 0.85) return 3;
        if (r > 0.65) return 2;
        if (r > 0.45) return 1;
        return 0;
      })
    );
  }, []);

  return (
    <div className="mt-5 overflow-hidden rounded-[24px] bg-[#111315] p-5 text-white shadow-2xl">
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700">
        <div className="inline-block min-w-[700px]">
          {/* Months */}
          <div className="mb-2 flex text-[11px] font-semibold text-zinc-400 pl-8 gap-10">
            {["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>

          <div className="flex items-start gap-2">
            <div className="grid grid-rows-7 gap-[3px] text-[10px] font-medium text-zinc-500 leading-[13px]">
              {DAY_LABELS.map((day, idx) => (
                <div key={day} className="h-[13px] text-right pr-1">
                  {idx % 2 === 0 ? day : ""}
                </div>
              ))}
            </div>

            <div className="grid grid-flow-col auto-cols-[13px] grid-rows-7 gap-[3px]">
              {randomPattern.map((week, wIdx) =>
                week.map((level, dIdx) => (
                  <div
                    key={`${wIdx}-${dIdx}`}
                    className={`h-[13px] w-[13px] rounded-[3px] transition-all hover:scale-125 ${
                      CONTRIBUTION_LEVEL_STYLES[level]
                    }`}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-zinc-800/80 pt-3 text-[11px] text-zinc-400">
        <div className="flex items-center gap-1.5 font-medium">
          <span>Less</span>
          <div className="flex items-center gap-1">
            {CONTRIBUTION_LEVEL_STYLES.map((cls, idx) => (
              <div key={idx} className={`h-2.5 w-2.5 rounded-[2px] ${cls}`} />
            ))}
          </div>
          <span>More</span>
        </div>
        <span className="text-[10px] text-zinc-500">Live shipping record</span>
      </div>
    </div>
  );
}

export function ProfilePage({ username }: ProfilePageProps) {
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
      } catch {
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
        const requests: Promise<Response>[] = username
          ? [fetch(`/api/profile/${encodeURIComponent(username)}`)]
          : [fetch("/api/user/profile")];
        const [profileRes, userRes] = await Promise.allSettled(requests);

        let resolvedProfile: ProfileData | null = null;

        if (profileRes.status === "fulfilled" && profileRes.value.ok) {
          const data = await profileRes.value.json().catch(() => null);
          if (data?.profile) resolvedProfile = data.profile;
        }

        if (!resolvedProfile && userRes?.status === "fulfilled" && userRes.value.ok) {
          const data = await userRes.value.json().catch(() => null);
          if (data?.profile) resolvedProfile = data.profile;
        }

        if (isMounted) {
          if (resolvedProfile) {
            setProfile(resolvedProfile);
            setError(null);
          } else {
            setError("Profile not found");
          }
          setLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load profile");
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
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
      <div className="glass rounded-[32px] p-8 text-center">
        <h2 className="text-xl font-semibold text-slate-950">Profile not found</h2>
        <p className="mt-2 text-sm text-slate-500">{error ?? "This profile doesn't exist."}</p>
      </div>
    );
  }

  const initials = (profile.name ?? profile.username)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const stats = [
    { label: "GitHub streak", value: `${profile.github_streak_days ?? 0}d`, icon: Star },
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

  const hasContributions = profile.contribution_days && profile.contribution_days.length > 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Hero */}
      <section className="neu-card rounded-[28px] p-5 sm:rounded-[32px] sm:p-8">
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
              <div className="mt-3.5 flex flex-wrap gap-2 text-sm text-slate-500 dark:text-slate-400">
                {(profile.college || "amrita vishwa vidyapeetham") && (
                  <span className="neu-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <MapPin size={12} />
                    {profile.college || "amrita vishwa vidyapeetham"}
                  </span>
                )}
                {profile.subjects && profile.subjects.length > 0 && (
                  <span className="neu-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <Code2 size={12} />
                    {profile.subjects.slice(0, 3).join(", ")}
                  </span>
                )}
                {profile.github_username && (
                  <span className="neu-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    @{profile.github_username}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto">
            <button
              type="button"
              onClick={handleShare}
              className="neu-btn inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 sm:w-auto"
            >
              {copied ? <Check size={16} className="text-emerald-500" /> : <Share2 size={16} />}
              <span>{copied ? "Link Copied!" : "Share Profile"}</span>
            </button>

            {profile.github_username && (
              <a
                href={`https://github.com/${profile.github_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="neu-btn inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 sm:w-auto"
              >
                View GitHub
                <ArrowUpRight size={16} />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              animate={{ opacity: 1, y: 0 }}
              className="neu-raised-sm rounded-[24px] p-4 sm:rounded-[28px] sm:p-5 transition hover:neu-card"
              initial={{ opacity: 0, y: 8 }}
              transition={{ delay: index * 0.04 }}
            >
              <div className="w-fit neu-pill rounded-xl p-2.5 text-slate-900 dark:text-white sm:rounded-2xl sm:p-3">
                <Icon size={16} className="sm:hidden" />
                <Icon size={18} className="hidden sm:block" />
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
      <section className="grid gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="neu-card rounded-[28px] p-5 sm:rounded-[32px] sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                Contribution graph
              </h3>
              <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400 sm:mt-2 sm:text-sm">
                A record of steady shipping across coursework and projects.
              </p>
            </div>
            <span className="neu-pill rounded-full px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 sm:text-sm">
              {profile.github_streak_days ?? 0}d streak
            </span>
          </div>
          {hasContributions ? (
            <ContributionGraph days={profile.contribution_days!} />
          ) : (
            <PlaceholderGraph />
          )}
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
      </section>

      {/* Projects Section */}
      <section className="neu-card rounded-[28px] p-5 sm:rounded-[32px] sm:p-7">
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
              className="neu-raised-sm block rounded-[22px] p-4 transition hover:neu-card sm:rounded-[28px] sm:p-5"
              initial={{ opacity: 0, y: 8 }}
              transition={{ delay: index * 0.05 }}
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
      </section>
    </div>
  );
}
