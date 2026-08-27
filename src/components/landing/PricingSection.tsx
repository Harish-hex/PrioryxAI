'use client';
import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Zap, Check, Lock } from 'lucide-react';

const PRO_FEATURES = [
  'Unlimited tasks in priority feed',
  'Unlimited AI assistant messages',
  '10 timetable scans per day',
  'Auto GitHub sync every 6 hours',
  'Resume Intelligence — 64+ skills & SWOT',
  'Project Foundry — 9 AI project roadmaps',
  'Job market skill matching',
  'LeetCode + HackerRank tracking',
  'Peer Collaboration & 1v1 challenges',
  'Full GitHub health & streak analytics',
  'Placement readiness score card',
  'AI-generated resume PDF',
];

export function PricingSection() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="pricing" ref={ref} className="py-28 px-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-16">
        <span className="inline-block rounded-full border border-white/30 bg-[#02161f]/80 backdrop-blur-md px-4 py-1 text-xs font-black uppercase tracking-[0.25em] text-cyan-300 shadow-md mb-3">
          Pricing
        </span>
        <h2 className="text-4xl sm:text-5xl font-black text-white mb-3 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
          Simple. No surprises.
        </h2>
        <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto font-medium">
          Start free. Upgrade when the priority feed starts transforming your semester.
        </p>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
        {/* Free card */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl border border-white/20 bg-[#02161f]/80 backdrop-blur-2xl p-8 flex flex-col justify-between shadow-xl"
        >
          <div>
            <h3 className="text-white font-black text-2xl mb-1">Free</h3>
            <p className="text-slate-300 text-sm mb-6 font-medium">For getting started</p>

            <div className="mb-8">
              <span className="text-5xl font-black text-white">₹0</span>
              <span className="text-slate-300 text-sm ml-2 font-bold">/month</span>
            </div>

            <div className="space-y-3 mb-8">
              {[
                '25 tasks in priority feed',
                '5 AI assistant messages / day',
                '3 timetable scans / day',
                'GitHub sync (one-time)',
                'Public profile page & basic stats',
              ].map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-white" />
                  </div>
                  <span className="text-slate-200 text-sm font-medium">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <motion.a
            href="/login"
            whileHover={{ scale: 1.02, borderColor: 'rgba(255,255,255,0.4)' }}
            whileTap={{ scale: 0.98 }}
            className="block w-full py-4 rounded-2xl border border-white/20 text-center text-white font-bold text-sm transition-all hover:bg-white/10 shadow-md"
          >
            Get started free
          </motion.a>
        </motion.div>

        {/* Pro card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl overflow-hidden shadow-2xl ring-2 ring-cyan-400/80"
        >
          {/* Background Card */}
          <div className="relative rounded-3xl bg-[#02161f]/90 backdrop-blur-2xl p-8 h-full flex flex-col justify-between">
            {/* Popular badge */}
            <div className="absolute top-6 right-6">
              <span className="px-3 py-1 rounded-full bg-cyan-400 text-slate-950 text-xs font-black shadow-lg shadow-cyan-400/30">
                Popular
              </span>
            </div>

            <div>
              <h3 className="text-white font-black text-2xl mb-1">Pro</h3>
              <p className="text-cyan-300 text-sm mb-6 font-semibold">For serious semester execution</p>

              <div className="mb-6">
                <span className="text-5xl font-black text-white">₹59</span>
                <span className="text-cyan-200 text-sm ml-2 font-bold">/month</span>
              </div>

              {/* Feature list with hover */}
              <div className="space-y-2.5 mb-8 max-h-72 overflow-y-auto pr-1">
                {PRO_FEATURES.map((feature, i) => (
                  <motion.div
                    key={feature}
                    onHoverStart={() => setHoveredFeature(i)}
                    onHoverEnd={() => setHoveredFeature(null)}
                    animate={{
                      x: hoveredFeature === i ? 4 : 0,
                      opacity: hoveredFeature !== null && hoveredFeature !== i ? 0.6 : 1,
                    }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-emerald-400" />
                    </div>
                    <span className="text-slate-100 text-sm font-semibold">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div>
              <motion.a
                href="/login"
                data-cursor-text="Upgrade →"
                whileHover={{
                  scale: 1.02,
                  boxShadow: '0 20px 60px rgba(6,182,212,0.5)',
                }}
                whileTap={{ scale: 0.98 }}
                className="relative block w-full py-4 rounded-2xl text-center font-black text-white overflow-hidden shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-cyan-500 to-emerald-400" />
                {!prefersReducedMotion && (
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Zap size={16} className="text-cyan-200 fill-cyan-200" /> Upgrade to Pro — ₹59/month
                </span>
              </motion.a>

              <p className="text-slate-300 text-xs text-center mt-3 flex items-center justify-center gap-1.5 font-medium">
                <Lock size={12} className="text-emerald-400" /> Secure checkout · Cancel anytime
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
