"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Briefcase,
  Check,
  CreditCard,
  GitBranch,
  Gem,
  ImagePlus,
  Lock,
  Mail,
  Target,
  Zap,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import LogoLoop from "./LogoLoop";
import WavesBackground from "@/components/ui/waves-background";

function fadeUpVariant(i = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as const },
  };
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "Is my data safe?",
      a: "Yes, absolutely. We use Supabase with Row Level Security (RLS) to ensure your data is encrypted and only accessible by you. We only read the GitHub data you explicitly authorize.",
    },
    {
      q: "Does the timetable scanner work with handwritten notes?",
      a: "Our scanner works best with printed or digital timetables (PDF/screenshots). While it can read neat handwritten notes using GPT-4o Vision, we recommend verifying the extracted dates for accuracy.",
    },
    {
      q: "How is the 'career impact' score calculated?",
      a: "The AI evaluates the weightage of the task (e.g., end-semester exam vs. simple assignment) against your stated career goals (e.g., aiming for SDE roles), combining urgency and relevance into a single priority score.",
    },
  ];

  return (
    <div className="app-background min-h-screen overflow-x-hidden text-slate-950 dark:text-slate-100">
      <WavesBackground />
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-white/20 bg-white/60 dark:bg-[#02161f]/75 backdrop-blur-2xl shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="PrioryxAI Logo" className="h-8 w-8 object-contain" />
            <span className="text-sm font-bold text-slate-950 dark:text-white">PrioryxAI</span>
          </a>
          <div className="hidden items-center gap-6 text-sm font-semibold text-slate-800 dark:text-slate-200 sm:flex">
            <a href="#features" className="transition hover:text-slate-950 dark:hover:text-white">Features</a>
            <a href="#how-it-works" className="transition hover:text-slate-950 dark:hover:text-white">How it works</a>
            <a href="#pricing" className="transition hover:text-slate-950 dark:hover:text-white">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="rounded-xl border border-white/40 bg-white/60 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-white/90 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 shadow-sm"
            >
              Sign in
            </a>
            <a
              href="/login"
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:scale-[1.02] hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-md"
            >
              Get started free
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="mx-auto flex min-h-[calc(100vh-76px)] max-w-7xl flex-col items-center justify-center px-5 py-20 text-center">
        <motion.h1
          {...fadeUpVariant(0)}
          className="mx-auto max-w-4xl text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-950 dark:text-white sm:text-6xl lg:text-7xl drop-shadow-sm"
        >
          Your academic &amp;{" "}
          <span className="bg-gradient-to-r from-aura to-volt bg-clip-text text-transparent">
            career
          </span>{" "}
          <span className="bg-gradient-to-r from-volt to-mint bg-clip-text text-transparent">
            command center.
          </span>
        </motion.h1>

        <motion.p
          {...fadeUpVariant(1)}
          className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-800 dark:text-slate-100"
        >
          Connect GitHub, upload your timetable, and let PrioryxAI rank your
          next high-leverage move — exam, internship, or project — in one feed.
        </motion.p>

        <motion.div
          {...fadeUpVariant(2)}
          className="glass-card mt-6 inline-flex items-center px-4 py-1.5 text-xs font-bold text-slate-950 dark:text-white border-white/40 shadow-sm"
        >
          Built for Indian engineering students
        </motion.div>

        <motion.div
          {...fadeUpVariant(3)}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <a
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-7 py-3.5 text-sm font-bold text-white shadow-xl transition hover:scale-[1.03] hover:bg-slate-800 dark:bg-white dark:text-slate-950"
          >
            Get started free <ArrowRight size={16} />
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-xl glass-card px-7 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-white/40 dark:text-white dark:hover:bg-white/15 shadow-lg"
          >
            See how it works
          </a>
        </motion.div>

        {/* Trust row */}
        <motion.div
          {...fadeUpVariant(4)}
          className="mt-12 w-full max-w-3xl overflow-hidden text-xs font-semibold text-slate-700 dark:text-slate-200"
        >
          <LogoLoop
            logos={[
              { node: <span className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-white/30 bg-white/40 px-3 py-1.5 backdrop-blur-md dark:border-white/10 dark:bg-white/10 text-slate-800 dark:text-slate-100"><Lock size={13} className="text-volt" /> Secure — HTTPS + Supabase RLS</span> },
              { node: <span className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-white/30 bg-white/40 px-3 py-1.5 backdrop-blur-md dark:border-white/10 dark:bg-white/10 text-slate-800 dark:text-slate-100"><CreditCard size={13} className="text-mint" /> Payments via Razorpay</span> },
              { node: <span className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-white/30 bg-white/40 px-3 py-1.5 backdrop-blur-md dark:border-white/10 dark:bg-white/10 text-slate-800 dark:text-slate-100"><GitBranch size={13} className="text-aura" /> GitHub OAuth</span> },
              { node: <span className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-white/30 bg-white/40 px-3 py-1.5 backdrop-blur-md dark:border-white/10 dark:bg-white/10 text-slate-800 dark:text-slate-100"><Mail size={13} className="text-volt" /> Google OAuth</span> },
            ]}
            speed={40}
            direction="left"
            gap={28}
            fadeOut
          />
        </motion.div>
      </section>

      {/* ── Product preview (dashboard mockup) ── */}
      <section className="mx-auto max-w-7xl px-5 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card p-1.5 sm:p-2.5 shadow-[0_24px_80px_rgba(0,0,0,0.16)] rounded-[24px]"
        >
          <div className="rounded-[18px] border border-white/30 bg-white/50 dark:bg-slate-950/60 backdrop-blur-2xl overflow-hidden">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 border-b border-white/20 bg-white/40 dark:bg-white/5 px-4 py-3 backdrop-blur-md">
              <span className="h-3 w-3 rounded-full bg-rose-500/80 shadow-sm" />
              <span className="h-3 w-3 rounded-full bg-amber-400/80 shadow-sm" />
              <span className="h-3 w-3 rounded-full bg-emerald-400/80 shadow-sm" />
              <div className="ml-4 flex-1 rounded-lg border border-white/30 bg-white/60 dark:bg-white/10 px-3 py-1 text-center text-xs font-medium text-slate-700 dark:text-slate-200">
                prioryxai.in/feed
              </div>
            </div>
            {/* Dashboard preview */}
            <div className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_260px]">
              {/* Next move card */}
              <div className="space-y-4">
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/40 bg-white/70 dark:bg-white/10 dark:border-white/10 px-3 py-1 text-xs font-bold text-slate-900 dark:text-white">
                      <Zap size={12} className="text-volt" /> Next Move Card
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg border border-mint/30 bg-mint/15 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-mint">
                      AI ranked
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Do this next</p>
                  <h3 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">Complete DBMS Assignment — Chapter 7 Normalization</h3>
                  <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">Due tomorrow · 2h estimated · High weightage (40%)</p>
                  <div className="mt-4 flex gap-2">
                    <span className="rounded-lg border border-rose-400/30 bg-rose-500/15 px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-300">Urgent</span>
                    <span className="rounded-lg border border-white/40 bg-white/70 dark:bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200">assignment</span>
                  </div>
                </div>
                {/* Feed tasks */}
                <div className="space-y-2.5">
                  {[
                    { dot: "bg-amber-400", title: "Internship application — Zomato SDE Intern", sub: "Matched on React + TypeScript · ₹25,000/mo · 3 days left" },
                    { dot: "bg-emerald-400", title: "Push ML project to GitHub before recruiter review", sub: "GitHub streak: 14d · health score 78/100" },
                    { dot: "bg-cyan-400", title: "OS exam — Memory Management chapter", sub: "Wed, Apr 16 · 3h estimated" },
                  ].map(({ dot, title, sub }) => (
                    <div key={title} className="glass-card flex items-start gap-3 px-4 py-3">
                      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dot} shadow-sm`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-950 dark:text-white">{title}</p>
                        <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Right stats */}
              <div className="space-y-3">
                <div className="glass-card p-4">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">This week</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[["Pending", "8"], ["Done", "5"], ["Overdue", "1"], ["Streak", "14d"]].map(([l, v]) => (
                      <div key={l} className="rounded-xl border border-white/30 bg-white/60 dark:bg-white/10 p-2.5">
                        <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">{l}</p>
                        <p className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">GitHub health</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-950 dark:text-white">78<span className="text-sm font-semibold text-slate-600 dark:text-slate-300">/100</span></p>
                  <div className="mt-2.5 h-2 rounded-full bg-white/40 dark:bg-white/10 overflow-hidden">
                    <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-aura via-volt to-mint" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Value proposition ── */}
      <section className="mx-auto max-w-7xl px-5 pb-24 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300"
        >
          Why PrioryxAI
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mx-auto mt-4 max-w-3xl text-3xl font-extrabold text-slate-950 dark:text-white sm:text-4xl drop-shadow-sm"
        >
          Stop juggling five apps. One feed tells you what to do next.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="mx-auto mt-4 max-w-2xl text-base font-medium leading-7 text-slate-800 dark:text-slate-100"
        >
          Most students keep exam dates in one place, internship deadlines in another, GitHub in a third. PrioryxAI pulls everything into a single AI-ranked priority feed — so you always know the highest-leverage move right now, not tomorrow.
        </motion.p>
      </section>

      {/* ── Features ── */}
      <section id="features" className="mx-auto max-w-7xl px-5 pb-28">
        <div className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Features</p>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-950 dark:text-white sm:text-4xl">Everything you need, nothing you don&apos;t</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Zap,
              color: "text-volt border-volt/30 bg-volt/15",
              title: "AI-ranked priority feed",
              desc: "Every exam, assignment, and internship deadline scored by urgency × career impact. The most important thing is always first.",
            },
            {
              icon: GitBranch,
              color: "text-mint border-mint/30 bg-mint/15",
              title: "GitHub sync & insights",
              desc: "Connect once. PrioryxAI tracks your streak, health score, and top languages — and surfaces which repo to push before a recruiter looks.",
            },
            {
              icon: ImagePlus,
              color: "text-aura border-aura/30 bg-aura/15",
              title: "Timetable scanner",
              desc: "Photograph your printed timetable or whiteboard. PrioryxAI reads dates with GPT-4o Vision and adds every exam to your feed automatically.",
            },
            {
              icon: Briefcase,
              color: "text-volt border-volt/30 bg-volt/15",
              title: "Matched internship openings",
              desc: "Based on your GitHub languages and subjects, we surface live Internshala listings with stipend, deadline, and matching skills highlighted.",
            },
            {
              icon: Bot,
              color: "text-mint border-mint/30 bg-mint/15",
              title: "Context-aware AI assistant",
              desc: "Ask how to plan the next 3 hours, which task has the highest career impact, or get a study schedule — the AI already knows your deadlines.",
            },
            {
              icon: Target,
              color: "text-aura border-aura/30 bg-aura/15",
              title: "Recruiter-ready profile",
              desc: "A public profile page that turns your GitHub repos and completed tasks into clean project bullets — built for fast recruiter scanning.",
            },
          ].map(({ icon: Icon, color, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="glass-card rounded-[22px] p-6 hover:-translate-y-1.5 transition-all duration-300 shadow-xl"
            >
              <div className={`inline-flex rounded-xl border p-2.5 ${color} backdrop-blur-md shadow-sm`}>
                <Icon size={18} />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-950 dark:text-white">{title}</h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-200">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-5 pb-28">
        <div className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">How it works</p>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-950 dark:text-white sm:text-4xl">Up and running in 3 minutes</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Sign in with GitHub or Google",
              desc: "One click — no manual setup. PrioryxAI immediately pulls your repos, languages, and contribution streak.",
              cta: null,
            },
            {
              step: "02",
              title: "Add deadlines or upload your timetable",
              desc: "Type \"DBMS exam Friday\" or photograph your printed timetable. AI extracts and scores every date in seconds.",
              cta: null,
            },
            {
              step: "03",
              title: "Get your ranked next move",
              desc: "Your feed shows the single highest-leverage task right now — based on urgency, career impact, and your current load.",
              cta: null,
            },
          ].map(({ step, title, desc }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="glass-card relative rounded-[24px] p-7 shadow-xl"
            >
              <span className="text-5xl font-black text-slate-900/15 dark:text-white/20 select-none">{step}</span>
              <h3 className="mt-3 text-lg font-bold text-slate-950 dark:text-white">{title}</h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-200">{desc}</p>
              {i < 2 && (
                <ArrowRight
                  size={22}
                  className="absolute -right-3.5 top-1/2 hidden -translate-y-1/2 text-slate-700 dark:text-slate-200 sm:block drop-shadow"
                />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="mx-auto max-w-7xl px-5 pb-28">
        <div className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Pricing</p>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-950 dark:text-white sm:text-4xl">Simple. No surprises.</h2>
          <p className="mt-3 text-base font-medium text-slate-800 dark:text-slate-100">Start free. Upgrade when the feed starts changing your semester.</p>
        </div>
        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="glass-card rounded-[28px] p-7 shadow-xl"
          >
            <h3 className="text-xl font-bold text-slate-950 dark:text-white">Free</h3>
            <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">For getting started</p>
            <div className="mt-5 flex items-end gap-1">
              <span className="text-4xl font-black text-slate-950 dark:text-white">₹0</span>
              <span className="pb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">/month</span>
            </div>
            <ul className="mt-6 space-y-3">
              {[
                "25 AI-ranked tasks",
                "5 AI assistant messages/day",
                "3 timetable scans/day",
                "GitHub sync (one-time)",
                "Public profile page",
                "Basic stats",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-100">
                  <Check size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" /> {f}
                </li>
              ))}
            </ul>
            <a
              href="/login"
              className="glass-card mt-8 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-white/40 dark:text-white dark:hover:bg-white/15 shadow-sm"
            >
              Get started free
            </a>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="glass-card rounded-[28px] p-7 shadow-2xl ring-2 ring-cyan-400/70"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-950 dark:text-white">Pro</h3>
                <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">For serious semester execution</p>
              </div>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white dark:bg-cyan-400 dark:text-slate-950 shadow-sm">Popular</span>
            </div>
            <div className="mt-5 flex items-end gap-1">
              <span className="text-4xl font-black text-slate-950 dark:text-white">₹59</span>
              <span className="pb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">/month</span>
            </div>
            <ul className="mt-6 space-y-3">
              {[
                "Unlimited tasks in feed",
                "Unlimited AI assistant messages",
                "10 timetable scans/day",
                "Auto GitHub sync every 6h",
                "Matched Internshala openings",
                "AI-generated resume PDF",
                "Auto-scheduling focus blocks",
                "Full GitHub health & streak analytics",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-100">
                  <Check size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" /> {f}
                </li>
              ))}
            </ul>
            <a
              href="/login"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-xl transition hover:scale-[1.02] hover:bg-slate-800 dark:bg-white dark:text-slate-950"
            >
              <Zap size={16} className="text-volt fill-volt" /> Upgrade to Pro — ₹59/month
            </a>
            <p className="mt-2.5 text-center text-xs font-medium text-slate-600 dark:text-slate-300">
              Secure payment via Razorpay · Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Social proof ── */}
      <section className="mx-auto max-w-7xl px-5 pb-28 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="glass-card mx-auto max-w-3xl rounded-[28px] p-8 sm:p-10 shadow-2xl"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Built with</p>
          <div className="mt-6 w-full overflow-hidden">
            <LogoLoop
              logos={["Next.js 14", "Supabase", "GPT-4o", "Razorpay", "Vercel", "GitHub OAuth"].map((tech) => ({
                node: (
                  <span className="rounded-xl border border-white/40 bg-white/70 dark:bg-white/10 px-4 py-2 text-sm font-bold text-slate-800 dark:text-slate-100 backdrop-blur-md shadow-sm whitespace-nowrap">
                    {tech}
                  </span>
                )
              }))}
              speed={50}
              direction="right"
              gap={24}
              fadeOut
            />
          </div>
          <p className="mt-8 text-sm sm:text-base font-medium leading-7 text-slate-800 dark:text-slate-100">
            PrioryxAI is built by engineers who lived through the exact problem — scattered deadlines, missed internship windows, and a GitHub profile that never reflected real work. We built the tool we wished existed in college. <br />
            <span className="mt-4 inline-block font-bold text-slate-950 dark:text-white">Trusted by students from IITs, NITs, and top engineering colleges.</span>
          </p>
        </motion.div>
      </section>

      {/* ── Final CTA ── */}
      <section className="mx-auto max-w-7xl px-5 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass-card mx-auto max-w-4xl rounded-[32px] px-8 py-16 text-center shadow-2xl"
        >
          <h2 className="mx-auto max-w-2xl text-3xl font-extrabold text-slate-950 dark:text-white sm:text-4xl drop-shadow-sm">
            Start using PrioryxAI today.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-7 text-slate-800 dark:text-slate-100">
            Free to join. Connect GitHub, upload one timetable, and the feed will show you your highest-priority task within 60 seconds.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-8 py-3.5 text-sm font-bold text-white shadow-2xl transition hover:scale-105 hover:bg-slate-800 dark:bg-white dark:text-slate-950"
            >
              Get started — it&apos;s free <ArrowRight size={16} />
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/20 bg-white/60 dark:bg-[#02161f]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-5 py-10">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div>
              <a href="/" className="flex items-center gap-2.5">
                <img src="/logo.png" alt="PrioryxAI Logo" className="h-7 w-7 object-contain" />
                <span className="text-sm font-bold text-slate-950 dark:text-white">PrioryxAI</span>
              </a>
              <p className="mt-3 max-w-xs text-xs font-medium leading-5 text-slate-600 dark:text-slate-300">
                Academic &amp; career command center for Indian engineering students.
              </p>
              <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <a href="mailto:support@prioryxai.in" className="hover:text-slate-950 dark:hover:text-white transition">
                  support@prioryxai.in
                </a>
              </p>
            </div>
            <div className="flex flex-wrap gap-12 text-sm font-semibold">
              <div className="space-y-3">
                <p className="font-bold text-slate-950 dark:text-white">Product</p>
                {[["Features", "#features"], ["How it works", "#how-it-works"], ["Pricing", "#pricing"]].map(([label, href]) => (
                  <a key={label} href={href} className="block text-slate-700 dark:text-slate-300 transition hover:text-slate-950 dark:hover:text-white">{label}</a>
                ))}
              </div>
              <div className="space-y-3">
                <p className="font-bold text-slate-950 dark:text-white">Account</p>
                {[["Sign in", "/login"], ["Sign up free", "/login"]].map(([label, href]) => (
                  <a key={label} href={href} className="block text-slate-700 dark:text-slate-300 transition hover:text-slate-950 dark:hover:text-white">{label}</a>
                ))}
              </div>
              <div className="space-y-3">
                <p className="font-bold text-slate-950 dark:text-white">Legal</p>
                {[["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"]].map(([label, href]) => (
                  <a key={label} href={href} className="block text-slate-700 dark:text-slate-300 transition hover:text-slate-950 dark:hover:text-white">{label}</a>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/20 pt-8 text-xs font-medium text-slate-600 dark:text-slate-300">
            <p>© {new Date().getFullYear()} PrioryxAI. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Lock size={11} /> SSL secured
              </span>
              <span className="flex items-center gap-1.5">
                <CreditCard size={11} /> Razorpay payments
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
