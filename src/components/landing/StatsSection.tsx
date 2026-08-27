'use client';
import { motion, useReducedMotion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';

const STATS = [
  { value: 10000, suffix: '+', label: 'Engineering Students', decimals: 0 },
  { value: 98, suffix: '%', label: 'On-time Submissions', decimals: 0 },
  { value: 64, suffix: '+', label: 'Skills Extracted / Resume', decimals: 0 },
  { value: 4.9, suffix: '/5', label: 'Average User Rating', decimals: 1 },
];

export function StatsSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
  const prefersReducedMotion = useReducedMotion();

  return (
    <section ref={ref} className="py-24 px-5 relative">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-cyan-500/10 to-emerald-500/10 pointer-events-none -z-10" />

      {/* Border lines */}
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
      <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center rounded-2xl border border-white/15 bg-[#02161f]/70 backdrop-blur-xl p-6 shadow-xl"
          >
            <div className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              {inView ? (
                prefersReducedMotion ? (
                  <span>
                    {stat.decimals > 0 ? stat.value.toFixed(stat.decimals) : stat.value.toLocaleString()}
                    {stat.suffix}
                  </span>
                ) : (
                  <CountUp
                    start={0}
                    end={stat.value}
                    duration={2.2}
                    decimals={stat.decimals}
                    suffix={stat.suffix}
                    delay={i * 0.15}
                    separator=","
                  />
                )
              ) : (
                <span>0{stat.suffix}</span>
              )}
            </div>
            <p className="text-cyan-200/80 text-xs sm:text-sm font-bold tracking-wide">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
