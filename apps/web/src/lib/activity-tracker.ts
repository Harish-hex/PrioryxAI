/**
 * Unified Client & Server Activity Tracking System for PrioryxAI.
 * Automatically records every meaningful user action (tasks, YouTube videos, DSA problems,
 * Foundry deliverables, AI assistant conversations, focus sessions, daily logins)
 * and updates real-time streaks and contribution records.
 */

export type ActivityType =
  | "task_completed"
  | "task_created"
  | "task_snoozed"
  | "youtube_watch"
  | "dsa_solved"
  | "dsa_view"
  | "focus_session_completed"
  | "foundry_phase_submitted"
  | "foundry_command"
  | "assistant_prompt"
  | "resume_analysis"
  | "daily_visit";

export interface ActivityEvent {
  id?: string;
  type: ActivityType;
  metadata?: Record<string, any>;
  timestamp: string; // ISO string
  date: string; // YYYY-MM-DD
}

/**
 * Returns today's date string in YYYY-MM-DD (local time).
 */
export function getTodayDateStr(dateInput: Date = new Date()): string {
  const year = dateInput.getFullYear();
  const month = String(dateInput.getMonth() + 1).padStart(2, "0");
  const day = String(dateInput.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculate consecutive active streak days from an array of contribution days.
 */
export function calculateStreakFromDays(
  contributionDays: Array<{ date: string; count: number }>,
  refDate: Date = new Date()
): number {
  if (!contributionDays || contributionDays.length === 0) return 0;

  const countMap = new Map<string, number>();
  for (const item of contributionDays) {
    if (item.count > 0) {
      countMap.set(item.date, item.count);
    }
  }

  const cursor = new Date(refDate);
  const todayStr = getTodayDateStr(cursor);
  
  // Check if today has activity
  let streak = 0;
  const todayActive = (countMap.get(todayStr) ?? 0) > 0;

  if (todayActive) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  } else {
    // If today has no activity yet, check if yesterday was active to preserve streak
    cursor.setDate(cursor.getDate() - 1);
    const yesterdayStr = getTodayDateStr(cursor);
    if ((countMap.get(yesterdayStr) ?? 0) === 0) {
      return 0;
    }
  }

  // Count backwards consecutive days
  while (true) {
    const dStr = getTodayDateStr(cursor);
    if ((countMap.get(dStr) ?? 0) > 0) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Records any user activity on the website.
 * - Stores locally in localStorage for instant offline/reactive UI state
 * - Dispatches 'prioryx_activity_updated' CustomEvent
 * - Syncs asynchronously to Supabase via /api/user/activity
 */
export function recordUserActivity(
  type: ActivityType,
  metadata: Record<string, any> = {}
) {
  if (typeof window === "undefined") return;

  const todayStr = getTodayDateStr();
  const nowIso = new Date().toISOString();

  // 1. Update localStorage completed days set
  try {
    const raw = localStorage.getItem("prioryx_completed_days");
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(todayStr)) {
      list.push(todayStr);
      localStorage.setItem("prioryx_completed_days", JSON.stringify(list));
    }

    // 2. Append to local activity log (keep last 50 entries)
    const logRaw = localStorage.getItem("prioryx_activity_log");
    const log: ActivityEvent[] = logRaw ? JSON.parse(logRaw) : [];
    log.unshift({
      type,
      metadata,
      timestamp: nowIso,
      date: todayStr,
    });
    localStorage.setItem("prioryx_activity_log", JSON.stringify(log.slice(0, 50)));
  } catch (err) {
    console.warn("[activity-tracker] LocalStorage write failed:", err);
  }

  // 3. Dispatch global browser event for instant reactive component updates
  window.dispatchEvent(
    new CustomEvent("prioryx_activity_updated", {
      detail: { date: todayStr, type, metadata, timestamp: nowIso },
    })
  );

  // 4. Asynchronously send to server API
  fetch("/api/user/activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activity_type: type, metadata }),
  }).catch(() => {
    // Ignore server sync failure on client side
  });
}

/**
 * Backward compatibility alias for streak-tracker
 */
export function recordDailyActivity(dateStr?: string) {
  recordUserActivity("daily_visit", { date: dateStr || getTodayDateStr() });
}
