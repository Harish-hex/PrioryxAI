"use client";

import { useEffect, useState } from "react";
import { Download, Share2, Smartphone, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed / running in standalone PWA or Capacitor mode
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // Check if user dismissed recently
    const dismissedAt = localStorage.getItem("prioryx_pwa_dismissed");
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 3 * 24 * 60 * 60 * 1000) {
      return; // Suppress for 3 days after dismissal
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iOSDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // If on iOS and not standalone, show prompt after 4 seconds
    if (iOSDevice && !isStandaloneMode) {
      const timer = setTimeout(() => setShowPrompt(true), 4000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setShowPrompt(false);
    localStorage.setItem("prioryx_pwa_dismissed", Date.now().toString());
  }

  if (isStandalone || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm rounded-[28px] neu-card p-4 shadow-2xl backdrop-blur-xl border border-slate-200/80 dark:border-white/10 lg:bottom-6 lg:left-auto lg:right-6"
      >
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md">
            <img src="/logo-square.png" alt="PrioryxAI App" className="h-8 w-8 object-contain drop-shadow" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Install PrioryxAI App
              </h4>
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                aria-label="Dismiss app install banner"
              >
                <X size={15} />
              </button>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-snug">
              Instant offline access, native push updates & fluid student workspace.
            </p>

            <div className="mt-3 flex items-center gap-2">
              {isIOS ? (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <span>Tap</span>
                  <Share2 size={13} className="text-cyan-500 inline" />
                  <span>then &quot;Add to Home Screen&quot;</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleInstall}
                  className="neu-btn inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                >
                  <Download size={13} />
                  <span>Install App</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDismiss}
                className="text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
