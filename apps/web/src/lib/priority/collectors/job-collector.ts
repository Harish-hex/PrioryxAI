import { SupabaseClient } from '@supabase/supabase-js'
import { buildUserContext } from '@/lib/context/user-context'
import { matchOpportunityToUser } from '@/lib/opportunities/matching'
import { NormalizedOpportunity } from '@/lib/opportunities/types'

export interface JobSignal {
  type: 'job_opportunity'
  opportunityId: string
  title: string
  company: string | null
  applicationUrl: string
  deadline: string | null
  matchScore: number
  reasons: string[]
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  urgencyScore: number
}

const MATCH_THRESHOLD = 75

function rowToOpportunity(row: Record<string, unknown>): NormalizedOpportunity {
  return {
    sourceKey: String(row.source_key),
    externalId: String(row.external_id),
    title: String(row.title),
    company: typeof row.company === 'string' ? row.company : null,
    location: typeof row.location === 'string' ? row.location : null,
    remotePolicy: typeof row.remote_policy === 'string' ? row.remote_policy : null,
    country: typeof row.country === 'string' ? row.country : null,
    deadline: typeof row.deadline === 'string' ? row.deadline : null,
    salaryMin: typeof row.salary_min === 'number' ? row.salary_min : null,
    salaryMax: typeof row.salary_max === 'number' ? row.salary_max : null,
    stipend: typeof row.stipend === 'string' ? row.stipend : null,
    currency: typeof row.currency === 'string' ? row.currency : null,
    eligibility: typeof row.eligibility === 'string' ? row.eligibility : null,
    requiredSkills: Array.isArray(row.required_skills) ? row.required_skills.filter((s): s is string => typeof s === 'string') : [],
    preferredSkills: Array.isArray(row.preferred_skills) ? row.preferred_skills.filter((s): s is string => typeof s === 'string') : [],
    description: typeof row.description === 'string' ? row.description : null,
    applicationUrl: String(row.application_url),
    freshnessAt: String(row.freshness_at),
    rawPayload: typeof row.raw_payload === 'object' && row.raw_payload !== null
      ? row.raw_payload as Record<string, unknown>
      : {},
  }
}

/**
 * Surfaces open job/internship opportunities that score >= 75% against the
 * user's skills, target roles/companies, and projects (via the existing
 * matchOpportunityToUser engine) so they land as "apply now" items in the
 * Priority Feed instead of only showing up in the passive job listing page.
 */
export async function collectJobSignals(
  db: SupabaseClient,
  userId: string
): Promise<JobSignal[]> {
  const { data: rows, error } = await db
    .from('opportunities')
    .select('*')
    .order('freshness_at', { ascending: false })
    .limit(100)

  if (error || !rows || rows.length === 0) {
    return []
  }

  const context = await buildUserContext(db, userId, { taskLimit: 5 })

  const matches = rows
    .map(row => {
      const opportunity = rowToOpportunity(row as Record<string, unknown>)
      const result = matchOpportunityToUser(opportunity, context)
      return { row, opportunity, result }
    })
    .filter(({ result, opportunity }) => {
      if (result.score < MATCH_THRESHOLD) return false
      // Skip expired opportunities
      if (opportunity.deadline && new Date(opportunity.deadline).getTime() < Date.now()) return false
      return true
    })
    .sort((a, b) => b.result.score - a.result.score)
    .slice(0, 5)

  return matches.map(({ row, opportunity, result }) => {
    let daysUntilDeadline: number | null = null
    if (opportunity.deadline) {
      daysUntilDeadline = Math.ceil(
        (new Date(opportunity.deadline).getTime() - Date.now()) / 86_400_000
      )
    }

    const urgencyScore =
      daysUntilDeadline !== null && daysUntilDeadline <= 3 ? 95 :
      daysUntilDeadline !== null && daysUntilDeadline <= 7 ? 85 :
      70 + Math.round((result.score - MATCH_THRESHOLD) / 4)

    const priority: JobSignal['priority'] =
      daysUntilDeadline !== null && daysUntilDeadline <= 3 ? 'CRITICAL' :
      result.score >= 90 ? 'HIGH' :
      'MEDIUM'

    return {
      type: 'job_opportunity' as const,
      opportunityId: String(row.id),
      title: opportunity.title,
      company: opportunity.company,
      applicationUrl: opportunity.applicationUrl,
      deadline: opportunity.deadline,
      matchScore: result.score,
      reasons: result.reasons,
      priority,
      urgencyScore: Math.max(0, Math.min(100, urgencyScore))
    }
  })
}
