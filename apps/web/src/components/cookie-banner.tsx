'use client';

import { useEffect, useState } from 'react';
import { X, Cookie } from 'lucide-react';

export function CookieBanner() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShow(false);
  };

  const decline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setShow(false);
  };

  if (!mounted || !show) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/95 backdrop-blur-sm px-4 py-4 md:px-6 md:py-3"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="mx-auto max-w-4xl flex flex-col items-center justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3 text-sm text-neutral-300">
          <Cookie className="h-5 w-5 text-neutral-400" aria-hidden="true" />
          <p>
            We use cookies to improve your experience, analyze traffic, and enable authentication.{' '}
            <a href="/privacy" className="underline hover:text-white transition">
              Privacy Policy
            </a>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={decline}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-white/10 transition"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-neutral-100 transition"
          >
            Accept
          </button>
          <button
            onClick={accept}
            className="md:hidden p-2 text-neutral-400 hover:text-white transition"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <button
          className="md:block hidden p-2 text-neutral-400 hover:text-white transition"
          onClick={accept}
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}