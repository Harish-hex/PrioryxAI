"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, CreditCard, Sparkles, X } from "lucide-react";
import { useState } from "react";

interface PricingModalProps {
  open: boolean;
  onClose: () => void;
}

export function PricingModal({ open, onClose }: PricingModalProps) {
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setError("Payments are disabled until Razorpay is configured on the hosted app.");
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
                  Upgrade
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-white">Plan every deadline before it becomes noise.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
                  Start free, then unlock deeper scheduling, recruiter polish, and unlimited assistant context once payments are configured.
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
              <p className="mt-4 rounded-lg border border-signal/25 bg-signal/10 px-4 py-2 text-sm text-signal">{error}</p>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Plan
                cta="Continue free"
                features={["25 AI-ranked tasks", "Basic profile page", "Manual task capture", "Weekly priority feed"]}
                name="Free"
                price="₹0"
                onAction={onClose}
              />
              <div className="rounded-lg accent-border p-px shadow-glow">
                <Plan
                  cta="Payments coming soon"
                  featured
                  features={[
                    "Unlimited AI planning",
                    "Auto-scheduled focus blocks",
                    "Recruiter profile optimization",
                    "GitHub and calendar context",
                  ]}
                  name="Pro"
                  price="₹99"
                  onAction={handleUpgrade}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface PlanProps {
  cta: string;
  featured?: boolean;
  features: string[];
  name: string;
  price: string;
  onAction: () => void;
  disabled?: boolean;
}

function Plan({ cta, featured = false, features, name, price, onAction, disabled }: PlanProps) {
  return (
    <div className={`h-full rounded-lg p-5 ${featured ? "bg-black/80" : "border border-white/10 bg-white/[0.045]"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{name}</h3>
          <p className="mt-2 text-sm text-neutral-500">{featured ? "For serious semester execution" : "For getting started"}</p>
        </div>
        {featured && <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-black">Popular</span>}
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
        disabled={disabled}
        className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed ${
          featured ? "bg-white text-black" : "border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
        }`}
      >
        {featured && <CreditCard size={16} />}
        {cta}
      </button>
    </div>
  );
}
