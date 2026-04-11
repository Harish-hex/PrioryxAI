"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, BriefcaseBusiness, Code2, GitFork, MapPin, Star, Trophy } from "lucide-react";
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
      <div className="space-y-5">
        <div className="glass-strong rounded-lg p-5 sm:p-6 space-y-4">
          <LoadingLine className="h-24 w-24 rounded-lg" />
          <LoadingLine className="h-8 w-64" />
          <LoadingLine className="h-4 w-96" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="glass rounded-lg p-8 text-center">
        <h2 className="text-xl font-semibold text-white">Profile not found</h2>
        <p className="mt-2 text-sm text-neutral-400">{error ?? "This profile doesn't exist."}</p>
      </div>
    );
  }

  const stats = [
    { label: "GitHub streak", value: `${profile.github_streak_days ?? 0}d`, icon: Star },
    { label: "Health score", value: `${profile.github_health_score ?? 0}`, icon: GitFork },
    { label: "Tasks done", value: String(profile.completed_tasks), icon: Trophy },
    { label: "Semester", value: profile.semester ? `Sem ${profile.semester}` : "—", icon: BriefcaseBusiness },
  ];

  return (
    <div className="space-y-5">
      <section className="glass-strong rounded-lg p-5 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-4xl font-bold text-white">
              {(profile.name ?? profile.username).charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-3xl font-semibold text-white">{profile.name ?? profile.username}</h2>
                <span className="rounded-lg border border-mint/20 bg-mint/10 px-2.5 py-1 text-xs text-mint">
                  @{profile.username}
                </span>
              </div>
              {profile.project_bullets && profile.project_bullets.length > 0 && (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
                  {profile.project_bullets[0]}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-neutral-500">
                {profile.college && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={15} />
                    {profile.college}
                  </span>
                )}
                {profile.subjects && profile.subjects.length > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Code2 size={15} />
                    {profile.subjects.slice(0, 3).join(", ")}
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
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.02]"
            >
              GitHub
              <ArrowUpRight size={16} />
            </a>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-lg p-4"
              initial={{ opacity: 0, y: 8 }}
              transition={{ delay: index * 0.04 }}
              whileHover={{ scale: 1.012 }}
            >
              <Icon size={18} className="text-volt" />
              <p className="mt-4 text-2xl font-semibold text-white">{stat.value}</p>
              <p className="mt-1 text-sm text-neutral-500">{stat.label}</p>
            </motion.div>
          );
        })}
      </section>

      {profile.top_repos && profile.top_repos.length > 0 && (
        <section>
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-white">Top Repos</h3>
            <p className="mt-1 text-sm text-neutral-500">Pinned GitHub projects.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {profile.top_repos.slice(0, 3).map((repo, index) => (
              <motion.a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                animate={{ opacity: 1, y: 0 }}
                className="glass overflow-hidden rounded-lg p-4 transition hover:border-white/20 hover:shadow-glow block"
                initial={{ opacity: 0, y: 8 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
              >
                <h4 className="text-base font-semibold text-white">{repo.name}</h4>
                {repo.description && (
                  <p className="mt-2 text-sm leading-6 text-neutral-400 line-clamp-2">{repo.description}</p>
                )}
                <div className="mt-4 flex items-center gap-3 text-xs text-neutral-500">
                  {repo.language && <span>{repo.language}</span>}
                  <span className="flex items-center gap-1"><Star size={12} /> {repo.stars}</span>
                </div>
              </motion.a>
            ))}
          </div>
        </section>
      )}

      {profile.project_bullets && profile.project_bullets.length > 1 && (
        <section className="glass rounded-lg p-5">
          <h3 className="text-xl font-semibold text-white">AI Highlights</h3>
          <div className="mt-4 space-y-2">
            {profile.project_bullets.map((bullet) => (
              <div key={bullet} className="rounded-lg border border-white/10 bg-black/25 p-3 text-sm text-neutral-300">
                {bullet}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
