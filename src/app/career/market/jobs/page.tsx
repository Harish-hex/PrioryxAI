"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Loader2, Briefcase, ArrowUpRight, Bookmark, Filter, X, Search, Check, Sparkles, Lock } from "lucide-react";
import { PricingModal } from "@/components/pricing-modal";

const FREE_JOB_LIMIT = 3;

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  url: string;
  matchScore: number;
  postedAt: string;
  tags?: string[];
  source?: string;
}

const ROLE_KEYWORDS: Record<string, string[]> = {
  sde:       ['software engineer', 'sde', 'software developer', 'software development'],
  ml:        ['machine learning', 'ml engineer', 'ai engineer', 'deep learning', 'nlp'],
  data:      ['data engineer', 'data scientist', 'data analyst', 'data science'],
  frontend:  ['frontend', 'front-end', 'react developer', 'vue', 'angular'],
  backend:   ['backend', 'back-end', 'node.js', 'django', 'java developer'],
  fullstack: ['full stack', 'fullstack', 'mern', 'mean stack'],
  devops:    ['devops', 'cloud', 'kubernetes', 'aws', 'infrastructure', 'sre'],
  mobile:    ['android', 'ios', 'flutter', 'react native', 'mobile developer'],
};

const LOC_KEYWORDS: Record<string, string[]> = {
  remote:    ['remote'],
  bangalore: ['bangalore', 'bengaluru', 'blr'],
  hyderabad: ['hyderabad', 'hyd'],
  mumbai:    ['mumbai', 'bombay'],
  delhi:     ['delhi', 'ncr', 'gurgaon', 'noida', 'gurugram'],
  chennai:   ['chennai', 'madras'],
  pune:      ['pune'],
};

