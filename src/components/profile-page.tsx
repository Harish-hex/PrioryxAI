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
  total_tasks: number;
  completed_tasks: number;
}

interface ProfilePageProps {
  username: string;
}

function ContributionGraph() {
  const cells = Array.from({ length: 126 }, (_, index) => (index * 7 + index * index) % 5);
  const tones = ["bg-slate-100", "bg-slate-200", "bg-slate-300", "bg-slate-500", "bg-slate-900"];

  return (
    <div className="mt-6 overflow-x-auto pb-2">
      <div className="grid min-w-[760px] grid-flow-col grid-rows-7 gap-1.5">
        {cells.map((value, index) => (
          <div
            key={`${index}-${value}`}
            className={`h-3.5 w-3.5 rounded-[4px] border border-white ${tones[value]}`}
            title={`${value + 1} contributions`}
          />
        ))}
      </div>
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
          <LoadingLine className="h-24 w-24 rounded-[28px]" />
          <LoadingLine className="h-8 w-64" />
          <LoadingLine className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass rounded-[28px] p-5 space-y-4">
              <LoadingLine className="h-10 w-10 rounded-2xl" />
              <LoadingLine className="h-8 w-20" />
              <LoadingLine className="h-4 w-28" />
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

  return (
    <div className="space-y-6">
      {/* Hero section */}
      <section className="glass-strong rounded-[32px] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[28px] bg-slate-950 text-3xl font-semibold text-white">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                  {profile.name ?? profile.username}
                </h2>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-emerald-700">
                  Open to internships
                </span>
              </div>
              {recruiterBullets.length > 0 && (
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-[15px]">
                  {recruiterBullets[0]}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2.5 text-sm text-slate-500">
                {profile.college && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                    <MapPin size={14} />
                    {profile.college}
                  </span>
                )}
                {profile.subjects && profile.subjects.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                    <Code2 size={14} />
                    {profile.subjects.slice(0, 3).join(", ")}
                  </span>
                )}
                {profile.github_username && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
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
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              View GitHub
              <ArrowUpRight size={16} />
            </a>
          )}
        </div>
      </section>

      {/* Stats grid */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-[28px] p-5"
              initial={{ opacity: 0, y: 8 }}
              transition={{ delay: index * 0.04 }}
            >
              <div className="w-fit rounded-2xl bg-slate-100 p-3 text-slate-900">
                <Icon size={18} />
              </div>
              <p className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
              <p className="mt-2 text-sm text-slate-500">{stat.label}</p>
            </motion.div>
          );
        })}
      </section>

      {/* Contribution graph + Recruiter snapshot */}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="glass rounded-[32px] p-6 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight text-slate-950">Contribution graph</h3>
              <p className="mt-2 text-sm text-slate-500">A record of steady shipping across coursework and projects.</p>
            </div>
            <p className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-500">
              {profile.github_streak_days ?? 0}d streak
            </p>
          </div>
          <ContributionGraph />
        </div>

        <div className="glass rounded-[32px] p-6">
          <div className="flex items-center gap-2.5">
            <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-900">
              <Sparkles size={16} />
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-slate-950">Recruiter snapshot</h3>
          </div>
          <div className="mt-5 space-y-3">
            {recruiterBullets.length > 0 ? (
              recruiterBullets.map((bullet) => (
                <div
                  key={bullet}
                  className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600"
                >
                  {bullet}
                </div>
              ))
            ) : (
              <p className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-500">
                Complete your profile to generate an AI recruiter snapshot.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Top repos / projects */}
      {profile.top_repos && profile.top_repos.length > 0 && (
        <section className="glass rounded-[32px] p-6 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight text-slate-950">Projects</h3>
              <p className="mt-2 text-sm text-slate-500">Focused summaries that read well in under thirty seconds.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {profile.top_repos.slice(0, 3).map((repo, index) => (
              <motion.a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                animate={{ opacity: 1, y: 0 }}
                className="block rounded-[28px] border border-slate-200 bg-slate-50/80 p-5 transition hover:border-slate-300 hover:bg-white"
                initial={{ opacity: 0, y: 8 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  Selected work
                </div>
                <h4 className="mt-4 text-lg font-semibold text-slate-950">{repo.name}</h4>
                {repo.description && (
                  <p className="mt-3 text-sm leading-7 text-slate-600 line-clamp-2">{repo.description}</p>
                )}
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {repo.language && (
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                      {repo.language}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                    <Star size={11} />
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
