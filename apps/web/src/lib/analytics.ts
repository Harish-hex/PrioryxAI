"use client";

/**
 * Thin, typed wrapper around posthog-js. Every function is a no-op if
 * NEXT_PUBLIC_POSTHOG_KEY isn't set, so this is safe to call from
 * anywhere without needing to guard every call site - the spec's event
 * list is intentionally large (onboarding funnel, NBA lifecycle,
 * outcomes), and most of those UI surfaces don't exist yet, so this file
 * ships the typed event vocabulary now and call sites are added
 * incrementally as each feature is built (Step 7 NBA/score UI, etc.).
 */

import posthog from "posthog-js";

let initialized = false;

export function initAnalytics(): void {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    capture_pageview: true,
  });
  initialized = true;
}

type AnalyticsEvent =
  | { name: "signup_completed"; props: { source?: string; career_goal?: string; college?: string } }
  | { name: "onboarding_step_completed"; props: { step: number; time_spent_ms?: number } }
  | { name: "github_connected"; props: Record<string, never> }
  | { name: "github_sync_completed"; props: { repo_count?: number; health_score?: number } }
  | { name: "resume_uploaded"; props: Record<string, never> }
  | { name: "resume_parsed"; props: { skills_count?: number; resume_score?: number } }
  | { name: "calendar_connected"; props: Record<string, never> }
  | { name: "nba_viewed"; props: { action_category: string; rank: number; impact_score: number } }
  | { name: "nba_started"; props: { action_id: string; action_category: string } }
  | { name: "nba_completed"; props: { action_id: string; time_to_complete_ms?: number; readiness_delta?: number } }
  | { name: "nba_skipped"; props: { action_id: string; reason?: string } }
  | { name: "score_viewed"; props: { score: number; delta_from_last_week?: number } }
  | { name: "outcome_logged"; props: { type: string; company?: string; readiness_score_at_time?: number } }
  | { name: "job_viewed"; props: { job_id: string } }
  | { name: "job_applied"; props: { job_id: string } };

export function track<E extends AnalyticsEvent>(event: E["name"], props?: E["props"]): void {
  if (!initialized || typeof window === "undefined") return;
  posthog.capture(event, props ?? {});
}

export function identify(userId: string, traits?: Record<string, unknown>): void {
  if (!initialized || typeof window === "undefined") return;
  posthog.identify(userId, traits);
}
