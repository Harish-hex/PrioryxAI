import { SupabaseClient } from '@supabase/supabase-js'

export interface SubjectSignal {
  type: 'subject_study'
  subject: string
  topic: string
  actionTitle: string
  actionDescription: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  urgencyScore: number
  estimatedMinutes: number
}

export async function collectSubjectSignals(
  db: SupabaseClient,
  userId: string
): Promise<SubjectSignal[]> {
  const { data: userProfile } = await db
    .from('users')
    .select('subjects')
    .eq('id', userId)
    .maybeSingle()

  const subjects = (userProfile?.subjects as string[]) ?? []
  if (!subjects.length) {
    return []
  }

  // Pick a random subject from their profile
  const randomIndex = Math.floor(Math.random() * subjects.length)
  const chosenSubject = subjects[randomIndex]

  // We could use AI here, but for speed and reliability we can just suggest a generic deep dive or study session
  return [
    {
      type: 'subject_study',
      subject: chosenSubject,
      topic: chosenSubject,
      actionTitle: `Study: ${chosenSubject} Core Concepts`,
      actionDescription: `Spend a focus block reviewing fundamental concepts or past materials for ${chosenSubject}. Solidifying academics is key to passing initial screening.`,
      priority: 'MEDIUM',
      urgencyScore: 75, // Moderate urgency so it goes to "All Tasks"
      estimatedMinutes: 45
    }
  ]
}
