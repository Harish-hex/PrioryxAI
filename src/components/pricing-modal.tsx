"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, CreditCard, Loader2, Lock, X } from "lucide-react";
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
            className="neu-card w-full max-w-3xl overflow-y-auto rounded-[32px] p-6 sm:rounded-[36px] sm:p-8 shadow-2xl"
            style={{ maxHeight: "calc(100dvh - 2rem)" }}
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="neu-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                  {isPro ? "You're on Pro" : "Upgrade"}
                </div>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                  {isPro ? "Pro is active on your account." : "Plan every deadline before it turns into noise."}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {isPro
                    ? "You have unlimited AI planning, auto-scheduling, and recruiter profile features."
                    : "Start with a clean free workspace, then unlock smarter scheduling, deeper context, and more automation."}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="neu-btn inline-flex h-11 w-11 items-center justify-center rounded-2xl text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                aria-label="Close pricing modal"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <p className="neu-inset mt-4 rounded-[22px] px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-400">
                {error}
              </p>
            )}

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              {/* Free plan */}
              <div className="neu-raised-sm flex flex-col justify-between h-full rounded-[30px] p-6 text-left">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">Free</h3>
                      <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">For getting started</p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-end gap-1">
                    <span className="text-4xl font-bold tracking-tight text-slate-950 dark:text-white">₹0</span>
                    <span className="pb-1 text-sm font-medium text-slate-500 dark:text-slate-400">/month</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {freeItems.map(({ label, locked }) => (
                      <li key={label} className="flex gap-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
                        {locked ? (
                          <Lock className="mt-0.5 shrink-0 text-slate-400" size={15} />
                        ) : (
                          <Check className="mt-0.5 shrink-0 text-slate-900 dark:text-white font-bold" size={15} />
                        )}
                        <span className={locked ? "text-slate-400 dark:text-slate-500 line-through" : "font-medium"}>{label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="neu-btn mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 transition dark:text-slate-200"
                >
                  Continue free
                </button>
              </div>

              {/* Pro plan */}
              <div className="neu-card flex flex-col justify-between h-full rounded-[30px] p-6 bg-slate-950 text-white dark:bg-white dark:text-slate-950 text-left">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-white dark:text-slate-950">Pro</h3>
                      <p className="mt-1 text-xs font-medium text-slate-400 dark:text-slate-600">
                        {isPro ? "Active on your account" : "For focused semester execution"}
                      </p>
                    </div>
                    {isPro ? (
                      <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-black">Active</span>
                    ) : (
                      <span className="neu-pill rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-400 dark:text-emerald-700">Popular</span>
                    )}
                  </div>
                  <div className="mt-5 flex items-end gap-1">
                    <span className="text-4xl font-bold tracking-tight text-white dark:text-slate-950">₹59</span>
                    <span className="pb-1 text-sm text-slate-400 dark:text-slate-600">/month</span>
                    <span className="ml-2 rounded-full bg-emerald-400 px-2 py-0.5 text-xs font-bold text-black">40% off</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {proFeatures.map((f) => (
                      <li key={f.label} className="flex gap-3 text-sm leading-6 text-slate-200 dark:text-slate-800">
                        <Check className="mt-0.5 shrink-0 text-emerald-400 dark:text-emerald-600 stroke-[3]" size={15} />
                        <span className="font-medium">
                          {f.label}
                          {f.sub && <span className="block text-xs text-slate-400 dark:text-slate-500 font-normal">{f.sub}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {isPro ? (
                  <div className="neu-pill-inset mt-7 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-emerald-400 dark:text-emerald-700">
                    Pro Active
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleUpgrade}
                      disabled={loading}
                      className="neu-btn mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100 disabled:opacity-60 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
                    >
                      {loading ? (
                        <><Loader2 size={16} className="animate-spin" /> Redirecting…</>
                      ) : (
                        <><CreditCard size={16} /> Upgrade to Pro — ₹59/month</>
                      )}
                    </button>
                    <p className="mt-3 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500">
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
  { label: "Unlimited AI messages", sub: "No daily cap, context aware" },
  { label: "Full task feed", sub: "All matches ranked, no 5-task cap" },
  { label: "Plan with AI on any task", sub: "Instant action plan per deadline" },
  { label: "Priority scoring (0–100)", sub: "See which task to do first and why" },
  { label: "Auto-scheduled focus blocks", sub: "AI slots tasks into your calendar" },
  { label: "10 timetable uploads/day", sub: "PDF, DOC, image — all formats" },
  { label: "Pro badge on public profile", sub: "Visible to recruiters" },
];

const freeItems: { label: string; locked: boolean }[] = [
  { label: "5 AI-ranked tasks visible", locked: false },
  { label: "3 AI messages/day", locked: false },
  { label: "Unlimited timetable uploads", locked: false },
  { label: "Basic public profile", locked: false },
  { label: "Plan with AI", locked: true },
  { label: "Priority scoring", locked: true },
  { label: "Auto-scheduling", locked: true },
];
