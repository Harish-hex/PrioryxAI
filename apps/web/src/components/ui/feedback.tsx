"use client";

/**
 * Shared feedback primitives: skeletons, empty states, error banners.
 *
 * Most pages previously showed a bare centred spinner while loading, nothing
 * at all when a list came back empty, and raw `err.message` strings (often
 * "Failed to fetch" or a Postgres code) on failure. These are the reusable
 * pieces for fixing that consistently, in the existing slate/indigo language
 * and with dark-mode variants.
 */

import type { ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

/* ── Skeletons ─────────────────────────────────────────────────── */

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 dark:bg-slate-700 ${className}`} />;
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonLine className="h-4 w-1/3" />
          <SkeletonLine className="h-3 w-1/2" />
        </div>
      </div>
      {lines > 2 && (
        <div className="mt-4 space-y-2">
          {Array.from({ length: lines - 2 }).map((_, i) => (
            <SkeletonLine key={i} className="h-3 w-full" />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Page-level placeholder that mirrors a typical header + card grid, so the
 * layout does not jump when real content arrives.
 */
export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="space-y-3">
        <SkeletonLine className="h-8 w-56" />
        <SkeletonLine className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

/* ── Empty state ───────────────────────────────────────────────── */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 px-6 py-12 text-center dark:border-slate-700">
      {icon && <div className="mx-auto mb-4 w-fit text-slate-300 dark:text-slate-600">{icon}</div>}
      <h3 className="font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {description}
      </p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/* ── Errors ────────────────────────────────────────────────────── */

/**
 * Turns whatever was thrown into something a student can act on.
 * Raw messages like "Failed to fetch", "NetworkError" or a bare Postgres code
 * are meaningless to the user, so they get mapped to plain language.
 */
export function friendlyError(err: unknown): string {
  const raw =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";

  if (!raw) return "Something went wrong. Please try again.";

  const l = raw.toLowerCase();
  if (l.includes("failed to fetch") || l.includes("networkerror") || l.includes("load failed"))
    return "Can't reach the server. Check your connection and try again.";
  if (l.includes("abort") || l.includes("timeout") || l.includes("timed out"))
    return "That took too long to respond. Please try again in a moment.";
  if (l.includes("unauthorized") || l.includes("401"))
    return "Your session expired. Please sign in again.";
  if (l.includes("forbidden") || l.includes("403"))
    return "You don't have access to this yet.";
  if (l.includes("not found") || l.includes("404"))
    return "We couldn't find that. It may have been removed.";
  if (l.includes("rate") && l.includes("limit"))
    return "You've hit the usage limit. Try again shortly.";
  if (l.includes("500") || l.includes("internal server"))
    return "Something broke on our side. We're on it — please retry.";
  // Never surface stack traces, JSON blobs or driver codes.
  if (raw.length > 140 || raw.startsWith("{") || /^[A-Z0-9_]{5,}$/.test(raw))
    return "Something went wrong. Please try again.";
  return raw;
}

export function ErrorBanner({
  error,
  onRetry,
  className = "",
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20 ${className}`}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      <p className="min-w-0 flex-1 text-sm text-red-700 dark:text-red-300">{friendlyError(error)}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-red-300 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 active:scale-95 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30"
        >
          <RefreshCw size={13} /> Retry
        </button>
      )}
    </div>
  );
}