export default function JobMarketPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    role: "all",
    location: "all",
    experience: "all",
    // Default to strong matches only (>=70%) — the "Any Match %" option is
    // still available for a user who wants to see the full unfiltered list.
    matchScore: 70,
  });

  useEffect(() => {
    fetch("/api/career/market/jobs")
      .then((res) => res.json())
      .then((data) => setJobs(data.jobs ?? []))
      .finally(() => setLoading(false));

    fetch("/api/user/status")
      .then((r) => r.json())
      .then((d) => {
        const active = Boolean(d?.pro_status) && (!d?.pro_expires_at || new Date(d.pro_expires_at) > new Date());
        setIsPro(active);
      })
      .catch(() => setIsPro(false));
  }, []);

  const applyFilters = (jobList: Job[], ignoreMatchScore: boolean) => {
    return jobList.filter((j) => {
      const text = (j.title + " " + j.company + " " + j.location + " " + (j.tags ?? []).join(" ")).toLowerCase();

      if (!ignoreMatchScore && filters.matchScore > 0 && j.matchScore < filters.matchScore) return false;

      if (filters.role !== "all") {
        const kws = ROLE_KEYWORDS[filters.role] ?? [];
        if (!kws.some((kw) => text.includes(kw))) return false;
      }

      if (filters.location !== "all") {
        const kws = LOC_KEYWORDS[filters.location] ?? [];
        if (!kws.some((kw) => text.includes(kw))) return false;
      }

      if (filters.experience !== "all") {
        if (filters.experience === "intern" && !text.includes("intern")) return false;
        if (filters.experience === "entry" && text.includes("senior")) return false;
        if (filters.experience === "mid" && text.includes("intern")) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!j.title.toLowerCase().includes(q) &&
            !j.company.toLowerCase().includes(q) &&
            !j.location.toLowerCase().includes(q)) return false;
      }

      return true;
    });
  };

  const strictFiltered = useMemo(() => applyFilters(jobs, false), [jobs, filters, searchQuery]);

  // Never show a flat blank page just because nothing cleared the match-score
  // floor — that's a filter setting, not "there are no jobs." If relaxing
  // only the match-score requirement (role/location/experience/search still
  // apply) turns up real jobs, show the closest ones instead, clearly
  // labeled as below the requested threshold rather than presented as if
  // they cleared it.
  const usingFallback = strictFiltered.length === 0 && filters.matchScore > 0;
  const fallbackJobs = useMemo(() => {
    if (!usingFallback) return [];
    return [...applyFilters(jobs, true)].sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
  }, [usingFallback, jobs, filters, searchQuery]);

  const filteredJobs = usingFallback ? fallbackJobs : strictFiltered;
  const visibleJobs = isPro ? filteredJobs : filteredJobs.slice(0, FREE_JOB_LIMIT);
  const lockedJobs = isPro ? [] : filteredJobs.slice(FREE_JOB_LIMIT);
  const lockedJobCount = lockedJobs.length;

  const saveJob = async (job: Job) => {
    setSavedIds(prev => new Set(prev).add(job.id));
    await fetch("/api/career/market/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobTitle: job.title,
        company: job.company,
        jdUrl: job.url,
        matchScore: job.matchScore,
      }),
    });
  };

  const clearFilters = () => setFilters({ role: "all", location: "all", experience: "all", matchScore: 0 });
  const hasActiveFilters = filters.role !== "all" || filters.location !== "all" || filters.experience !== "all" || filters.matchScore > 0 || !!searchQuery;

  if (loading) {
    return (
      <div className="neu-card rounded-[28px] p-12 flex flex-col items-center justify-center text-center space-y-4">
        <Loader2 size={32} className="animate-spin text-cyan-500" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Matching live tech jobs with your skills...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="neu-card rounded-[28px] p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
              <img src="/logo.png" alt="PrioryxAI" className="h-4 w-4 shrink-0 object-contain" />
              <span>AI Career Guidance</span>
            </div>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Job Market
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Live developer openings ranked in real time by your resume skill compatibility score.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/career/market/tracker"
              className="neu-btn inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <span>Application Tracker</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* Filter & Search Bar */}
      <div className="neu-card sticky top-2 z-10 rounded-[28px] p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Filter size={15} className="text-cyan-500" />
            <span>Search & Filter Openings</span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="neu-btn inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <X size={12} /> Clear all
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <select
            value={filters.role}
            onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))}
            aria-label="Filter by Role"
            className="neu-inset rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-transparent outline-none cursor-pointer"
          >
            <option value="all" className="dark:bg-slate-900">All Roles</option>
            <option value="sde" className="dark:bg-slate-900">Software Engineer</option>
            <option value="ml" className="dark:bg-slate-900">ML / AI Engineer</option>
            <option value="data" className="dark:bg-slate-900">Data Engineer</option>
            <option value="frontend" className="dark:bg-slate-900">Frontend Developer</option>
            <option value="backend" className="dark:bg-slate-900">Backend Developer</option>
            <option value="fullstack" className="dark:bg-slate-900">Full Stack Developer</option>
            <option value="devops" className="dark:bg-slate-900">DevOps / Cloud</option>
            <option value="mobile" className="dark:bg-slate-900">Mobile Developer</option>
          </select>

          <select
            value={filters.location}
            onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
            aria-label="Filter by Location"
            className="neu-inset rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-transparent outline-none cursor-pointer"
          >
            <option value="all" className="dark:bg-slate-900">All Locations</option>
            <option value="remote" className="dark:bg-slate-900">Remote</option>
            <option value="bangalore" className="dark:bg-slate-900">Bangalore</option>
            <option value="hyderabad" className="dark:bg-slate-900">Hyderabad</option>
            <option value="mumbai" className="dark:bg-slate-900">Mumbai</option>
            <option value="delhi" className="dark:bg-slate-900">Delhi / NCR</option>
            <option value="chennai" className="dark:bg-slate-900">Chennai</option>
            <option value="pune" className="dark:bg-slate-900">Pune</option>
          </select>

          <select
            value={filters.experience}
            onChange={(e) => setFilters((f) => ({ ...f, experience: e.target.value }))}
            aria-label="Filter by Experience"
            className="neu-inset rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-transparent outline-none cursor-pointer"
          >
            <option value="all" className="dark:bg-slate-900">All Experience</option>
            <option value="intern" className="dark:bg-slate-900">Internship</option>
            <option value="entry" className="dark:bg-slate-900">Entry Level (0–2 yrs)</option>
            <option value="mid" className="dark:bg-slate-900">Mid Level (2–5 yrs)</option>
          </select>

          <select
            value={filters.matchScore}
            onChange={(e) => setFilters((f) => ({ ...f, matchScore: Number(e.target.value) }))}
            aria-label="Filter by Match Score"
            className="neu-inset rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-transparent outline-none cursor-pointer"
          >
            <option value={0} className="dark:bg-slate-900">Any Match %</option>
            <option value={50} className="dark:bg-slate-900">≥ 50% Match</option>
            <option value={70} className="dark:bg-slate-900">≥ 70% Match</option>
            <option value={80} className="dark:bg-slate-900">≥ 80% Match</option>
          </select>
        </div>

        {/* Search Bar */}
        <div className="neu-inset rounded-2xl p-1.5 flex items-center gap-2">
          <Search size={15} className="ml-2.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by title, company, or tech stack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent px-2 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
        <span>
          Showing {visibleJobs.length} of {filteredJobs.length} jobs
          {filters.matchScore > 0 && !usingFallback && <> · {filters.matchScore}%+ profile match</>}
          {usingFallback && <> · closest matches (below {filters.matchScore}%)</>}
        </span>
      </div>

      {usingFallback && filteredJobs.length > 0 && (
        <div className="rounded-2xl border border-amber-300/40 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/25 px-4 py-3 text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3">
          <span>No jobs cleared your {filters.matchScore}% match filter right now — showing your closest matches instead.</span>
          <button
            onClick={() => setFilters((f) => ({ ...f, matchScore: 0 }))}
            className="shrink-0 underline hover:no-underline"
          >
            Show all jobs
          </button>
        </div>
      )}

      {/* Job Cards List */}
      <div className="space-y-3.5">
        {visibleJobs.map((job, i) => {
          const isSaved = savedIds.has(job.id);
          const scoreColor = job.matchScore >= 80 ? '#10b981' : job.matchScore >= 50 ? '#f59e0b' : '#f43f5e';

          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 15) * 0.02, duration: 0.3 }}
              whileHover={{ y: -2 }}
              className="neu-card rounded-[24px] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-shadow hover:shadow-lg"
            >
              <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                {/* Match Score Ring */}
                <div className="shrink-0 relative w-12 h-12">
                  <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" className="text-slate-200/80 dark:text-white/10" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="16" fill="none"
                      stroke={scoreColor}
                      strokeWidth="3"
                      strokeDasharray={`${(job.matchScore / 100) * 100.5} 100.5`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-slate-900 dark:text-white">
                    {job.matchScore}%
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-slate-950 dark:text-white truncate">
                    {job.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{job.company}</span>
                    <span>•</span>
                    <span>{job.location}</span>
                    {job.salary && job.salary !== "Not disclosed" && (
                      <>
                        <span>•</span>
                        <span className="neu-pill rounded-full px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          {job.salary}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                <button
                  onClick={() => saveJob(job)}
                  className={`neu-btn p-2.5 rounded-xl transition ${isSaved ? 'text-cyan-500' : 'text-slate-500'}`}
                  title={isSaved ? "Saved" : "Save Job"}
                >
                  {isSaved ? <Check size={14} /> : <Bookmark size={14} />}
                </button>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neu-btn inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                >
                  <span>Apply</span>
                  <ArrowUpRight size={13} />
                </a>
              </div>
            </motion.div>
          );
        })}

        {/* Blurred Locked Job Cards for Free Tier */}
        {!isPro && lockedJobs.slice(0, 3).map((job, idx) => (
          <div
            key={`locked-${job.id || idx}`}
            className="neu-card relative overflow-hidden rounded-[24px] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 select-none opacity-85"
          >
            <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0 filter blur-[6px]">
              <div className="shrink-0 w-12 h-12 rounded-full bg-slate-200/80 dark:bg-slate-800/80" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded-md w-56" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-36" />
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 dark:bg-black/40 backdrop-blur-[2px]">
              <button
                type="button"
                onClick={() => setPricingOpen(true)}
                className="neu-btn inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-lg"
              >
                <Lock size={13} className="text-amber-400" />
                <span>Unlock with Subscription</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Unlock wall — free users see only the top FREE_JOB_LIMIT matches */}
      {lockedJobCount > 0 && (
        <div className="neu-card rounded-[28px] p-8 text-center space-y-4">
          <div className="neu-pill-inset mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-amber-500">
            <Lock size={26} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">
              {lockedJobCount} more matching {lockedJobCount === 1 ? "job" : "jobs"} locked
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Free plan shows your top {FREE_JOB_LIMIT} matches. Upgrade to Pro to unlock every matching job and apply directly.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPricingOpen(true)}
            className="neu-btn inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          >
            <Lock size={14} className="text-amber-400" />
            <span>Unlock with Subscription</span>
          </button>
        </div>
      )}

      {filteredJobs.length === 0 && (
        <div className="neu-card rounded-[28px] p-10 md:p-14 text-center space-y-4 max-w-xl mx-auto">
          <div className="neu-pill-inset h-16 w-16 rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
            <Briefcase size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">
            {jobs.length === 0 ? "No jobs available right now" : "No jobs match your criteria"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {jobs.length === 0
              ? "Live job sources didn't return results just now — try again shortly."
              : "Try adjusting your role, location, or experience filters to view more opportunities."}
          </p>
          <div className="pt-2">
            <button
              onClick={clearFilters}
              className="neu-btn inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      )}

      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} isPro={isPro} />
    </div>
  );
}
