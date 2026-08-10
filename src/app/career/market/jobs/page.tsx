"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2, Briefcase, ArrowUpRight, Bookmark, Filter, X } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    role: "all",
    location: "all",
    experience: "all",
    matchScore: 0,
  });

  useEffect(() => {
    fetch("/api/career/market/jobs")
      .then((res) => res.json())
      .then((data) => setJobs(data.jobs ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const text = (j.title + " " + j.company + " " + j.location + " " + (j.tags ?? []).join(" ")).toLowerCase();

      if (filters.matchScore > 0 && j.matchScore < filters.matchScore) return false;

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
  }, [jobs, filters, searchQuery]);

  const saveJob = async (job: Job) => {
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
  const hasActiveFilters = filters.role !== "all" || filters.location !== "all" || filters.experience !== "all" || filters.matchScore > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-semibold flex items-center gap-3 mb-2">
          <Briefcase className="text-blue-400" size={28} />
          Job Market
        </h1>
        <p className="text-neutral-500 mb-6">
          Live jobs ranked by your skill match score
        </p>

        {/* ── Filter Bar ── */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={15} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Filter Jobs</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto flex items-center gap-1 text-xs text-blue-500 hover:underline"
              >
                <X size={12} /> Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-3 mb-3">
            <select
              value={filters.role}
              onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="all">All Roles</option>
              <option value="sde">Software Engineer</option>
              <option value="ml">ML / AI Engineer</option>
              <option value="data">Data Engineer / Scientist</option>
              <option value="frontend">Frontend Developer</option>
              <option value="backend">Backend Developer</option>
              <option value="fullstack">Full Stack Developer</option>
              <option value="devops">DevOps / Cloud</option>
              <option value="mobile">Mobile Developer</option>
            </select>

            <select
              value={filters.location}
              onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="all">All Locations</option>
              <option value="remote">Remote</option>
              <option value="bangalore">Bangalore</option>
              <option value="hyderabad">Hyderabad</option>
              <option value="mumbai">Mumbai</option>
              <option value="delhi">Delhi / NCR</option>
              <option value="chennai">Chennai</option>
              <option value="pune">Pune</option>
            </select>

            <select
              value={filters.experience}
              onChange={(e) => setFilters((f) => ({ ...f, experience: e.target.value }))}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="all">All Experience</option>
              <option value="intern">Internship</option>
              <option value="entry">Entry Level (0–2 yrs)</option>
              <option value="mid">Mid Level (2–5 yrs)</option>
            </select>

            <select
              value={filters.matchScore}
              onChange={(e) => setFilters((f) => ({ ...f, matchScore: Number(e.target.value) }))}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value={0}>Any Match %</option>
              <option value={50}>≥ 50% Match</option>
              <option value={70}>≥ 70% Match</option>
              <option value={80}>≥ 80% Match</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="Search by title, company, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700"
          />
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-xs text-slate-500">
            {filteredJobs.length} of {jobs.length} jobs
          </span>
        </div>

        {/* Job Cards */}
        <div className="space-y-3">
          {filteredJobs.map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl border border-slate-200 bg-white p-5 flex items-center gap-4 hover:border-indigo-300 transition"
            >
              {/* Match Score Ring */}
              <div className="shrink-0 relative w-14 h-14">
                <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="16" fill="none"
                    stroke={job.matchScore >= 80 ? "#10B981" : job.matchScore >= 50 ? "#F59E0B" : "#F43F5E"}
                    strokeWidth="3"
                    strokeDasharray={`${(job.matchScore / 100) * 100.5} 100.5`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-800">
                  {job.matchScore}%
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-slate-900">{job.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {job.company} · {job.location}
                </p>
                {job.salary && job.salary !== "Not disclosed" && (
                  <p className="text-xs text-emerald-600 mt-0.5">{job.salary}</p>
                )}
                {job.source && (
                  <span className="text-[10px] text-slate-400 mt-1 inline-block">via {job.source}</span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => saveJob(job)}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-500 hover:text-slate-900 transition"
                  title="Save"
                >
                  <Bookmark size={14} />
                </button>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-600 transition inline-flex items-center gap-1"
                >
                  Apply <ArrowUpRight size={12} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-16">
            <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">
              {jobs.length === 0
                ? "No jobs found. Upload your resume and set target roles first."
                : "No jobs match these filters. Try clearing some filters."}
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-3 text-sm text-indigo-500 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Tracker CTA */}
        <div className="mt-8">
          <a
            href="/career/market/tracker"
            className="inline-flex items-center gap-2 text-indigo-500 text-sm hover:text-indigo-400"
          >
            View Application Tracker →
          </a>
        </div>
      </div>
    </div>
  );
}
