"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Code2, ArrowRight } from "lucide-react";

export default function CodingConnectPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-semibold flex items-center gap-3 mb-2">
          <Code2 className="text-cyan-500 dark:text-cyan-400" size={28} />
          Connect Coding Profiles
        </h1>
        <p className="text-slate-500 dark:text-white/50 mb-8">
          Link your LeetCode and HackerRank accounts for personalized problem recommendations,
          skill-gap analysis, and a placement readiness score.
        </p>

        <div className="space-y-4">
          <PlatformLink
            href="/career/coding"
            title="LeetCode"
            description="Solved problems, contest rating, weak-topic analysis."
          />
          <PlatformLink
            href="/career/hackerrank"
            title="HackerRank"
            description="Badges, certifications, and skill scores."
          />
        </div>
      </div>
    </div>
  );
}

function PlatformLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Link
        href={href}
        className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 transition hover:bg-slate-100 dark:hover:bg-white/10"
      >
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-white/50">{description}</p>
        </div>
        <ArrowRight size={20} className="shrink-0 text-slate-400 dark:text-white/40" />
      </Link>
    </motion.div>
  );
}
