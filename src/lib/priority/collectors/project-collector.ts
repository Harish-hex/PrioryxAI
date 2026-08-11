import { SupabaseClient } from '@supabase/supabase-js'

export interface ProjectSignal {
  type: 'project'
  projectId: string
  projectTitle: string
  currentPhase: number
  phaseName: string
  phaseDescription: string
  deliverable: string
  techStack: string[]
  estimatedDays: number
  urgencyScore: number
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

export async function collectProjectSignals(
  db: SupabaseClient,
  userId: string
): Promise<ProjectSignal[]> {
  const { data: projects } = await db
    .from('user_projects')
    .select('*')
    .eq('user_id', userId)
    .eq('verified', false)
    .order('created_at', { ascending: true })
    .limit(3)

  if (!projects?.length) return []

  return projects.map(proj => {
    const phases = (proj.phases as Array<{
      phase: number
      name: string
      description: string
      deliverable: string
      days: number
    }> | null) ?? []

    const currentPhaseNum = proj.current_phase ?? 1
    const currentPhaseData = phases.find(p => p.phase === currentPhaseNum) ?? phases[0]

    return {
      type: 'project' as const,
      projectId: proj.id,
      projectTitle: proj.title ?? 'Project',
      currentPhase: currentPhaseNum,
      phaseName: currentPhaseData?.name ?? `Phase ${currentPhaseNum}`,
      phaseDescription: currentPhaseData?.description ?? 'Continue your project',
      deliverable: currentPhaseData?.deliverable ?? '',
      techStack: (proj.tech_stack as string[]) ?? [],
      estimatedDays: currentPhaseData?.days ?? 2,
      urgencyScore: 60,
      priority: 'MEDIUM' as const
    }
  })
}
