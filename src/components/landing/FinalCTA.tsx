'use client';

import { useState, useRef, MouseEvent } from 'react';
import { motion, useReducedMotion, useSpring, useMotionTemplate } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function FinalCTA() {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Smooth spring mouse tracking for spotlight
  const mouseX = useSpring(350, { stiffness: 350, damping: 35 });
  const mouseY = useSpring(180, { stiffness: 350, damping: 35 });
  const [isHovered, setIsHovered] = useState(false);

  const spotlightBackground = useMotionTemplate`radial-gradient(550px circle at ${mouseX}px ${mouseY}px, rgba(34, 211, 238, 0.22), rgba(139, 92, 246, 0.12) 35%, transparent 75%)`;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseX.set(x);
    mouseY.set(y);
  };

  return (
    <section className="relative py-12 sm:py-16 px-4 sm:px-6 overflow-hidden">
      {/* Outer ambient glow mesh */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-[500px] pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-cyan-500/20 blur-[100px] animate-pulse" />
        <div 
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-violet-600/20 blur-[120px] animate-pulse" 
          style={{ animationDelay: '2s' }} 
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-emerald-500/10 blur-[80px]" />
      </div>

      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl mx-auto relative rounded-[28px] sm:rounded-[36px] overflow-hidden border border-cyan-400/40 bg-gradient-to-b from-[#031522]/95 via-[#021827]/95 to-[#010e17]/98 backdrop-blur-3xl shadow-[0_0_70px_-15px_rgba(6,182,212,0.4)] group"
      >
        {/* Top-edge specular illumination line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent z-20 pointer-events-none opacity-90" />
        
        {/* Left & Right subtle edge highlights */}
        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-cyan-400/30 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-cyan-400/30 via-transparent to-transparent pointer-events-none" />

        {/* Dynamic mouse spotlight glow */}
        <motion.div
          className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-500"
          style={{
            opacity: isHovered ? 1 : 0.45,
            background: prefersReducedMotion ? undefined : spotlightBackground,
          }}
        />

        {/* Cybernetic background grid matrix with radial mask */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(56, 189, 248, 0.25) 1px, transparent 1px),
              linear-gradient(90deg, rgba(56, 189, 248, 0.25) 1px, transparent 1px)
            `,
            backgroundSize: '36px 36px',
            maskImage: 'radial-gradient(ellipse 75% 65% at 50% 45%, black 25%, transparent 85%)',
            WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 45%, black 25%, transparent 85%)',
          }}
        />

        {/* Floating internal orbs */}
        <motion.div
          animate={
            prefersReducedMotion
              ? { scale: 1, opacity: 0.25 }
              : { scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2], x: [0, 18, 0] }
          }
          transition={prefersReducedMotion ? { duration: 0.6 } : { duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-cyan-400/25 blur-3xl pointer-events-none"
        />
        <motion.div
          animate={
            prefersReducedMotion
              ? { scale: 1, opacity: 0.2 }
              : { scale: [1, 1.25, 1], opacity: [0.15, 0.3, 0.15], x: [0, -18, 0] }
          }
          transition={prefersReducedMotion ? { duration: 0.6 } : { duration: 10, repeat: Infinity, delay: 1, ease: 'easeInOut' }}
          className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-violet-600/25 blur-3xl pointer-events-none"
        />

        {/* Content Container */}
        <div className="relative z-10 py-10 sm:py-14 px-5 sm:px-10 text-center flex flex-col items-center">
          
          {/* Badge: Zero Setup Friction */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-400/40 bg-[#042031]/85 backdrop-blur-xl mb-5 sm:mb-6 shadow-[0_0_24px_rgba(6,182,212,0.25)] hover:border-cyan-300 transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-80" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-300 shadow-[0_0_8px_#22d3ee]" />
            </span>
            <span className="text-cyan-200 text-[11px] font-black tracking-[0.2em] uppercase">
              Zero Setup Friction
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black text-white mb-4 sm:mb-5 tracking-tight leading-[1.1] drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] max-w-3xl"
          >
            Start using PrioryxAI{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent filter drop-shadow-[0_0_30px_rgba(6,182,212,0.6)]">
                today.
              </span>
              <motion.span
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.8)] origin-left"
              />
            </span>
          </motion.h2>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-slate-200 text-sm sm:text-base md:text-lg max-w-xl mx-auto mb-7 sm:mb-8 leading-relaxed font-medium drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
          >
            Free to join. Sign in and your highest-priority task appears within{' '}
            <span className="text-cyan-300 font-bold drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]">
              60 seconds
            </span>
            {' '}— zero setup, zero learning curve.
          </motion.p>

          {/* "Get Started" Button */}
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="relative mb-8 sm:mb-9 group"
          >
            {/* Pulsating background neon bloom */}
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 rounded-2xl blur-lg opacity-70 group-hover:opacity-100 transition duration-400 group-hover:duration-200 animate-pulse" />

            <Link
              href="/login"
              className="relative inline-flex items-center gap-2.5 px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-white text-slate-950 font-black text-base sm:text-lg shadow-[0_10px_35px_rgba(6,182,212,0.35)] hover:shadow-[0_14px_50px_rgba(6,182,212,0.65)] transition-all duration-300 overflow-hidden transform group-hover:scale-[1.03] group-active:scale-[0.98]"
            >
              {/* Shimmer light sweep sheen */}
              {!prefersReducedMotion && (
                <motion.div
                  animate={{ x: ['-140%', '240%'] }}
                  transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
                  className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent skew-x-12 pointer-events-none"
                />
              )}

              <span className="relative tracking-tight font-black">Get Started</span>
              <ArrowRight size={18} className="relative text-slate-950 group-hover:translate-x-1.5 transition-transform duration-300" />
            </Link>
          </motion.div>

          {/* 3-Column Micro-Perks Row */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full max-w-xl"
          >
            <div className="flex items-center justify-center px-3.5 py-2.5 rounded-xl bg-[#041c2c]/70 border border-white/15 hover:border-cyan-400/40 hover:bg-cyan-500/10 backdrop-blur-xl shadow-md transition-all duration-200">
              <span className="text-slate-200 text-xs font-semibold tracking-tight">
                &lt; 60s Onboarding
              </span>
            </div>

            <div className="flex items-center justify-center px-3.5 py-2.5 rounded-xl bg-[#041c2c]/70 border border-white/15 hover:border-emerald-400/40 hover:bg-emerald-500/10 backdrop-blur-xl shadow-md transition-all duration-200">
              <span className="text-slate-200 text-xs font-semibold tracking-tight">
                Free Forever Tier
              </span>
            </div>

            <div className="flex items-center justify-center px-3.5 py-2.5 rounded-xl bg-[#041c2c]/70 border border-white/15 hover:border-violet-400/40 hover:bg-violet-500/10 backdrop-blur-xl shadow-md transition-all duration-200">
              <span className="text-slate-200 text-xs font-semibold tracking-tight">
                Private &amp; Secure
              </span>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </section>
  );
}
