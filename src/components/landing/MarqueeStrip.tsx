'use client';
import { motion, useReducedMotion } from 'framer-motion';

const ITEMS = [
  'Built for Indian engineering students',
  'AI-ranked priority feed',
  'GitHub Profile Sync',
  'Resume Intelligence & SWOT',
  'Placement readiness score',
  'Secure instant checkout',
  'Project Foundry',
  'LeetCode + HackerRank tracking',
  'Job market matching',
  'Peer collaboration & 1v1 duels',
];

function MarqueeInner({ reverse = false }: { reverse?: boolean }) {
  const prefersReducedMotion = useReducedMotion();
  const items = prefersReducedMotion ? ITEMS : [...ITEMS, ...ITEMS];

  if (prefersReducedMotion) {
    return (
      <div className="flex flex-wrap justify-center gap-4">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 text-slate-200 text-xs sm:text-sm font-semibold
                       px-4 py-2 rounded-full border border-white/15 bg-[#02161f]/70 backdrop-blur-md shadow-md"
          >
            {item}
          </span>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      animate={{ x: reverse ? ['0%', '50%'] : ['0%', '-50%'] }}
      transition={{ duration: 32, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
      className="flex gap-4 whitespace-nowrap will-change-transform"
    >
      {items.map((item, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-2 text-slate-200 text-xs sm:text-sm font-semibold
                     px-4 py-2 rounded-full border border-white/15 bg-[#02161f]/70 backdrop-blur-md
                     hover:border-cyan-400/40 hover:text-white transition-colors cursor-default shadow-md"
        >
          {item}
        </span>
      ))}
    </motion.div>
  );
}

export function MarqueeStrip() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className="py-10 overflow-hidden relative"
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
      }}
    >
      <div className="flex flex-col gap-3">
        <MarqueeInner />
        {!prefersReducedMotion && <MarqueeInner reverse />}
      </div>
    </div>
  );
}
