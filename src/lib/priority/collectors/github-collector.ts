import { SupabaseClient } from '@supabase/supabase-js'
import { generateRepoNextStep } from '../../repo-next-step'

export interface GitHubSignal {
  type: 'github'
  repoName: string
  repoUrl: string
  actionTitle: string
  actionDescription: string
  fixDescription: string
  suggestedCommands?: string
  weaknessCategory: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  urgencyScore: number
  impactArea: string
  estimatedMinutes: number
  effort: 'quick' | 'medium' | 'deep'
}

export async function collectGitHubSignals(
  db: SupabaseClient,
  userId: string
): Promise<GitHubSignal[]> {
  // Try dedicated priority actions table first
  const { data: actions } = await db
    .from('github_priority_actions')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', false)
    .eq('dismissed', false)
    .order('impact_score', { ascending: false })
    .limit(8)

  if (actions?.length) {
    return actions.map(a => ({
      type: 'github' as const,
      repoName: String(a.repo_name ?? ''),
      repoUrl: String(a.repo_url ?? `https://github.com/${a.repo_name ?? ''}`),
      actionTitle: String(a.action_title ?? a.title ?? 'Improve Repository'),
      actionDescription: String(a.action_description ?? a.description ?? ''),
      fixDescription: String(a.action_description ?? a.description ?? ''),
      suggestedCommands: String(a.ai_suggested_commands ?? ''),
      weaknessCategory: String(a.weakness_category ?? 'general'),
      priority: (String(a.priority ?? 'MEDIUM')) as GitHubSignal['priority'],
      urgencyScore: Number(a.impact_score ?? 55),
      impactArea: ((a.impact_areas as string[] | null)?.[0]) ?? 'career_signal',
      estimatedMinutes: Number(a.estimated_minutes ?? 30),
      effort: mapEffort(String(a.effort ?? 'medium'))
    }))
  }

  // Fallback: repos with low health scores
  const { data: repos } = await db
    .from('github_repo_scores')
    .select('*')
    .eq('user_id', userId)
    .lte('total_score', 65)
    .order('total_score', { ascending: true })
    .limit(5)

  const signals: GitHubSignal[] = []

  if (repos?.length) {
    for (const repo of repos) {
      const weaknesses = (repo.weaknesses as Array<{
        category: string
        title: string
        fix: string
        priority: string
        estimatedMinutes?: number
        effort?: string
      }> | null) ?? []

      for (const w of weaknesses.slice(0, 2)) {
        signals.push({
          type: 'github' as const,
          repoName: String(repo.repo_name ?? ''),
          repoUrl: String(repo.repo_url ?? `https://github.com/${repo.repo_name ?? ''}`),
          actionTitle: w.title,
          actionDescription: w.fix,
          fixDescription: w.fix,
          weaknessCategory: w.category,
          priority: (String(w.priority ?? 'MEDIUM')) as GitHubSignal['priority'],
          urgencyScore: 55,
          impactArea: 'resume',
          estimatedMinutes: w.estimatedMinutes ?? 30,
          effort: mapEffort(w.effort ?? 'medium')
        })
      }
      if (signals.length >= 5) break
    }
    return signals
  }

  // Final fallback: Use AI repo generator directly if no structured actions/weaknesses exist
  const [{ data: userProfile }, { data: githubCache }] = await Promise.all([
    db.from('users').select('subjects').eq('id', userId).maybeSingle(),
    db.from('github_cache').select('repos').eq('user_id', userId).maybeSingle()
  ])

  if (githubCache?.repos?.length) {
    const aiStep = await generateRepoNextStep({
      repos: githubCache.repos,
      subjects: userProfile?.subjects ?? []
    })

    if (aiStep) {
      signals.push({
        type: 'github' as const,
        repoName: aiStep.title.includes(':') ? aiStep.title.split(':')[0] : 'GitHub',
        repoUrl: 'https://github.com', // Generic URL, since generateRepoNextStep doesn't return repoUrl
        actionTitle: aiStep.title,
        actionDescription: aiStep.reason,
        fixDescription: aiStep.reason,
        weaknessCategory: 'general',
        priority: 'MEDIUM',
        urgencyScore: 80, // High enough to show in feed
        impactArea: 'career_signal',
        estimatedMinutes: parseInt(aiStep.estimate) || 45,
        effort: 'medium'
      })
    }
  }

  return signals
}

function mapEffort(e: string): 'quick' | 'medium' | 'deep' {
  if (e === 'quick_win' || e === 'quick') return 'quick'
  if (e === 'half_day' || e === 'medium') return 'medium'
  return 'deep'
}
