/**
 * Weekly Study Scheduler — pure deterministic function.
 *
 * Distributes a user's pending priority tasks across the current week:
 * - Monday–Saturday: a single evening study block after college hours
 *   (18:30–22:00, 210 minutes), since students are in class during the day.
 * - Sunday: a longer, more flexible "productive day" block split into
 *   morning/afternoon/evening sessions with breaks, for deeper work.
 *
 * No I/O — the caller fetches tasks (from priority/engine.ts or
 * priority/llm-planner.ts) and passes them in.
 */

import { PriorityTask } from '@/lib/priority/engine';

export interface ScheduleBlock {
  start: string; // "HH:MM" 24h
  end: string; // "HH:MM" 24h
  label: string; // e.g. "Evening study block" or "Deep work session"
}

export interface DaySchedule {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  date: string; // ISO date for this occurrence of the day, current week
  isWeekend: boolean;
  blocks: ScheduleBlock[];
  tasks: Array<PriorityTask & { block: string }>;
  totalMinutes: number;
}

export interface WeeklySchedule {
  weekStart: string; // ISO date of the Monday this schedule covers
  days: DaySchedule[];
}

const WEEKDAY_NAMES: DaySchedule['day'][] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
];

const WEEKDAY_BLOCKS: ScheduleBlock[] = [
  { start: '18:30', end: '22:00', label: 'Evening study block (after college)' },
];
const WEEKDAY_CAPACITY_MINUTES = 210; // 18:30–22:00

const SUNDAY_BLOCKS: ScheduleBlock[] = [
  { start: '09:00', end: '12:00', label: 'Morning deep work' },
  { start: '14:00', end: '17:00', label: 'Afternoon deep work' },
  { start: '18:30', end: '21:00', label: 'Evening wrap-up & review' },
];
const SUNDAY_CAPACITY_MINUTES = 330; // 3h + 3h + 2.5h

function isoDateOfMonday(referenceDate: Date): Date {
  const d = new Date(referenceDate);
  const day = d.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

const PRIORITY_ORDER: Record<PriorityTask['priority'], number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

/**
 * Greedily bin-packs tasks (already priority-sorted) across the week's days,
 * filling each day's capacity before moving to the next. Sunday gets first
 * pick of leftover deep-work-shaped tasks (>= 90 min) since it has more room.
 */
export function buildWeeklySchedule(
  tasks: PriorityTask[],
  referenceDate: Date = new Date()
): WeeklySchedule {
  const monday = isoDateOfMonday(referenceDate);
  const sorted = [...tasks]
    .filter((t) => !t.completed)
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  const days: DaySchedule[] = WEEKDAY_NAMES.map((name, idx) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + idx);
    const isSunday = name === 'Sunday';
    return {
      day: name,
      date: date.toISOString().split('T')[0],
      isWeekend: isSunday,
      blocks: isSunday ? SUNDAY_BLOCKS : WEEKDAY_BLOCKS,
      tasks: [],
      totalMinutes: 0,
    };
  });

  const capacityFor = (d: DaySchedule) => (d.isWeekend ? SUNDAY_CAPACITY_MINUTES : WEEKDAY_CAPACITY_MINUTES);

  let taskIdx = 0;
  // Round-robin fill: walk days Mon→Sun repeatedly until tasks or capacity runs out,
  // so urgent work lands early in the week rather than all piling onto one day.
  let anyRoomLeft = true;
  while (taskIdx < sorted.length && anyRoomLeft) {
    anyRoomLeft = false;
    for (const day of days) {
      if (taskIdx >= sorted.length) break;
      const task = sorted[taskIdx];
      const remaining = capacityFor(day) - day.totalMinutes;
      if (remaining >= Math.min(task.estimatedMinutes, 15)) {
        const block = day.blocks[day.blocks.length > 1 && task.estimatedMinutes >= 90 ? 1 : 0] ?? day.blocks[0];
        day.tasks.push({ ...task, block: block.label });
        day.totalMinutes += task.estimatedMinutes;
        taskIdx += 1;
        anyRoomLeft = true;
      }
    }
  }

  return { weekStart: monday.toISOString().split('T')[0], days };
}
