'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { PRO_FEATURES } from '@/lib/pro-features';
import {
  Check,
  X,
  Zap,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Lock,
  ChevronDown,
  HelpCircle,
  ArrowRight,
  Gift,
  Building2,
  CheckCircle2,
  Star,
} from 'lucide-react';
import WavesBackground from '@/components/ui/waves-background';
import { FloatingNav } from '@/components/landing/FloatingNav';
import { Footer } from '@/components/landing/Footer';
import { SmoothScroll } from '@/components/landing/SmoothScroll';

type BillingCycle = 'monthly' | 'annual';

export default function PricingPageView() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const isAnnual = billingCycle === 'annual';

  const comparisonCategories = [
    {
      name: 'Priority Feed & Task Intelligence',
      features: [
        { name: 'Priority Tasks in Feed', free: 'Up to 25 tasks', pro: 'Unlimited Tasks', campus: 'Unlimited Tasks' },
        { name: 'AI Urgency × Weightage Algorithm', free: 'Basic ranking', pro: 'Multi-factor dynamic ranking', campus: 'Custom grading weights' },
        { name: 'Timetable OCR Scans', free: '3 scans / day', pro: '10 scans / day', campus: 'Unlimited batch scans' },
        { name: 'Exam & Submission Countdown Timers', free: true, pro: true, campus: true },
        { name: 'Priority Task Snooze & Stage Shifts', free: true, pro: true, campus: true },
      ],
    },
    {
      name: 'Career & Resume Intelligence',
      features: [
        { name: '64+ Skills Extraction from PDF Resume', free: 'Basic (10 skills)', pro: 'Full (64+ skills)', campus: 'Full (64+ skills)' },
        { name: '4-Quadrant SWOT Matrix Analysis', free: false, pro: true, campus: true },
        { name: 'Project Foundry (AI Project Roadmaps)', free: '1 roadmap', pro: '9 personalized roadmaps', campus: 'Custom domain roadmaps' },
        { name: 'Job & Internship Skill Matching', free: 'Top 3 matches', pro: 'Unlimited live matching', campus: 'Campus recruiter pipeline' },
        { name: 'AI-Generated Recruiter Resume PDF', free: false, pro: true, campus: true },
      ],
    },
    {
      name: 'Coding & Portfolio Analytics',
      features: [
        { name: 'GitHub Profile & Repository Sync', free: 'One-time manual', pro: 'Auto sync every 6 hours', campus: 'Auto sync every 6 hours' },
        { name: 'GitHub Health & Commit Streak Score', free: 'Basic score', pro: 'Deep commit analytics', campus: 'Batch student benchmarks' },
        { name: 'LeetCode + HackerRank Automation', free: false, pro: true, campus: true },
        { name: '1v1 Peer DSA Challenges & Leaderboard', free: 'View leaderboard', pro: 'Host & participate', campus: 'Private college contests' },
        { name: '100-Point Placement Score Card', free: 'Summary score', pro: 'Full breakdown & share card', campus: 'Department analytics' },
      ],
    },
    {
      name: 'AI Context Assistant & Support',
      features: [
        { name: 'AI Assistant Daily Messages', free: '5 messages / day', pro: 'Unlimited GPT-4o chats', campus: 'Unlimited GPT-4o chats' },
        { name: 'Syllabus & Timetable Context Engine', free: false, pro: true, campus: true },
        { name: 'Note RAG Vector Search', free: false, pro: true, campus: true },
        { name: 'Customer Support', free: 'Community Discord', pro: 'Priority Email & Discord', campus: 'Dedicated Account Manager' },
      ],
    },
  ];

  const faqs = [
    {
      q: 'How does the ₹59/month Pro subscription work?',
      a: 'The Pro Student plan unlocks all intelligent features including unlimited AI messages, resume SWOT analysis, automated GitHub sync, project foundry roadmaps, and 1v1 challenges. You can subscribe with any Indian UPI app, debit/credit card, or net banking.',
    },
    {
      q: 'Can I cancel anytime?',
      a: 'Yes, absolutely! There are no hidden fees or lock-ins. You can cancel your subscription with a single click from your Settings page anytime. You will retain Pro access until the end of your paid billing period.',
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We support all major payment options: UPI (Google Pay, PhonePe, Paytm, BHIM), Debit & Credit Cards (Visa, Mastercard, RuPay, Amex), and Net Banking across 50+ Indian banks.',
    },
    {
      q: 'What happens if I downgrade to the Free plan?',
      a: 'Your account will revert to Free tier limits. None of your past tasks, notes, or uploaded resumes will be deleted; you will simply be capped at 25 active tasks and 5 AI assistant messages per day.',
    },
    {
      q: 'Is there a discount for annual billing?',
      a: 'Yes! When you choose annual billing at ₹499/year, you save over 30% compared to paying monthly (effectively just ~₹41/month).',
    },
    {
      q: 'Do you offer campus or college bulk licensing?',
      a: 'Yes, college placement cells, clubs (GDSC, ACM, CSI), and university departments can get custom bulk licensing with department analytics and custom contest hosting. Contact us at prioryxai@gmail.com.',
    },
  ];

  return (
    <SmoothScroll>
      <div className="app-background min-h-screen text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-100 relative">
        {/* Dynamic deep-ocean WebGL background */}
        <WavesBackground />

        {/* Floating Header Navigation */}
        <FloatingNav />

        <main className="relative pt-32 pb-24 px-5 max-w-7xl mx-auto">
          {/* Header & Hero */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 mb-5"
            >
              <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-cyan-400/30 bg-[#02161f]/80 backdrop-blur-xl shadow-lg shadow-cyan-500/10">
                <Sparkles size={14} className="text-cyan-400" />
                <span className="text-slate-100 text-xs sm:text-sm font-bold">
                  Student-Friendly Pricing
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black border border-emerald-400/30">
                  Save 30% on Annual
                </span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7 }}
              className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] text-white mb-6 drop-shadow-[0_2px_14px_rgba(0,0,0,0.8)]"
            >
              Invest in your career for less than a{' '}
              <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent filter drop-shadow-[0_2px_18px_rgba(6,182,212,0.4)]">
                cup of coffee.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="text-slate-200 text-base sm:text-lg md:text-xl leading-relaxed mb-10 font-medium"
            >
              Start free forever. Upgrade to Pro when you want AI resume intelligence, automated GitHub sync, and unlimited priority feeds.
            </motion.p>

            {/* Billing Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="inline-flex items-center p-1.5 rounded-2xl bg-[#02161f]/90 border border-white/15 backdrop-blur-2xl shadow-xl"
            >
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`py-2 px-5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  !isAnnual
                    ? 'bg-gradient-to-r from-cyan-300 via-teal-200 to-white text-slate-950 font-black shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`relative py-2 px-5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isAnnual
                    ? 'bg-gradient-to-r from-cyan-300 via-teal-200 to-white text-slate-950 font-black shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>Annual Billing</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                  Save 30%
                </span>
              </button>
            </motion.div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-28 items-stretch">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="rounded-3xl border border-white/20 bg-[#02161f]/80 backdrop-blur-2xl p-8 flex flex-col justify-between shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-black text-2xl">Free Tier</h3>
                  <span className="px-3 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-bold border border-white/15">
                    Starter
                  </span>
                </div>
                <p className="text-slate-300 text-sm mb-6 font-medium">
                  Ideal for casual deadline tracking and basic exam alerts.
                </p>

                <div className="mb-8">
                  <span className="text-5xl font-black text-white">₹0</span>
                  <span className="text-slate-400 text-sm ml-2 font-bold">/ forever</span>
                </div>

                <div className="space-y-3.5 mb-8">
                  {[
                    '25 tasks in priority feed',
                    '5 AI assistant messages / day',
                    '3 timetable scans / day',
                    'GitHub sync (one-time manual)',
                    'Basic placement score',
                    'Public student profile page',
                    'Community Discord support',
                  ].map((feat) => (
                    <div key={feat} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="text-white" />
                      </div>
                      <span className="text-slate-200 text-sm font-medium">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href="/login"
                className="block w-full py-4 rounded-2xl border border-white/25 text-center text-white font-bold text-sm transition-all hover:bg-white/10 shadow-md"
              >
                Get Started Free
              </Link>
            </motion.div>

            {/* Pro Student Plan (Featured) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="relative rounded-3xl overflow-hidden shadow-2xl ring-2 ring-cyan-400 lg:-translate-y-3 flex flex-col justify-between"
            >
              {/* Outer Card with Gradient border */}
              <div className="relative rounded-3xl bg-[#02161f]/95 backdrop-blur-2xl p-8 h-full flex flex-col justify-between">
                {/* Popular Banner */}
                <div className="absolute top-6 right-6">
                  <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-cyan-400/30">
                    Most Popular
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-black text-2xl">Pro Student</h3>
                  </div>
                  <p className="text-cyan-300 text-sm mb-6 font-semibold">
                    Complete academic command &amp; placement acceleration.
                  </p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-white">
                        {isAnnual ? '₹499' : '₹59'}
                      </span>
                      <span className="text-cyan-200 text-sm font-bold">
                        {isAnnual ? '/ year (~₹41/mo)' : '/ month'}
                      </span>
                    </div>
                    {isAnnual && (
                      <p className="text-emerald-400 text-xs font-bold mt-1">
                        Billed annually · Save 30% compared to monthly
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 mb-8">
                    {PRO_FEATURES.map((feat) => (
                      <div key={feat.label} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center flex-shrink-0">
                          <Check size={12} className="text-emerald-400" />
                        </div>
                        <span className="text-slate-100 text-sm font-semibold">{feat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Link
                    href="/login"
                    className="relative block w-full py-4 rounded-2xl text-center font-black text-white overflow-hidden shadow-2xl shadow-cyan-500/30 transition-all hover:scale-102 active:scale-98"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-cyan-500 to-emerald-400" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <span>Upgrade to Pro</span>
                      <ArrowRight size={16} />
                    </span>
                  </Link>
                  <p className="text-slate-400 text-[11px] text-center mt-2.5 font-medium">
                    Instant activation · Secure UPI &amp; Card checkout
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Campus / Society Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="rounded-3xl border border-white/20 bg-[#02161f]/80 backdrop-blur-2xl p-8 flex flex-col justify-between shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-black text-2xl">Campus / Clubs</h3>
                  <Building2 size={22} className="text-violet-400" />
                </div>
                <p className="text-slate-300 text-sm mb-6 font-medium">
                  For GDSC, ACM chapters, coding clubs, and placement cells.
                </p>

                <div className="mb-8">
                  <span className="text-4xl font-black text-white">Custom</span>
                  <span className="text-slate-400 text-sm ml-2 font-bold">/ bulk cohort</span>
                </div>

                <div className="space-y-3.5 mb-8">
                  {[
                    'Everything in Pro Student tier',
                    'Bulk student onboarding for batches',
                    'Custom college leaderboards & DSA duels',
                    'Placement cell admin analytics dashboard',
                    'Custom syllabus grading weights',
                    'Dedicated campus support liaison',
                  ].map((feat) => (
                    <div key={feat} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-400/40 flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="text-violet-400" />
                      </div>
                      <span className="text-slate-200 text-sm font-medium">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <a
                href="mailto:prioryxai@gmail.com?subject=Campus%20Cohort%20Inquiry%20PrioryxAI"
                className="block w-full py-4 rounded-2xl border border-violet-400/40 bg-violet-500/15 text-center text-violet-200 hover:text-white font-bold text-sm transition-all hover:bg-violet-500/25 shadow-md"
              >
                Contact Campus Team
              </a>
            </motion.div>
          </div>

          {/* Payment Trust Signals */}
          <div className="max-w-4xl mx-auto mb-28 p-6 rounded-3xl border border-white/15 bg-[#02161f]/75 backdrop-blur-xl text-center">
            <p className="text-cyan-200 text-xs font-bold uppercase tracking-widest mb-4">
              Accepted Payment Methods
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-300 font-semibold">
              <span className="flex items-center gap-2">
                <CreditCard size={16} className="text-cyan-400" />
                <span>UPI (GPay / PhonePe / Paytm / BHIM)</span>
              </span>
              <span className="flex items-center gap-2">
                <Lock size={16} className="text-emerald-400" />
                <span>All Debit &amp; Credit Cards</span>
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-violet-400" />
                <span>End-to-End Encrypted Checkout</span>
              </span>
            </div>
          </div>

          {/* Feature Comparison Matrix */}
          <div className="max-w-5xl mx-auto mb-28">
            <div className="text-center mb-14">
              <span className="inline-block rounded-full border border-white/30 bg-[#02161f]/80 backdrop-blur-md px-4 py-1 text-xs font-black uppercase tracking-[0.25em] text-cyan-300 shadow-md mb-3">
                Full Comparison
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
                Compare Plan Features
              </h2>
            </div>

            <div className="rounded-3xl border border-white/15 bg-[#02161f]/90 backdrop-blur-2xl overflow-hidden shadow-2xl">
              {/* Header row */}
              <div className="grid grid-cols-12 p-6 border-b border-white/15 bg-white/5 font-black text-sm text-white">
                <div className="col-span-6 sm:col-span-5">Feature</div>
                <div className="col-span-3 sm:col-span-2 text-center text-slate-300">Free (₹0)</div>
                <div className="col-span-3 sm:col-span-3 text-center text-cyan-300 font-black">Pro (₹59/mo)</div>
                <div className="hidden sm:block sm:col-span-2 text-center text-violet-300">Campus</div>
              </div>

              {/* Categories */}
              {comparisonCategories.map((category) => (
                <div key={category.name}>
                  <div className="px-6 py-3.5 bg-white/5 border-b border-white/10 text-cyan-300 text-xs font-black uppercase tracking-wider">
                    {category.name}
                  </div>
                  {category.features.map((feat, idx) => (
                    <div
                      key={feat.name}
                      className={`grid grid-cols-12 px-6 py-4 border-b border-white/10 items-center text-xs sm:text-sm ${
                        idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'
                      }`}
                    >
                      <div className="col-span-6 sm:col-span-5 font-semibold text-slate-100">
                        {feat.name}
                      </div>

                      {/* Free */}
                      <div className="col-span-3 sm:col-span-2 text-center text-slate-300 font-medium">
                        {typeof feat.free === 'boolean' ? (
                          feat.free ? (
                            <Check size={16} className="text-emerald-400 mx-auto" />
                          ) : (
                            <X size={16} className="text-slate-500 mx-auto" />
                          )
                        ) : (
                          feat.free
                        )}
                      </div>

                      {/* Pro */}
                      <div className="col-span-3 sm:col-span-3 text-center text-white font-bold bg-cyan-500/10 py-1.5 rounded-lg border border-cyan-400/20">
                        {typeof feat.pro === 'boolean' ? (
                          feat.pro ? (
                            <Check size={16} className="text-emerald-400 mx-auto" />
                          ) : (
                            <X size={16} className="text-slate-500 mx-auto" />
                          )
                        ) : (
                          feat.pro
                        )}
                      </div>

                      {/* Campus */}
                      <div className="hidden sm:block sm:col-span-2 text-center text-slate-300 font-medium">
                        {typeof feat.campus === 'boolean' ? (
                          feat.campus ? (
                            <Check size={16} className="text-violet-400 mx-auto" />
                          ) : (
                            <X size={16} className="text-slate-500 mx-auto" />
                          )
                        ) : (
                          feat.campus
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="max-w-3xl mx-auto mb-24">
            <div className="text-center mb-12">
              <span className="inline-block rounded-full border border-white/30 bg-[#02161f]/80 backdrop-blur-md px-4 py-1 text-xs font-black uppercase tracking-[0.25em] text-cyan-300 shadow-md mb-3">
                FAQ
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
                Pricing &amp; Payment FAQs
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={faq.q}
                    className="rounded-2xl border border-white/15 bg-[#02161f]/80 backdrop-blur-xl overflow-hidden shadow-lg"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 text-white font-bold text-sm sm:text-base hover:text-cyan-300 transition cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        size={18}
                        className={`text-cyan-400 transform transition-transform duration-300 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="px-5 pb-5 text-slate-300 text-xs sm:text-sm font-medium leading-relaxed border-t border-white/10 pt-3"
                        >
                          {faq.a}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Final Call to Action */}
          <div className="rounded-[32px] overflow-hidden border border-cyan-400/40 bg-gradient-to-br from-[#02161f] via-[#0c364c] to-[#03212f] p-8 sm:p-14 text-center relative shadow-2xl shadow-cyan-500/20">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
                Ready to take control of your semester?
              </h2>
              <p className="text-slate-200 text-sm sm:text-base mb-8 font-medium">
                Get started free in 60 seconds. Upgrade to Pro whenever you are ready.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/login"
                  className="px-8 py-4 rounded-2xl font-black text-slate-950 text-base bg-white hover:bg-slate-100 transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <span>Start Free Today</span>
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/install"
                  className="px-8 py-4 rounded-2xl font-bold text-white text-base border border-white/25 bg-[#02161f]/60 hover:bg-white/10 transition-all"
                >
                  Install Desktop App
                </Link>
              </div>
            </div>
          </div>
        </main>

        {/* Global Footer */}
        <Footer />
      </div>
    </SmoothScroll>
  );
}
