'use client';
import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ImagePlus, FileText, Zap } from 'lucide-react';
import { GitHubLogo } from '@/components/icons/github-logo';

const STEPS = [
  {
    number: '01',
    title: 'Connect GitHub',
    description: 'One click. PrioryxAI pulls your repos, contribution streak, top languages, and activity graph instantly.',
    color: 'from-violet-500 to-purple-600',
    icon: GitHubLogo,
    iconColor: 'text-violet-300',
  },
  {
    number: '02',
    title: 'Upload Timetable',
    description: 'Photograph your printed schedule or exam date-sheet. GPT-4o Vision extracts and structures dates in seconds.',
    color: 'from-cyan-500 to-blue-600',
    icon: ImagePlus,
    iconColor: 'text-cyan-300',
  },
  {
    number: '03',
    title: 'Upload Your Resume',
    description: '64+ technical skills extracted, SWOT matrix generated, and personalized project ideas synthesized automatically.',
    color: 'from-emerald-500 to-teal-600',
    icon: FileText,
    iconColor: 'text-emerald-300',
  },
  {
    number: '04',
    title: 'Your Feed Is Ready',
    description: 'AI ranks every deadline by urgency × syllabus weightage. You always know the single highest-leverage task to execute.',
    color: 'from-amber-500 to-rose-600',
    icon: Zap,
    iconColor: 'text-amber-300',
  },
];

export function HorizontalScroll() {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // One extra pinned unit at the end so the final step has dwell time before
  // the section unpins — without it, finishing the slide to the last step and
  // releasing the sticky pin happen on the same scroll tick, so the last step
  // flashes by instead of holding.
  const DWELL_UNITS = 1;
  const totalUnits = STEPS.length + DWELL_UNITS;
  const x = useTransform(
    scrollYProgress,
    [0, STEPS.length / totalUnits],
    ['0vw', `-${(STEPS.length - 1) * 100}vw`]
  );

  return (
    <section id="how-it-works" className="relative">
      {/* ── Desktop Horizontal Scroll Track — skipped entirely under prefers-reduced-motion, falls through to the vertical layout below at any breakpoint ── */}
      <div
        ref={containerRef}
        style={{ height: prefersReducedMotion ? undefined : `${totalUnits * 100}vh` }}
        className={prefersReducedMotion ? 'hidden' : 'hidden md:block relative'}
      >
        <div className="sticky top-0 h-screen overflow-hidden flex items-center bg-[#02161f]/40 backdrop-blur-sm">
          {/* Section label */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 text-center">
            <span className="inline-block rounded-full border border-white/30 bg-[#02161f]/80 backdrop-blur-md px-4 py-1 text-xs font-black uppercase tracking-[0.25em] text-cyan-300 shadow-md mb-2">
              How it works
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              Up and running in{' '}
              <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                4 minutes
              </span>
            </h2>
          </div>

          {/* Progress dots on right */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full border border-white/30 bg-white/20"
              />
            ))}
          </div>

          {/* Horizontal animated track */}
          <motion.div style={{ x }} className="flex will-change-transform">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="w-screen h-screen flex items-center justify-center px-8"
                >
                  <div className="max-w-4xl w-full grid grid-cols-2 gap-12 items-center rounded-3xl border border-white/20 bg-[#02161f]/85 backdrop-blur-2xl p-10 shadow-2xl">
                    {/* Text */}
                    <div>
                      <span className="text-6xl font-black text-cyan-400/20 block mb-2 font-mono">
                        {step.number}
                      </span>
                      <div className={`inline-flex p-3.5 rounded-2xl bg-gradient-to-br ${step.color} bg-opacity-30 mb-4 shadow-lg`}>
                        <Icon size={32} className="text-white" />
                      </div>
                      <h3 className="text-3xl font-black text-white mb-3">
                        {step.title}
                      </h3>
                      <p className="text-slate-200 text-base font-medium leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    {/* Visual card */}
                    <div
                      className={`aspect-square rounded-3xl border border-white/20 bg-gradient-to-br ${step.color} bg-opacity-20 flex flex-col items-center justify-center p-8 backdrop-blur-xl shadow-inner`}
                    >
                      <Icon size={72} className={step.iconColor} />
                      <span className="mt-4 text-white font-black text-xl tracking-tight">Step {step.number}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* ── Mobile Vertical Fallback — also forced at any breakpoint under prefers-reduced-motion ── */}
      <div className={`${prefersReducedMotion ? 'block' : 'block md:hidden'} py-20 px-5 max-w-lg mx-auto`}>
        <div className="text-center mb-12">
          <span className="inline-block rounded-full border border-white/30 bg-[#02161f]/80 backdrop-blur-md px-4 py-1 text-xs font-black uppercase tracking-[0.25em] text-cyan-300 shadow-md mb-2">
            How it works
          </span>
          <h2 className="text-3xl font-black text-white">
            Up and running in{' '}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent">
              4 minutes
            </span>
          </h2>
        </div>

        <div className="space-y-6">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="rounded-3xl border border-white/20 bg-[#02161f]/85 backdrop-blur-2xl p-6 shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${step.color} bg-opacity-30 shadow-md`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <span className="text-3xl font-black text-cyan-400/25 font-mono">{step.number}</span>
                </div>
                <h3 className="text-xl font-black text-white mb-2">{step.title}</h3>
                <p className="text-slate-200 text-sm font-medium leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
