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

  function handleUpgrade() {
    const paymentUrl = process.env.NEXT_PUBLIC_RAZORPAY_PAYMENT_LINK;
    if (!paymentUrl) {
      setError("Payment link not configured. Please contact support.");
      return;
    }
    setLoading(true);
    // Keep spinner going — page is navigating away
    window.location.href = paymentUrl;
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-xl"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-strong w-full max-w-3xl rounded-lg p-5"
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-aura/25 bg-aura/10 px-3 py-1.5 text-sm text-violet-100">
                  <Sparkles size={15} />
                  {isPro ? "You're on Pro" : "Upgrade"}
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-white">
                  {isPro ? "Pro is active on your account." : "Plan every deadline before it becomes noise."}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
                  {isPro
                    ? "You have unlimited AI planning, auto-scheduling, and recruiter profile features."
                    : "Unlock deeper scheduling, recruiter polish, and unlimited assistant context."}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/10 bg-white/[0.05] p-2 text-neutral-400 transition hover:text-white"
                aria-label="Close pricing modal"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Plan
                cta="Continue free"
                name="Free"
                price="₹0"
                onAction={onClose}
              />
              <div className="rounded-lg accent-border p-px shadow-glow">
                {isPro ? (
                  <div className="h-full rounded-lg bg-black/80 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Pro</h3>
                        <p className="mt-2 text-sm text-neutral-500">Active on your account</p>
                      </div>
                      <span className="rounded-lg bg-mint px-2.5 py-1 text-xs font-semibold text-black">Active</span>
                    </div>
                    <div className="mt-5 flex items-end gap-1">
                      <span className="text-4xl font-semibold text-white">₹99</span>
                      <span className="pb-1 text-sm text-neutral-500">/month</span>
                    </div>
                    <ul className="mt-5 space-y-3">
                      {proFeatures.map((f) => (
                        <li key={f.label} className="flex gap-3 text-sm">
                          <Check className="mt-0.5 shrink-0 text-mint" size={15} />
                          <span>
                            <span className="text-neutral-200">{f.label}</span>
                            {f.sub && <span className="block text-xs text-neutral-500 mt-0.5">{f.sub}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-mint/20 bg-mint/10 px-4 py-3 text-sm font-semibold text-mint">
                      <Sparkles size={15} /> Pro Active ✓
                    </div>
                  </div>
                ) : (
                  <div className="h-full rounded-lg bg-black/80 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Pro</h3>
                        <p className="mt-2 text-sm text-neutral-500">For serious semester execution</p>
                      </div>
                      <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-black">Popular</span>
                    </div>
                    <div className="mt-5 flex items-end gap-1">
                      <span className="text-4xl font-semibold text-white">₹99</span>
                      <span className="pb-1 text-sm text-neutral-500">/month</span>
                    </div>
                    <ul className="mt-5 space-y-3">
                      {proFeatures.map((f) => (
                        <li key={f.label} className="flex gap-3 text-sm">
                          <Check className="mt-0.5 shrink-0 text-mint" size={15} />
                          <span>
                            <span className="text-neutral-200">{f.label}</span>
                            {f.sub && <span className="block text-xs text-neutral-500 mt-0.5">{f.sub}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={handleUpgrade}
                      disabled={loading}
                      className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black transition hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <><Loader2 size={16} className="animate-spin" /> Redirecting…</>
                      ) : (
                        <><CreditCard size={16} /> Upgrade to Pro — ₹99/month</>
                      )}
                    </button>
                    <p className="mt-2 text-center text-xs text-neutral-500">
                      Secure payment via Razorpay · Pro activates within minutes
                    </p>
                    <p className="mt-1 text-center text-xs text-neutral-600">
                      Join 100+ students who upgraded this semester
                    </p>
                  </div>
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
  { label: "1 timetable upload/day", locked: false },
  { label: "Basic public profile", locked: false },
  { label: "Plan with AI", locked: true },
  { label: "Priority scoring", locked: true },
  { label: "Auto-scheduling", locked: true },
];

function Plan({ cta, name, price, onAction }: {
  cta: string;
  name: string;
  price: string;
  onAction: () => void;
}) {
  return (
    <div className="h-full rounded-lg border border-white/10 bg-white/[0.045] p-5">
      <div>
        <h3 className="text-lg font-semibold text-white">{name}</h3>
        <p className="mt-2 text-sm text-neutral-500">For getting started</p>
      </div>
      <div className="mt-5 flex items-end gap-1">
        <span className="text-4xl font-semibold text-white">{price}</span>
        <span className="pb-1 text-sm text-neutral-500">/month</span>
      </div>
      <ul className="mt-5 space-y-2.5">
        {freeItems.map(({ label, locked }) => (
          <li key={label} className="flex items-center gap-3 text-sm">
            {locked ? (
              <Lock className="mt-0.5 shrink-0 text-neutral-600" size={14} />
            ) : (
              <Check className="mt-0.5 shrink-0 text-mint" size={14} />
            )}
            <span className={locked ? "text-neutral-600 line-through" : "text-neutral-300"}>{label}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onAction}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
      >
        {cta}
      </button>
    </div>
  );
}
