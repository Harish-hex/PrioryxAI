"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, CreditCard, Loader2, Lock, Sparkles, X } from "lucide-react";
import { useState } from "react";

interface PricingModalProps {
  open: boolean;
  onClose: () => void;
  isPro: boolean;
}

export function PricingModal({ open, onClose, isPro }: PricingModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/subscribe", { method: "POST" });
      const data = await res.json();

      if (res.ok && data.short_url) {
        window.location.href = data.short_url;
        return;
      }

      const staticLink = process.env.NEXT_PUBLIC_RAZORPAY_PAYMENT_LINK;
      if (staticLink) {
        window.location.href = staticLink;
        return;
      }

      setError("Payment not configured. Please contact support.");
      setLoading(false);
    } catch {
      const staticLink = process.env.NEXT_PUBLIC_RAZORPAY_PAYMENT_LINK;
      if (staticLink) {
        window.location.href = staticLink;
        return;
      }
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/28 p-4 backdrop-blur-md"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-strong w-full max-w-3xl overflow-y-auto rounded-[28px] p-5 sm:rounded-[36px] sm:p-7"
            style={{ maxHeight: "calc(100dvh - 2rem)" }}
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600">
                  <Sparkles size={15} />
                  {isPro ? "You're on Pro" : "Upgrade"}
                </div>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
                  {isPro ? "Pro is active on your account." : "Plan every deadline before it turns into noise."}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                  {isPro
                    ? "You have unlimited AI planning, auto-scheduling, and recruiter profile features."
                    : "Start with a clean free workspace, then unlock smarter scheduling, deeper context, and more automation."}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                aria-label="Close pricing modal"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <p className="mt-4 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {/* Free plan */}
              <div className="h-full rounded-[30px] border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-slate-950">Free</h3>
                    <p className="mt-2 text-sm text-slate-500">For getting started</p>
                  </div>
                </div>
                <div className="mt-6 flex items-end gap-1">
                  <span className="text-4xl font-semibold tracking-tight text-slate-950">₹0</span>
                  <span className="pb-1 text-sm text-slate-500">/month</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {freeItems.map(({ label, locked }) => (
                    <li key={label} className="flex gap-3 text-sm leading-6 text-slate-600">
                      {locked ? (
                        <Lock className="mt-0.5 shrink-0 text-slate-300" size={15} />
                      ) : (
                        <Check className="mt-0.5 shrink-0 text-slate-700" size={15} />
                      )}
                      <span className={locked ? "text-slate-400 line-through" : ""}>{label}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  Continue free
                </button>
              </div>

              {/* Pro plan */}
              <div className="h-full rounded-[30px] border border-slate-950 bg-slate-950 p-6 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-white">Pro</h3>
                    <p className="mt-2 text-sm text-slate-300">
                      {isPro ? "Active on your account" : "For focused semester execution"}
                    </p>
                  </div>
                  {isPro ? (
                    <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-black">Active</span>
                  ) : (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-950">Popular</span>
                  )}
                </div>
                <div className="mt-6 flex items-end gap-1">
                  <span className="text-4xl font-semibold tracking-tight text-white">₹59</span>
                  <span className="pb-1 text-sm text-slate-400">/month</span>
                  <span className="ml-2 rounded-full bg-emerald-400 px-2 py-0.5 text-xs font-semibold text-black">40% off</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {proFeatures.map((f) => (
                    <li key={f.label} className="flex gap-3 text-sm leading-6 text-slate-200">
                      <Check className="mt-0.5 shrink-0 text-white" size={15} />
                      <span>
                        {f.label}
                        {f.sub && <span className="block text-xs text-slate-400">{f.sub}</span>}
                      </span>
                    </li>
                  ))}
                </ul>

                {isPro ? (
                  <div className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white">
                    <Sparkles size={15} /> Pro Active ✓
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleUpgrade}
                      disabled={loading}
                      className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:opacity-60"
                    >
                      {loading ? (
                        <><Loader2 size={16} className="animate-spin" /> Redirecting…</>
                      ) : (
                        <><CreditCard size={16} /> Upgrade to Pro — ₹59/month</>
                      )}
                    </button>
                    <p className="mt-3 text-center text-xs text-slate-400">
                      Secure payment via Razorpay · Pro activates within minutes
                    </p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const proFeatures: { label: string; sub?: string }[] = [
  { label: "Unlimited AI messages", sub: "Context-aware study & career plans" },
  { label: "Full task feed access", sub: "View and prioritize 100+ opportunities" },
  { label: "Internshala Direct Match", sub: "Browse roles matching your specific skills" },
  { label: "AI Generated Resume", sub: "Auto-generates from your GitHub & skills" },
  { label: "Project Foundry", sub: "1-click codebase setup for portfolio projects" },
  { label: "10 timetable/exam uploads/day", sub: "Auto-extracts class & test schedules" },
  { label: "Pro badge on public profile", sub: "Stand out to recruiters" },
];

const freeItems: { label: string; locked: boolean }[] = [
  { label: "20 AI messages/day", locked: false },
  { label: "5 AI-ranked feed items", locked: false },
  { label: "Basic priority scoring", locked: false },
  { label: "GitHub contribution streaks", locked: false },
  { label: "Full task feed access", locked: true },
  { label: "Project Foundry generation", locked: true },
  { label: "AI Generated Resume download", locked: true },
];
