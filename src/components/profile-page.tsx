"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, BriefcaseBusiness, Code2, GitFork, MapPin, Sparkles, Star, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
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

// Map a contribution count to a slate tone index 0–4
function countToTone(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

function ContributionGraph({ days }: { days: ContributionDay[] }) {
  const tones = [
    "bg-slate-100",
    "bg-slate-200",
    "bg-slate-400",
    "bg-slate-600",
    "bg-slate-900",
  ];

  // days come in descending date order from the API — reverse to ascending
  const ascending = [...days].reverse();

  // Pad so the grid starts on a Sunday (column-flow grid needs full weeks)
  const firstDate = ascending[0]?.date ? new Date(ascending[0].date) : new Date();
  const dayOfWeek = firstDate.getDay(); // 0 = Sunday
  const padded: (ContributionDay | null)[] = [
    ...Array(dayOfWeek).fill(null),
    ...ascending,
  ];

  const totalContributions = days.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-0.5">
        <span>Less</span>
        <div className="flex gap-1">
          {tones.map((t) => (
            <div key={t} className={`h-2.5 w-2.5 rounded-[3px] ${t}`} />
          ))}
        </div>
        <span>More</span>
      </div>
      <div className="overflow-x-auto pb-1">
        <div
          className="grid grid-flow-col gap-1"
          style={{ gridTemplateRows: "repeat(7, minmax(0, 1fr))" }}
        >
          {padded.map((day, i) =>
            day === null ? (
              <div key={`pad-${i}`} className="h-3 w-3 rounded-[3px] opacity-0" />
            ) : (
              <div
                key={day.date}
                className={`h-3 w-3 rounded-[3px] border border-white ${tones[countToTone(day.count)]}`}
                title={`${day.date}: ${day.count} contribution${day.count !== 1 ? "s" : ""}`}
              />
            )
          )}
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        {totalContributions.toLocaleString()} contributions in the last 6 months
      </p>
    </div>
  );
}

