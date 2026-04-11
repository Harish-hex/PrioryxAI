"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, CreditCard, Loader2, Sparkles, X } from "lucide-react";
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
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/payments/subscribe", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to start subscription. Please try again.");
        return;
      }

      if (data.short_url) {
        // Redirect to Razorpay hosted payment page.
        // user_id is embedded in subscription notes so the webhook can
        // reliably activate pro_status without guessing from email.
        window.location.href = data.short_url;
      } else {
        setError("No payment URL returned. Please contact support.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
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
                features={["25 AI-ranked tasks", "Basic profile page", "Manual task capture", "3 timetable uploads/day"]}
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
                        <li key={f} className="flex gap-3 text-sm text-neutral-300">
                          <Check className="mt-0.5 shrink-0 text-mint" size={16} />
                          <span>{f}</span>
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
                        <li key={f} className="flex gap-3 text-sm text-neutral-300">
                          <Check className="mt-0.5 shrink-0 text-mint" size={16} />
                          <span>{f}</span>
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
                      Secure payment via Razorpay. Pro access activates within minutes.
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

const proFeatures = [
  "Unlimited AI planning",
  "Auto-scheduled focus blocks",
  "Recruiter profile optimization",
  "10 timetable uploads/day",
  "Full feed — no task limit",
];

function Plan({ cta, features, name, price, onAction }: {
  cta: string;
  features: string[];
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
      <ul className="mt-5 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex gap-3 text-sm text-neutral-300">
            <Check className="mt-0.5 shrink-0 text-mint" size={16} />
            <span>{feature}</span>
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
