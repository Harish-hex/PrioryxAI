"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics";

/**
 * Mounted once in the root layout. Calls initAnalytics(), which itself
 * no-ops if NEXT_PUBLIC_POSTHOG_KEY isn't set - so this is safe to render
 * unconditionally.
 */
export function AnalyticsProvider() {
  useEffect(() => {
    initAnalytics();
  }, []);
  return null;
}
