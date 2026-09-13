import { SupabaseClient } from '@supabase/supabase-js'
import { getRoadmap } from '@/lib/roadmaps/data'
import { matchRoadmaps, isRoadmapCurated } from '@/lib/roadmaps/match'

export interface RoadmapSignal {
  type: 'roadmap'
  roadmapId: string
  roadmapLabel: string
  topicId: string
  topicTitle: string
  topicDescription: string
  sectionTitle: string
  urgencyScore: number
  priority: 'MEDIUM'
}

/**
 * Picks the single next not-yet-completed topic on the roadmap that best
 * matches the user's stream/resume skills — "what to learn next" in their
 * roadmap journey, in the same in-order sequence the roadmap page itself
 * walks (see RoadmapDetailView in src/app/career/roadmap/shared.tsx).
 */
export async function collectRoadmapSignals(
  db: SupabaseClient,
  userId: string
): Promise<RoadmapSignal[]> {
  const [{ data: profile }, { data: resume }] = await Promise.all([
    db.from('users').select('stream, subjects').eq('id', userId).maybeSingle(),
    db.from('user_resumes')
      .select('skill_entities, parsed_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const signals: string[] = []
  if (profile?.stream) signals.push(profile.stream)
  if (Array.isArray(profile?.subjects)) signals.push(...(profile.subjects as string[]))

  const skillEntities = resume?.skill_entities
  if (Array.isArray(skillEntities)) {
    signals.push(...skillEntities.map((s: any) => (typeof s === 'string' ? s : s?.name)).filter(Boolean))
  } else if (skillEntities && typeof skillEntities === 'object' && Array.isArray((skillEntities as any).skills)) {
    signals.push(...(skillEntities as any).skills.filter(Boolean))
  }
  const parsedSkills = (resume?.parsed_data as { skills?: string[] } | null)?.skills
  if (Array.isArray(parsedSkills)) signals.push(...parsedSkills.filter(Boolean))

  const matches = matchRoadmaps(signals).filter((m) => isRoadmapCurated(m.id))
  const roadmapId = matches[0]?.id
  if (!roadmapId) return []

  const roadmap = getRoadmap(roadmapId)
  if (!roadmap) return []

  const { data: progress } = await db
    .from('roadmap_progress')
    .select('topic_id')
    .eq('user_id', userId)
    .eq('stream_id', roadmapId)

  const completedIds = new Set((progress ?? []).map((p: { topic_id: string }) => p.topic_id))

  for (const section of roadmap.sections) {
    for (const topic of section.topics) {
      if (!completedIds.has(topic.id)) {
        return [{
          type: 'roadmap' as const,
          roadmapId,
          roadmapLabel: roadmap.label,
          topicId: topic.id,
          topicTitle: topic.title,
          topicDescription: topic.description,
          sectionTitle: section.title,
          urgencyScore: 55,
          priority: 'MEDIUM' as const,
        }]
      }
    }
  }

  return [] // every topic on this roadmap is already completed
}
