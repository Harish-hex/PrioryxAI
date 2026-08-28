import { SupabaseClient } from '@supabase/supabase-js'

export interface ExamSignal {
  type: 'exam'
  id: string
  title: string
  subjectName: string
  subjectCode?: string
  date: string
  session?: string
  startTime?: string
  venue?: string
  examType?: string
  daysUntil: number
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  urgencyScore: number
}

export async function collectExamSignals(
  db: SupabaseClient,
  userId: string
): Promise<ExamSignal[]> {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const in14Days = new Date(today.getTime() + 14 * 86400000)
    .toISOString().split('T')[0]

  const { data: exams, error } = await db
    .from('schedule_exams')
    .select('*')
    .eq('user_id', userId)
    .gte('date', todayStr)
    .lte('date', in14Days)
    .order('date', { ascending: true })

  if (error) {
    console.error('[ExamCollector]', error.message)
    return []
  }

  return (exams ?? []).map(exam => {
    const examDate = new Date(exam.date)
    const daysUntil = Math.max(0, Math.floor(
      (examDate.getTime() - today.getTime()) / 86400000
    ))

    const urgencyScore =
      daysUntil === 0 ? 100 :
      daysUntil === 1 ? 95 :
      daysUntil <= 3 ? 90 :
      daysUntil <= 5 ? 80 :
      daysUntil <= 7 ? 70 : 50

    const priority: ExamSignal['priority'] =
      daysUntil <= 1 ? 'CRITICAL' :
      daysUntil <= 3 ? 'CRITICAL' :
      daysUntil <= 7 ? 'HIGH' : 'MEDIUM'

    return {
      type: 'exam' as const,
      id: exam.id,
      title: exam.title ?? exam.subject ?? 'Exam',
      subjectName: exam.subject ?? exam.title ?? 'Exam',
      subjectCode: exam.subject_code,
      date: exam.date,
      session: exam.session,
      startTime: exam.start_time,
      venue: exam.location,
      examType: exam.exam_type ?? exam.type,
      daysUntil,
      priority,
      urgencyScore
    }
  })
}
