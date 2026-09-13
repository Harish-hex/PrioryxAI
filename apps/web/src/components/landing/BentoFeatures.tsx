'use client';
import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Zap, Bot, Briefcase, GitBranch, Trophy, FileText, Hammer, Users, Code2, MessagesSquare } from 'lucide-react';

function BentoCard({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ delay: prefersReducedMotion ? 0 : delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      whileHover={prefersReducedMotion ? { borderColor: 'rgba(90,210,244,0.45)' } : { scale: 1.02, borderColor: 'rgba(90,210,244,0.45)' }}
      className={`
        relative rounded-3xl border border-white/20 overflow-hidden
        bg-[#02161f]/80 backdrop-blur-2xl p-6 sm:p-7
        shadow-[0_16px_40px_rgba(0,0,0,0.4)]
        hover:shadow-2xl hover:shadow-cyan-500/15
        transition-all duration-300 group
        ${className}
      `}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-violet-500/10 via-cyan-500/10 to-transparent" />
      {children}
    </motion.div>
  );
}

function DashboardPreview() {
  const tasks = [
    { priority: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]', title: 'DBMS Assignment — Chapter 7', time: 'Today', tag: 'Urgent' },
    { priority: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]', title: 'ML Project Recruiter Push', time: 'Tomorrow', tag: 'High' },
    { priority: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]', title: 'OS Midterm Revision', time: 'Wed, Apr 16', tag: 'Medium' },
  ];

  return (
    <div className="space-y-2.5 mt-4">
      {tasks.map((task, i) => (
        <motion.div
          key={task.title}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + i * 0.12 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-white/10 border border-white/10 hover:border-white/25 transition-colors"
        >
          <div className={`w-2.5 h-2.5 rounded-full ${task.priority} flex-shrink-0`} />
          <span className="text-white font-bold text-xs sm:text-sm flex-1 truncate">{task.title}</span>
          <span className="text-cyan-300 text-xs font-semibold">{task.time}</span>
        </motion.div>
      ))}
    </div>
  );
}

function ScoreRingPreview() {
  const circumference = 2 * Math.PI * 45;
  const progress = 0.84;
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex items-center justify-center py-4">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#bentoGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: circumference * (1 - progress) }}
            viewport={{ once: true }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { duration: 1.8, ease: 'easeOut', delay: 0.2 }
            }
          />
          <defs>
            <linearGradient id="bentoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="50%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold text-white">84</span>
          <span className="text-emerald-400 font-bold text-xs">/ 100 Score</span>
        </div>
      </div>
    </div>
  );
}

// The remaining six capabilities are real and shipped, but giving each its
// own full card (icon + title + paragraph + mini-widget) made the section
// read as ten competing visual gimmicks. Consolidated into one calm,
// scannable grid — same information, a fraction of the visual noise.
const MORE_TOOLS = [
  {
    icon: Code2,
    color: 'text-cyan-400',
    title: 'Coding Intelligence',
    description: 'LeetCode + HackerRank fused into one readiness score with a weekly DSA plan.',
  },
  {
    icon: MessagesSquare,
    color: 'text-violet-400',
    title: 'AI Mock Interviews',
    description: 'Resume-adaptive technical and HR rounds, scored on the spot.',
  },
  {
    icon: Hammer,
    color: 'text-amber-400',
    title: 'Project Foundry',
    description: 'Portfolio projects generated from your exact skill gaps.',
  },
  {
    icon: Briefcase,
    color: 'text-orange-400',
    title: 'Job Market Matching',
    description: 'Live internships ranked with an explainable match score.',
  },
  {
    icon: Users,
    color: 'text-pink-400',
    title: 'Peer Collaboration',
    description: '6-digit peer codes, DSA duels, and college leaderboards.',
  },
  {
    icon: Bot,
    color: 'text-emerald-400',
    title: 'Context-Aware AI',
    description: 'Knows your syllabus and resume — plans study blocks on request.',
  },
];

