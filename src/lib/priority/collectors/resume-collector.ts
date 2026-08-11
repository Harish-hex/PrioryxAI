import { SupabaseClient } from '@supabase/supabase-js'

export interface ResumeSignal {
  type: 'learning'
  gapSkill: string
  description: string
  whyNow: string
  actionUrl: string
  urgencyScore: number
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  estimatedMinutes: number
}

export async function collectResumeSignals(
  db: SupabaseClient,
  userId: string,
  targetCompanies: string[]
): Promise<ResumeSignal[]> {
  const { data: resume } = await db
    .from('user_resumes')
    .select('swot, skill_entities')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!resume) return []

  const swot = resume.swot as {
    critical_gaps?: string[]
    weaknesses?: string[]
    recommended_skills?: string[]
  } | null

  const gaps = [
    ...(swot?.critical_gaps ?? []),
    ...(swot?.weaknesses ?? []).slice(0, 2)
  ].filter(Boolean).slice(0, 3)

  if (!gaps.length) return []

  const topCompany = targetCompanies[0] ?? 'top companies'

  return gaps.map((gap, i) => ({
    type: 'learning' as const,
    gapSkill: gap,
    description: `Learn ${gap} — identified as a critical gap in your resume AI analysis`,
    whyNow: `${topCompany} expects ${gap} — this skill gap is blocking your applications`,
    actionUrl: `/career/resume/upload`,
    urgencyScore: 65 - i * 5,
    priority: (i === 0 ? 'HIGH' : 'MEDIUM') as 'HIGH' | 'MEDIUM' | 'LOW',
    estimatedMinutes: 60
  }))
}
