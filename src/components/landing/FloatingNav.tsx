'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Smartphone, Menu, X, ArrowRight } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Features', href: '/#features' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Install App', href: '/install', isInstall: true },
];

export function FloatingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const { scrollY, scrollYProgress } = useScroll();
  const pathname = usePathname();

  useEffect(() => {
    const unsub = scrollY.on('change', (v) => setScrolled(v > 60));
    return () => unsub();
  }, [scrollY]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <nav className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4 pointer-events-none">
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto relative"
      >
        {/* Ambient glow behind the glass */}
        <div
          aria-hidden
          className="absolute -inset-x-6 -inset-y-4 -z-10 rounded-[2rem] opacity-60 blur-2xl transition-opacity duration-500"
          style={{
            background:
              'radial-gradient(60% 100% at 15% 0%, rgba(124,58,237,0.25), transparent 70%), radial-gradient(60% 100% at 85% 100%, rgba(6,182,212,0.25), transparent 70%)',
            opacity: scrolled ? 0.85 : 0.4,
          }}
        />

        <motion.div
          animate={{
            backdropFilter: scrolled ? 'blur(24px)' : 'blur(16px)',
            backgroundColor: scrolled ? 'rgba(2, 22, 31, 0.85)' : 'rgba(2, 22, 31, 0.5)',
            borderColor: scrolled ? 'rgba(90, 210, 244, 0.32)' : 'rgba(255, 255, 255, 0.14)',
            boxShadow: scrolled
              ? '0 16px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(90,210,244,0.12)'
              : '0 8px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
          transition={{ duration: 0.3 }}
          className="relative flex items-center justify-between gap-2 overflow-hidden rounded-2xl border px-4 py-2.5 backdrop-blur-xl"
        >
          {/* faint noise/sheen for depth */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />

          {/* Logo */}
          <Link href="/" className="group relative z-10 flex items-center gap-2.5">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 4 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/[0.08] p-1.5 shadow-md shadow-cyan-500/10 backdrop-blur-md transition-all duration-300 group-hover:border-cyan-400/60 group-hover:bg-cyan-500/15"
            >
              <span className="absolute inset-0 -z-10 rounded-xl bg-cyan-400/0 blur-md transition-all duration-300 group-hover:bg-cyan-400/40" />
              <img
                src="/logo.png"
                alt="PrioryxAI"
                className="h-full w-full object-contain drop-shadow-[0_0_8px_rgba(90,210,244,0.5)]"
              />
            </motion.div>
            <span className="text-sm font-black tracking-tight text-white sm:text-base">
              PrioryxAI
            </span>
          </Link>

          {/* Nav links (desktop) with sliding hover pill */}
          <div
            className="relative hidden items-center gap-1 sm:flex sm:gap-1"
            onMouseLeave={() => setHovered(null)}
          >
            {NAV_ITEMS.map((item) => {
              if (item.isInstall) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-1.5 rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 shadow-sm transition-all duration-200 hover:bg-cyan-500/20 hover:text-white sm:text-sm"
                  >
                    <Smartphone size={13} className="text-cyan-400" />
                    <span>{item.label}</span>
                  </Link>
                );
              }
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onMouseEnter={() => setHovered(item.label)}
                  className="relative px-3 py-1.5 text-xs font-semibold text-white/80 transition-colors duration-200 hover:text-white sm:text-sm"
                >
                  {hovered === item.label && (
                    <motion.span
                      layoutId="nav-hover-pill"
                      className="absolute inset-0 -z-10 rounded-xl bg-white/10"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Action buttons (desktop) */}
          <div className="relative z-10 hidden items-center gap-2 sm:flex">
            <Link
              href="/login"
              className="inline-flex rounded-xl px-3 py-1.5 text-xs font-semibold text-white/80 transition-all duration-200 hover:bg-white/10 hover:text-white sm:text-sm"
            >
              Sign in
            </Link>

            <motion.a
              href="/login"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="rounded-xl bg-gradient-to-r from-violet-600 via-cyan-500 to-emerald-400 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/35 sm:text-sm"
            >
              Get started
            </motion.a>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="relative z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-white transition-colors hover:bg-white/10 sm:hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              {open ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <X size={18} />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <Menu size={18} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Scroll progress hairline */}
          <motion.div
            style={{ scaleX: scrollYProgress }}
            className="absolute bottom-0 left-0 right-0 h-[2px] origin-left bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 opacity-80"
          />
        </motion.div>

        {/* Mobile dropdown panel */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 right-0 top-[calc(100%+10px)] overflow-hidden rounded-2xl border border-white/15 bg-[#02161f]/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:hidden"
            >
              <div className="flex flex-col gap-1">
                {NAV_ITEMS.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.04 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={
                        item.isInstall
                          ? 'flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-300'
                          : 'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/10 hover:text-white'
                      }
                    >
                      {item.isInstall && <Smartphone size={14} className="text-cyan-400" />}
                      {item.label}
                    </Link>
                  </motion.div>
                ))}

                <div className="my-1 h-px bg-white/10" />

                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + NAV_ITEMS.length * 0.04 }}
                  className="flex items-center gap-2 px-1"
                >
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-white/85 hover:bg-white/10 hover:text-white"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-cyan-500 to-emerald-400 px-4 py-2.5 text-center text-sm font-bold text-white shadow-lg shadow-cyan-500/20"
                  >
                    Get started
                    <ArrowRight size={14} />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </nav>
  );
}