// Fallback placeholder when no GitHub data is synced yet
function PlaceholderGraph() {
  const cells = Array.from({ length: 126 }, (_, i) => (i * 7 + i * i) % 5);
  const tones = ["bg-slate-100", "bg-slate-200", "bg-slate-300", "bg-slate-500", "bg-slate-900"];
  return (
    <div className="mt-5 overflow-x-auto pb-1">
      <div
        className="grid grid-flow-col gap-1 opacity-40"
        style={{ gridTemplateRows: "repeat(7, minmax(0, 1fr))" }}
      >
        {cells.map((v, i) => (
          <div key={i} className={`h-3 w-3 rounded-[3px] border border-white ${tones[v]}`} />
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-400">Start learning and completing tasks to build your activity graph.</p>
    </div>
  );
}

export function ProfilePage({ username }: ProfilePageProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    fetch(`/api/profile/${username}`)
      .then((r) => {
        if (!r.ok) throw new Error("Profile not found");
        return r.json();
      })
      .then((data) => setProfile(data.profile))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
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
    { label: "Health score", value: `${profile.github_health_score ?? 0}`, icon: GitFork },
    { label: "Tasks done", value: String(profile.completed_tasks), icon: Trophy },
    { label: "Semester", value: profile.semester ? `Sem ${profile.semester}` : "—", icon: BriefcaseBusiness },
  ];

  const recruiterBullets = profile.project_bullets ?? [];
  const hasContributions = profile.contribution_days && profile.contribution_days.length > 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Hero */}
      <section className="glass-strong rounded-[28px] p-5 sm:rounded-[32px] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-slate-950 text-xl font-semibold text-white sm:h-20 sm:w-20 sm:rounded-[24px] sm:text-2xl">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  {profile.name ?? profile.username}
                </h2>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium uppercase tracking-[0.12em] text-emerald-700">
                  Open to work
                </span>
              </div>
              {recruiterBullets.length > 0 && (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:leading-7">
                  {recruiterBullets[0]}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-500">
                {profile.college && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs">
                    <MapPin size={12} />
                    {profile.college}
                  </span>
                )}
                {profile.subjects && profile.subjects.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs">
                    <Code2 size={12} />
                    {profile.subjects.slice(0, 3).join(", ")}
                  </span>
                )}
                {profile.github_username && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs">
                    @{profile.github_username}
                  </span>
                )}
              </div>
            </div>
          </div>

          {profile.github_username && (
            <a
              href={`https://github.com/${profile.github_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
            >
              View GitHub
              <ArrowUpRight size={16} />
            </a>
          )}
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
              className="glass rounded-[24px] p-4 sm:rounded-[28px] sm:p-5"
              initial={{ opacity: 0, y: 8 }}
              transition={{ delay: index * 0.04 }}
            >
              <div className="w-fit rounded-xl bg-slate-100 p-2.5 text-slate-900 sm:rounded-2xl sm:p-3">
                <Icon size={16} className="sm:hidden" />
                <Icon size={18} className="hidden sm:block" />
              </div>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 sm:mt-5 sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-slate-500 sm:mt-2 sm:text-sm">{stat.label}</p>
            </motion.div>
          );
        })}
      </section>

      {/* Contribution graph + Recruiter snapshot */}
      <section className="grid gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="glass rounded-[28px] p-5 sm:rounded-[32px] sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-slate-950 sm:text-2xl">
                Contribution graph
              </h3>
              <p className="mt-1 text-xs text-slate-500 sm:mt-2 sm:text-sm">
                A record of steady shipping across coursework and projects.
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 sm:text-sm">
              {profile.github_streak_days ?? 0}d streak
            </span>
          </div>
          {hasContributions ? (
            <ContributionGraph days={profile.contribution_days!} />
          ) : (
            <PlaceholderGraph />
          )}
        </div>

        <div className="glass rounded-[28px] p-5 sm:rounded-[32px] sm:p-6">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-slate-100 p-2 text-slate-900 sm:rounded-2xl sm:p-2.5">
              <Sparkles size={15} />
            </div>
            <h3 className="text-base font-semibold tracking-tight text-slate-950 sm:text-xl">
              Recruiter snapshot
            </h3>
          </div>
          <div className="mt-4 space-y-2.5">
            {recruiterBullets.length > 0 ? (
              recruiterBullets.map((bullet) => (
                <div
                  key={bullet}
                  className="rounded-[18px] border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs leading-5 text-slate-600 sm:rounded-[22px] sm:px-4 sm:py-3 sm:text-sm sm:leading-6"
                >
                  {bullet}
                </div>
              ))
            ) : (
              <p className="rounded-[18px] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-xs leading-5 text-slate-500 sm:rounded-[22px] sm:text-sm sm:leading-6">
                Complete your profile to generate an AI recruiter snapshot.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Projects */}
      {profile.top_repos && profile.top_repos.length > 0 && (
        <section className="glass rounded-[28px] p-5 sm:rounded-[32px] sm:p-7">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-950 sm:text-2xl">Projects</h3>
            <p className="mt-1 text-xs text-slate-500 sm:mt-2 sm:text-sm">
              Focused summaries that read well in under thirty seconds.
            </p>
          </div>
          <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {profile.top_repos.slice(0, 3).map((repo, index) => (
              <motion.a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                animate={{ opacity: 1, y: 0 }}
                className="block rounded-[22px] border border-slate-200 bg-slate-50/80 p-4 transition hover:border-slate-300 hover:bg-white sm:rounded-[28px] sm:p-5"
                initial={{ opacity: 0, y: 8 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  Selected work
                </div>
                <h4 className="mt-3 text-base font-semibold text-slate-950 sm:mt-4">{repo.name}</h4>
                {repo.description && (
                  <p className="mt-2 text-xs leading-5 text-slate-600 line-clamp-2 sm:text-sm sm:leading-6">
                    {repo.description}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {repo.language && (
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {repo.language}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    <Star size={10} />
                    {repo.stars}
                  </span>
                </div>
              </motion.a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
