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
  Sparkles,
  Target,
  Zap,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import LogoLoop from "./LogoLoop";

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
    <div className="app-background min-h-screen overflow-x-hidden text-slate-950">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="PrioryxAI Logo" className="h-8 w-8 object-contain" />
            <span className="text-sm font-semibold text-slate-950">PrioryxAI</span>
          </a>
          <div className="hidden items-center gap-6 text-sm text-slate-600 sm:flex">
            <a href="#features" className="transition hover:text-slate-950">Features</a>
            <a href="#how-it-works" className="transition hover:text-slate-950">How it works</a>
            <a href="#pricing" className="transition hover:text-slate-950">Pricing</a>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/login"
              className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:border-white/20 hover:bg-slate-100"
            >
              Sign in
            </a>
            <a
              href="/login"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-slate-50"
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
          className="mx-auto max-w-4xl text-5xl font-semibold leading-[1.1] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl"
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
          className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600"
        >
          Connect GitHub, upload your timetable, and let PrioryxAI rank your
          next high-leverage move — exam, internship, or project — in one feed.
        </motion.p>

        <motion.div
          {...fadeUpVariant(2)}
          className="mt-6 inline-flex items-center rounded-full border border-aura/20 bg-aura/10 px-4 py-1.5 text-xs font-semibold text-slate-950"
        >
          Built for Indian engineering students
        </motion.div>

        <motion.div
          {...fadeUpVariant(3)}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <a
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-glow transition hover:scale-[1.03] hover:bg-slate-50"
          >
            Get started free <ArrowRight size={16} />
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:border-white/20 hover:bg-slate-100"
          >
            See how it works
          </a>
        </motion.div>

        {/* Trust row */}
        <motion.div
          {...fadeUpVariant(4)}
          className="mt-10 w-full overflow-hidden text-xs text-slate-500"
        >
          <LogoLoop
            logos={[
              { node: <span className="flex items-center gap-1.5 whitespace-nowrap"><Lock size={13} className="text-slate-600" /> Secure — HTTPS + Supabase RLS</span> },
              { node: <span className="flex items-center gap-1.5 whitespace-nowrap"><CreditCard size={13} className="text-slate-600" /> Payments via Razorpay</span> },
              { node: <span className="flex items-center gap-1.5 whitespace-nowrap"><GitBranch size={13} className="text-slate-600" /> GitHub OAuth</span> },
              { node: <span className="flex items-center gap-1.5 whitespace-nowrap"><Mail size={13} className="text-slate-600" /> Google OAuth</span> },
            ]}
            speed={40}
            direction="left"
            gap={32}
            fadeOut
            fadeOutColor="#ffffff"
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
          className="rounded-2xl border border-slate-200 p-px shadow-[0_0_120px_rgba(0,0,0,0.05)]"
        >
          <div className="rounded-[15px] border border-slate-200 bg-white/95 backdrop-blur-2xl">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-signal/60" />
              <span className="h-3 w-3 rounded-full bg-amber-400/60" />
              <span className="h-3 w-3 rounded-full bg-mint/60" />
              <div className="ml-4 flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-center text-xs text-slate-500">
                prioryxai.in/feed
              </div>
            </div>
            {/* Dashboard preview */}
            <div className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_240px]">
              {/* Next move card */}
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-950/[0.07] px-3 py-1 text-xs text-slate-700">
                      <Sparkles size={11} className="text-volt" /> Next Move Card
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg border border-mint/20 bg-mint/10 px-2.5 py-1 text-xs text-mint">
                      AI ranked
                    </span>
                  </div>
                  <p className="mt-4 text-xs text-slate-500">Do this next</p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-950">Complete DBMS Assignment — Chapter 7 Normalization</h3>
                  <p className="mt-2 text-sm text-slate-600">Due tomorrow · 2h estimated · High weightage (40%)</p>
                  <div className="mt-4 flex gap-2">
                    <span className="rounded-lg border border-signal/20 bg-signal/10 px-2.5 py-1 text-xs text-signal">Urgent</span>
                    <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">assignment</span>
                  </div>
                </div>
                {/* Feed tasks */}
                <div className="space-y-2">
                  {[
                    { dot: "bg-amber-400", title: "Internship application — Zomato SDE Intern", sub: "Matched on React + TypeScript · ₹25,000/mo · 3 days left" },
                    { dot: "bg-green-400", title: "Push ML project to GitHub before recruiter review", sub: "GitHub streak: 14d · health score 78/100" },
                    { dot: "bg-green-400", title: "OS exam — Memory Management chapter", sub: "Wed, Apr 16 · 3h estimated" },
                  ].map(({ dot, title, sub }) => (
                    <div key={title} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-950">{title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Right stats */}
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold text-slate-600">This week</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[["Pending", "8"], ["Done", "5"], ["Overdue", "1"], ["Streak", "14d"]].map(([l, v]) => (
                      <div key={l} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                        <p className="text-[10px] text-slate-500">{l}</p>
                        <p className="mt-1 text-lg font-semibold text-slate-950">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold text-slate-600">GitHub health</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-950">78<span className="text-sm text-slate-500">/100</span></p>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-950/10">
                    <div className="h-1.5 w-[78%] rounded-full bg-gradient-to-r from-aura via-volt to-mint" />
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
          className="text-xs font-semibold uppercase tracking-widest text-slate-500"
        >
          Why PrioryxAI
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mx-auto mt-4 max-w-3xl text-3xl font-semibold text-slate-950 sm:text-4xl"
        >
          Stop juggling five apps. One feed tells you what to do next.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600"
        >
          Most students keep exam dates in one place, internship deadlines in another, GitHub in a third. PrioryxAI pulls everything into a single AI-ranked priority feed — so you always know the highest-leverage move right now, not tomorrow.
        </motion.p>
      </section>

      {/* ── Features ── */}
      <section id="features" className="mx-auto max-w-7xl px-5 pb-28">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Features</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Everything you need, nothing you don&apos;t</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Sparkles,
              color: "text-volt border-volt/20 bg-volt/10",
              title: "AI-ranked priority feed",
              desc: "Every exam, assignment, and internship deadline scored by urgency × career impact. The most important thing is always first.",
            },
            {
              icon: GitBranch,
              color: "text-mint border-mint/20 bg-mint/10",
              title: "GitHub sync & insights",
              desc: "Connect once. PrioryxAI tracks your streak, health score, and top languages — and surfaces which repo to push before a recruiter looks.",
            },
            {
              icon: ImagePlus,
              color: "text-aura border-aura/20 bg-aura/10",
              title: "Timetable scanner",
              desc: "Photograph your printed timetable or whiteboard. PrioryxAI reads dates with GPT-4o Vision and adds every exam to your feed automatically.",
            },
            {
              icon: Briefcase,
              color: "text-volt border-volt/20 bg-volt/10",
              title: "Matched internship openings",
              desc: "Based on your GitHub languages and subjects, we surface live Internshala listings with stipend, deadline, and matching skills highlighted.",
            },
            {
              icon: Bot,
              color: "text-mint border-mint/20 bg-mint/10",
              title: "Context-aware AI assistant",
              desc: "Ask how to plan the next 3 hours, which task has the highest career impact, or get a study schedule — the AI already knows your deadlines.",
            },
            {
              icon: Target,
              color: "text-aura border-aura/20 bg-aura/10",
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
              className="glass rounded-xl p-5"
            >
              <div className={`inline-flex rounded-lg border p-2.5 ${color}`}>
                <Icon size={18} />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-5 pb-28">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Up and running in 3 minutes</h2>
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
              className="relative rounded-xl bg-white border border-slate-200 p-6 shadow-sm"
            >
              <span className="text-5xl font-semibold text-slate-950/[0.06]">{step}</span>
              <h3 className="mt-3 text-base font-semibold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
              {i < 2 && (
                <ArrowRight
                  size={20}
                  className="absolute -right-3.5 top-1/2 hidden -translate-y-1/2 text-slate-400 sm:block"
                />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="mx-auto max-w-7xl px-5 pb-28">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Pricing</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Simple. No surprises.</h2>
          <p className="mt-3 text-base text-slate-600">Start free. Upgrade when the feed starts changing your semester.</p>
        </div>
        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-xl border border-slate-200 bg-white p-6"
          >
            <h3 className="text-lg font-semibold text-slate-950">Free</h3>
            <p className="mt-1 text-sm text-slate-500">For getting started</p>
            <div className="mt-5 flex items-end gap-1">
              <span className="text-4xl font-semibold text-slate-950">₹0</span>
              <span className="pb-1 text-sm text-slate-500">/month</span>
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
                <li key={f} className="flex items-center gap-3 text-sm text-slate-700">
                  <Check size={15} className="shrink-0 text-mint" /> {f}
                </li>
              ))}
            </ul>
            <a
              href="/login"
              className="mt-8 inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
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
            className="rounded-xl accent-border p-px shadow-glow"
          >
            <div className="h-full rounded-[11px] bg-white p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">Pro</h3>
                  <p className="mt-1 text-sm text-slate-500">For serious semester execution</p>
                </div>
                <span className="rounded-lg bg-slate-950 px-2.5 py-1 text-xs font-semibold text-white">Popular</span>
              </div>
              <div className="mt-5 flex items-end gap-1">
                <span className="text-4xl font-semibold text-slate-950">₹59</span>
                <span className="pb-1 text-sm text-slate-500">/month</span>
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
                  <li key={f} className="flex items-center gap-3 text-sm text-slate-700">
                    <Check size={15} className="shrink-0 text-mint" /> {f}
                  </li>
                ))}
              </ul>
              <a
                href="/login"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
              >
                <Zap size={15} /> Upgrade to Pro — ₹59/month
              </a>
              <p className="mt-2 text-center text-xs text-slate-500">
                Secure payment via Razorpay · Cancel anytime
              </p>
            </div>
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
          className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-soft"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Built with</p>
          <div className="mt-6 w-full overflow-hidden">
            <LogoLoop
              logos={["Next.js 14", "Supabase", "GPT-4o", "Razorpay", "Vercel", "GitHub OAuth"].map((tech) => ({
                node: (
                  <span className="rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-1.5 text-sm text-slate-700 whitespace-nowrap">
                    {tech}
                  </span>
                )
              }))}
              speed={50}
              direction="right"
              gap={24}
              fadeOut
              fadeOutColor="#ffffff"
            />
          </div>
          <p className="mt-8 text-sm leading-7 text-slate-600">
            PrioryxAI is built by engineers who lived through the exact problem — scattered deadlines, missed internship windows, and a GitHub profile that never reflected real work. We built the tool we wished existed in college. <br />
            <span className="mt-4 inline-block font-medium text-slate-950">Trusted by students from IITs, NITs, and top engineering colleges.</span>
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
          className="rounded-2xl accent-border p-px"
        >
          <div className="rounded-[15px] bg-white px-8 py-16 shadow-soft">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold text-slate-950 sm:text-4xl">
              Start using PrioryxAI today.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
              Free to join. Connect GitHub, upload one timetable, and the feed will show you your highest-priority task within 60 seconds.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-8 py-3.5 text-sm font-semibold text-white shadow-glow transition hover:scale-[1.03] hover:bg-slate-800"
              >
                Get started — it&apos;s free <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white/80">
        <div className="mx-auto max-w-7xl px-5 py-10">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div>
              <a href="/" className="flex items-center gap-2.5">
                <img src="/logo.png" alt="PrioryxAI Logo" className="h-7 w-7 object-contain" />
                <span className="text-sm font-semibold text-slate-950">PrioryxAI</span>
              </a>
              <p className="mt-3 max-w-xs text-xs leading-5 text-slate-500">
                Academic &amp; career command center for Indian engineering students.
              </p>
              <p className="mt-2 text-xs text-slate-600">
                <a href="mailto:support@prioryxai.in" className="hover:text-slate-600 transition">
                  support@prioryxai.in
                </a>
              </p>
            </div>
            <div className="flex flex-wrap gap-12 text-sm">
              <div className="space-y-3">
                <p className="font-semibold text-slate-950">Product</p>
                {[["Features", "#features"], ["How it works", "#how-it-works"], ["Pricing", "#pricing"]].map(([label, href]) => (
                  <a key={label} href={href} className="block text-slate-600 transition hover:text-slate-950">{label}</a>
                ))}
              </div>
              <div className="space-y-3">
                <p className="font-semibold text-slate-950">Account</p>
                {[["Sign in", "/login"], ["Sign up free", "/login"]].map(([label, href]) => (
                  <a key={label} href={href} className="block text-slate-600 transition hover:text-slate-950">{label}</a>
                ))}
              </div>
              <div className="space-y-3">
                <p className="font-semibold text-slate-950">Legal</p>
                {[["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"]].map(([label, href]) => (
                  <a key={label} href={href} className="block text-slate-600 transition hover:text-slate-950">{label}</a>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-8 text-xs text-slate-600">
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
