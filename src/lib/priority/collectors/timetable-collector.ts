import { SupabaseClient } from '@supabase/supabase-js'
import { SubjectSignal } from './subject-collector'

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

/**
 * Suggests a study block based on the user's actual uploaded class timetable
 * (schedule_timetable), not their free-text profile subjects. Picks a class
 * happening today if there is one, otherwise the next upcoming class this week.
 */
export async function collectTimetableSignals(
  db: SupabaseClient,
  userId: string
): Promise<SubjectSignal[]> {
  const { data: classes, error } = await db
    .from('schedule_timetable')
    .select('*')
    .eq('user_id', userId)

  if (error || !classes || classes.length === 0) {
    return []
  }

  const todayIndex = new Date().getDay()
  const todayName = WEEKDAYS[todayIndex]

  const todaysClasses = classes.filter(
    c => String(c.day).toLowerCase() === todayName
  )

  let chosen: typeof classes[number]
  let whenLabel: string

  if (todaysClasses.length > 0) {
    // Prefer the class with the earliest start time today
    chosen = [...todaysClasses].sort((a, b) =>
      String(a.start_time ?? '').localeCompare(String(b.start_time ?? ''))
    )[0]
    whenLabel = "today's"
  } else {
    // Find the next upcoming class this week
    const sorted = [...classes].sort((a, b) => {
      const aIdx = (WEEKDAYS.indexOf(String(a.day).toLowerCase()) - todayIndex + 7) % 7
      const bIdx = (WEEKDAYS.indexOf(String(b.day).toLowerCase()) - todayIndex + 7) % 7
      if (aIdx !== bIdx) return aIdx - bIdx
      return String(a.start_time ?? '').localeCompare(String(b.start_time ?? ''))
    })
    chosen = sorted[0]
    whenLabel = `upcoming ${chosen.day}`
  }

  if (!chosen?.subject) {
    return []
  }

  return [
    {
      type: 'subject_study',
      subject: chosen.subject,
      topic: chosen.subject,
      actionTitle: `Prep: ${chosen.subject}`,
      actionDescription: `Review notes ahead of ${whenLabel} ${chosen.subject} ${chosen.type || 'class'}${chosen.location ? ` in ${chosen.location}` : ''}.`,
      priority: todaysClasses.length > 0 ? 'HIGH' : 'MEDIUM',
      urgencyScore: todaysClasses.length > 0 ? 80 : 65,
      estimatedMinutes: 45
    }
  ]
}
