'use client';

import Link from 'next/link';
import { Mail } from 'lucide-react';

const SOCIAL_LINKS = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/prioryx.ai/',
    icon: (
      <svg className="w-4 h-4 fill-none stroke-current stroke-[2] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 24 24">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/company/prioryxai/',
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.65 1.65 0 1 0 0 3.3 1.65 1.65 0 0 0 0-3.3z" />
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/15 bg-[#02161f] overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 pt-10 sm:pt-14 pb-6 sm:pb-8">
        {/* Top: tagline + link columns */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-14 mb-14 sm:mb-20">
          <div className="max-w-xs">
            <p className="text-xl sm:text-2xl font-black text-white tracking-tight leading-[1.15]">
              Get in{' '}
              <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                touch.
              </span>
            </p>
            <p className="text-cyan-300 text-xs sm:text-sm mt-3 font-semibold">
              <a href="mailto:prioryxai@gmail.com" className="hover:underline transition inline-flex items-center gap-1.5">
                <Mail size={14} className="text-cyan-400 shrink-0" />
                <span>prioryxai@gmail.com</span>
              </a>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8 sm:gap-14 shrink-0">
            <div>
              <h4 className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-3">Product</h4>
              <ul className="space-y-2">
                {[
                  ['Features', '/#features'],
                  ['How it works', '/#how-it-works'],
                  ['Pricing', '/pricing'],
                  ['Install App', '/install'],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-slate-300 text-xs sm:text-sm font-medium hover:text-cyan-300 transition-colors whitespace-nowrap">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-3">Account</h4>
              <ul className="space-y-2">
                {[
                  ['Sign in', '/login'],
                  ['Get started free', '/login'],
                  ['Feed', '/feed'],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-slate-300 text-xs sm:text-sm font-medium hover:text-cyan-300 transition-colors whitespace-nowrap">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-3">Legal</h4>
              <ul className="space-y-2">
                {[
                  ['Privacy Policy', '/privacy'],
                  ['Terms of Service', '/terms'],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-slate-300 text-xs sm:text-sm font-medium hover:text-cyan-300 transition-colors whitespace-nowrap">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Giant brand wordmark */}
        <Link
          href="/"
          className="group flex items-baseline select-none justify-center focus-visible:outline-none sm:justify-start"
          aria-label="PrioryxAI home"
          style={{ fontFamily: "'Inter', 'Poppins', 'Montserrat', system-ui, sans-serif" }}
        >
          <span className="leading-none transition-[letter-spacing] duration-500 group-hover:tracking-wide" style={{ fontSize: 'clamp(4rem, 12vw, 12rem)', fontWeight: 900, letterSpacing: '-0.05em' }}><span className="text-white">Priory</span><span style={{ backgroundImage: 'linear-gradient(90deg, #c4b5fd, #7dd3fc)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>x</span><span style={{ backgroundImage: 'linear-gradient(90deg, #7dd3fc, #6ee7b7)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>AI</span></span>
        </Link>

        {/* Bottom bar: copyright on left, circular social icons on right */}
        <div className="mt-10 sm:mt-12 border-t border-white/10 pt-6 sm:pt-7 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-xs font-medium text-center sm:text-left" suppressHydrationWarning>
            © {new Date().getFullYear()} PrioryxAI. All rights reserved.
          </p>

          {/* Circular social media buttons */}
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.name}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.18] border border-white/15 hover:border-cyan-400/40 flex items-center justify-center text-slate-300 hover:text-white transition-all duration-200 hover:scale-105 shadow-sm"
              >
                {item.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