export function BentoFeatures() {
  return (
    <section id="features" className="py-28 px-5 max-w-7xl mx-auto">
      {/* Section header */}
      <div className="text-center mb-16">
        <span className="inline-block rounded-full border border-white/30 bg-[#02161f]/75 backdrop-blur-md px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300 shadow-md mb-4">
          Core Features
        </span>
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white mb-4 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
          Everything you need to{' '}
          <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
            dominate your semester
          </span>
        </h2>
        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto font-medium">
          Eliminate scattered tabs. PrioryxAI connects your academic, coding, and career workflow into one intelligent OS.
        </p>
      </div>

      {/* Bento grid — 4 hero cards with real depth */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Big feature - AI Priority Feed */}
        <BentoCard className="md:col-span-2 lg:col-span-2 row-span-2" delay={0}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/25 border border-violet-500/40 flex items-center justify-center text-cyan-300">
              <Zap size={20} className="fill-cyan-400 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg sm:text-xl">AI Priority Feed</h3>
              <p className="text-cyan-300 text-sm font-semibold">Ranked by urgency × syllabus weightage × skill gaps</p>
            </div>
          </div>
          <p className="text-slate-200 text-sm leading-relaxed mb-4 font-medium">
            Every exam, assignment, internship deadline, and coding skill gap scored by one multi-factor engine — not just syllabus dates. The most important action is always #1.
          </p>
          <DashboardPreview />
        </BentoCard>

        {/* Placement Score */}
        <BentoCard className="md:col-span-1 lg:col-span-1" delay={0.1}>
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={18} className="text-amber-400" />
            <h3 className="text-white font-semibold text-base">Placement Score</h3>
          </div>
          <p className="text-slate-300 text-sm font-semibold">Real-time 100-point readiness benchmark</p>
          <ScoreRingPreview />
        </BentoCard>

        {/* GitHub Intelligence */}
        <BentoCard className="md:col-span-1 lg:col-span-1" delay={0.15}>
          <div className="flex items-center gap-2 mb-2">
            <GitBranch size={18} className="text-emerald-400" />
            <h3 className="text-white font-semibold text-base">GitHub Health</h3>
          </div>
          <p className="text-slate-300 text-sm font-medium leading-relaxed">
            Tracks commit streak, health score, and suggests repository actions before campus interviews.
          </p>
          <div className="mt-4 p-3 rounded-xl bg-white/10 border border-white/10">
            <div className="flex justify-between mb-2">
              <span className="text-slate-300 text-sm font-bold">Health Score</span>
              <span className="text-emerald-400 text-sm font-semibold">92/100</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: '92%' }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.3 }}
                className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
              />
            </div>
          </div>
        </BentoCard>

        {/* Resume Intelligence */}
        <BentoCard className="md:col-span-2 lg:col-span-2" delay={0.2}>
          <div className="flex items-center gap-2 mb-2">
            <FileText size={18} className="text-violet-400" />
            <h3 className="text-white font-semibold text-lg">Resume Intelligence & SWOT</h3>
          </div>
          <p className="text-slate-200 text-sm leading-relaxed mb-4 font-medium">
            Upload PDF once. AI extracts 64+ skills, generates a 4-quadrant SWOT matrix, and pinpoints missing skills for dream roles.
          </p>
          <div className="flex flex-wrap gap-2">
            {['TypeScript', 'React', 'PyTorch', 'Docker', '+60 more'].map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-200 text-xs font-bold"
              >
                {skill}
              </span>
            ))}
          </div>
        </BentoCard>
      </div>

      {/* Everything else — one calm strip instead of six competing cards */}
      <div className="mt-4 sm:mt-5">
        <BentoCard className="!p-0" delay={0.3}>
          <div className="px-6 pt-6 sm:px-7 sm:pt-7">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-[0.2em]">
              And the full toolkit underneath it
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 mt-4">
            {MORE_TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.title}
                  className="flex items-start gap-3 px-6 py-5 sm:px-7 bg-[#02161f] hover:bg-white/[0.04] transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className={tool.color} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-white font-bold text-sm">{tool.title}</h4>
                    <p className="text-slate-300 text-xs leading-relaxed mt-0.5">{tool.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </BentoCard>
      </div>
    </section>
  );
}
