/**
 * Weekly streak and daily task activity tracker.
 * Cycle: Starts on Sunday (0) and ends on Saturday (6).
 * Automatically resets for the new week after Saturday (starting fresh on Sunday).
 * If a user signs in or completes at least 1 task on a day, that day gets marked as completed.
 * Users can also click any day to manually toggle the tick option.
 */

export const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface WeekDayInfo {
  day: string;
  dateStr: string;
  index: number;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  isCompleted: boolean;
}

/**
 * Returns the current date in YYYY-MM-DD format (local time).
 */
export function getTodayDateStr(dateInput: Date = new Date()): string {
  const year = dateInput.getFullYear();
  const month = String(dateInput.getMonth() + 1).padStart(2, "0");
  const day = String(dateInput.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns the Sunday Date object for the given date (start of the week).
 */
export function getSundayOfWeek(dateInput: Date = new Date()): Date {
  const d = new Date(dateInput);
  const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
  d.setDate(d.getDate() - dayOfWeek);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns the list of completed dates from localStorage for the current active week.
 * Dates prior to the current week's Sunday are pruned so the streak resets after Saturday.
 */
export function getCompletedDays(now: Date = new Date()): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem("prioryx_completed_days");
    if (!raw) return new Set();
    const parsed: string[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();

    // Reset boundary: Sunday of current week
    const sundayStr = getTodayDateStr(getSundayOfWeek(now));
    
    // Filter to only include dates in current week or later
    const validCurrentWeekDates = parsed.filter((dateStr) => dateStr >= sundayStr);
    
    // Prune old history if needed
    if (validCurrentWeekDates.length !== parsed.length) {
      localStorage.setItem("prioryx_completed_days", JSON.stringify(validCurrentWeekDates));
    }

    return new Set(validCurrentWeekDates);
  } catch {
    return new Set();
  }
}

/**
 * Record daily activity or task completion for a given day (defaults to today).
 */
export function recordDailyActivity(dateStr?: string) {
  if (typeof window === "undefined") return;
  const targetDate = dateStr || getTodayDateStr();
  try {
    const raw = localStorage.getItem("prioryx_completed_days");
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(targetDate)) {
      list.push(targetDate);
      localStorage.setItem("prioryx_completed_days", JSON.stringify(list));
    }
    window.dispatchEvent(new CustomEvent("prioryx_activity_updated", { detail: { date: targetDate, completed: true } }));
  } catch {}
}

/**
 * Toggle tick option for a specific day (allows user to manually tick/untick).
 */
export function toggleDailyActivity(dateStr: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("prioryx_completed_days");
    let list: string[] = raw ? JSON.parse(raw) : [];
    const exists = list.includes(dateStr);

    if (exists) {
      list = list.filter((d) => d !== dateStr);
    } else {
      list.push(dateStr);
    }

    localStorage.setItem("prioryx_completed_days", JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("prioryx_activity_updated", { detail: { date: dateStr, completed: !exists } }));
  } catch {}
}

/**
 * Record sign-in activity for today.
 */
export function recordDailyLogin() {
  recordDailyActivity();
}

/**
 * Calculates the current week's 7 days (Sunday through Saturday).
 * After Saturday (on Sunday), the week automatically resets to the new Sunday..Saturday range.
 */
export function getCurrentWeekDays(
  stats?: any,
  now: Date = new Date()
): { days: WeekDayInfo[]; completedCount: number; currentDayIndex: number; weekRange: string } {
  const currentDayIndex = now.getDay(); // 0 = Sun, 6 = Sat
  const todayStr = getTodayDateStr(now);

  // Sunday of current week (reset anchor)
  const sunday = getSundayOfWeek(now);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);

  const completedSet = getCompletedDays(now);

  // Check if today has completed DSA challenges
  if (typeof window !== "undefined") {
    try {
      const dsaRaw = localStorage.getItem(`prioryx_daily_solved_${todayStr}`);
      if (dsaRaw) {
        const dsaSolved = JSON.parse(dsaRaw);
        if (Array.isArray(dsaSolved) && dsaSolved.length > 0) {
          completedSet.add(todayStr);
        }
      }
    } catch {}
  }

  // Check if server stats report completed tasks
  if (stats?.completed_tasks && stats.completed_tasks > 0) {
    completedSet.add(todayStr);
  }

  const days: WeekDayInfo[] = DAYS_OF_WEEK.map((day, index) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + index);
    const dateStr = getTodayDateStr(d);

    const isToday = index === currentDayIndex;
    const isPast = index < currentDayIndex;
    const isFuture = index > currentDayIndex;
    const isCompleted = completedSet.has(dateStr);

    return {
      day,
      dateStr,
      index,
      isToday,
      isPast,
      isFuture,
      isCompleted,
    };
  });

  const completedCount = days.filter((d) => d.isCompleted).length;
  const weekRange = `${sunday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${saturday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  return { days, completedCount, currentDayIndex, weekRange };
}
