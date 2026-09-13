'use client';
import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import { ArrowRight, Zap } from 'lucide-react';

function FloatingOrb({
  size,
  color,
  x,
  y,
  delay,
  duration,
  reduced,
}: {
  size: number;
  color: string;
  x: string;
  y: string;
  delay: number;
  duration: number;
  reduced?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={
        reduced
          ? { opacity: 0.3, scale: 1, y: 0 }
          : { opacity: [0.2, 0.45, 0.2], scale: [1, 1.15, 1], y: [-12, 12, -12] }
      }
      transition={
        reduced
          ? { duration: 0.8 }
          : { delay, duration, repeat: Infinity, ease: 'easeInOut' }
      }
      className="absolute rounded-full blur-3xl pointer-events-none -z-10"
      style={{
        width: size,
        height: size,
        background: color,
        left: x,
        top: y,
      }}
    />
  );
}

function GridLines() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1.5 }}
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6,182,212,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6,182,212,0.08) 1px, transparent 1px)
          `,
          backgroundSize: '72px 72px',
          maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black 40%, transparent 100%)',
        }}
      />
    </div>
  );
}

export function HeroSection() {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const yRaw = useTransform(scrollYProgress, [0, 1], ['0%', '35%']);
  const opacityRaw = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const scaleRaw = useTransform(scrollYProgress, [0, 0.65], [1, 0.9]);
  const y = prefersReducedMotion ? '0%' : yRaw;
  const opacity = prefersReducedMotion ? 1 : opacityRaw;
  const scale = prefersReducedMotion ? 1 : scaleRaw;

  const wordList = [
    'semester.', 2200,
    'internships.', 2200,
    'placements.', 2200,
    'engineering career.', 2200,
  ];

  return (
    <section
      ref={containerRef}
      className="relative min-h-[90vh] flex items-center justify-center pt-28 pb-20 overflow-hidden"
    >
      {/* Grid lines */}
      <GridLines />

      {/* Ambient orbs */}
      <FloatingOrb size={550} color="radial-gradient(circle, rgba(124,58,237,0.35), transparent 70%)" x="-10%" y="10%" delay={0} duration={8} reduced={!!prefersReducedMotion} />
      <FloatingOrb size={450} color="radial-gradient(circle, rgba(6,182,212,0.35), transparent 70%)" x="70%" y="15%" delay={1} duration={10} reduced={!!prefersReducedMotion} />
      <FloatingOrb size={350} color="radial-gradient(circle, rgba(16,185,129,0.25), transparent 70%)" x="40%" y="60%" delay={2} duration={12} reduced={!!prefersReducedMotion} />

      {/* Main content */}
      <motion.div
        style={{ y, opacity, scale }}
        className="relative z-10 text-center px-5 max-w-5xl mx-auto"
      >
        {/* Main headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6"
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[84px] font-black tracking-tight leading-[1.05] text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.8)]">
            <span className="block">Your AI-powered</span>
            <span className="block mt-1 sm:mt-2">
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent filter drop-shadow-[0_2px_18px_rgba(6,182,212,0.4)]">
                  command center
                </span>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.9, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 origin-left shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                />
              </span>
            </span>
            <span className="block mt-1 sm:mt-2 text-3xl sm:text-5xl md:text-6xl text-slate-200">
              for your{' '}
              <TypeAnimation
                sequence={wordList}
                wrapper="span"
                cursor={true}
                repeat={Infinity}
                className="bg-gradient-to-r from-cyan-300 via-teal-200 to-white bg-clip-text text-transparent font-black"
              />
            </span>
          </h1>
        </motion.div>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-slate-200 text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed mb-10 font-medium drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]"
        >
          Connect <span className="dynamic-word-contrast font-bold text-white">GitHub</span>. Upload your{' '}
          <span className="dynamic-word-contrast font-bold text-white">timetable</span>. Let AI rank every exam,
          project, and internship deadline into one feed — so you always know what to do next.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
        >
          {/* Primary CTA */}
          <motion.a
            href="/login"
            whileHover={{ scale: 1.04, boxShadow: '0 20px 60px rgba(124,58,237,0.6)' }}
            whileTap={{ scale: 0.97 }}
            data-cursor-text="Let's go →"
            className="relative group px-8 py-4 rounded-2xl font-bold text-white text-base sm:text-lg overflow-hidden shadow-2xl shadow-cyan-500/20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-cyan-500 to-emerald-400 rounded-2xl" />
            {!prefersReducedMotion && (
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              Get started free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.a>

          {/* Secondary CTA */}
          <motion.a
            href="#how-it-works"
            whileHover={{
              scale: 1.02,
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderColor: 'rgba(90,210,244,0.4)',
            }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 rounded-2xl font-bold text-white text-base sm:text-lg border border-white/20 bg-[#02161f]/75 backdrop-blur-xl transition-all flex items-center gap-2 shadow-lg"
          >
            <Zap size={16} className="text-cyan-400 fill-cyan-400" />
            See how it works
          </motion.a>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
      >
        <span className="text-cyan-200/50 text-[11px] font-bold uppercase tracking-[0.25em]">
          Scroll to explore
        </span>
        <motion.div
          animate={prefersReducedMotion ? { y: 0 } : { y: [0, 8, 0] }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 1.6, repeat: Infinity }}
          className="w-px h-8 bg-gradient-to-b from-cyan-400 to-transparent"
        />
      </motion.div>
    </section>
  );
}
