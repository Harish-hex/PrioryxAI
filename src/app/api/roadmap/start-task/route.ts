// Lets a user turn any roadmap topic/subtopic into a "learning" task that
// shows up in their AI Daily Plan (the same priority_tasks table /
// /api/priority/today reads) — the roadmap "flow in order" the user asked
// for: start something on the roadmap, see it appear in Task.
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server'
import { getRoadmap } from '@/lib/roadmaps/data'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { roadmapId?: string; topicId?: string; title?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { roadmapId, topicId, title } = body
  const roadmap = roadmapId ? getRoadmap(roadmapId) : null
  if (!roadmap || !topicId || !title) {
    return NextResponse.json({ error: 'Invalid roadmap, topic, or title' }, { status: 400 })
  }

  const db = createServiceRoleClient()
  const today = new Date().toISOString().split('T')[0]
  const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString() // give it a week, not just today

  // No DB uniqueness constraint on (user_id, source_type, source_id) exists to
  // upsert against safely, so check-then-insert instead — avoids duplicating
  // the same "start this topic" task if the user clicks Start again.
  const { data: existing } = await db
    .from('priority_tasks')
    .select('id')
    .eq('user_id', user.id)
    .eq('source_type', 'roadmap_topic')
    .eq('source_id', topicId)
    .eq('completed', false)
    .eq('dismissed', false)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ success: true, task: existing, alreadyAdded: true })
  }

  const { data, error } = await db
    .from('priority_tasks')
    .insert({
      user_id: user.id,
      title: `Learn: ${title}`,
      description: `From your ${roadmap.label} roadmap — mark it complete on the roadmap once you're done.`,
      category: 'learning',
      priority: 'MEDIUM',
      urgency_score: 55,
      scheduled_for: today,
      action_url: `/career/roadmap/${roadmapId}`,
      action_label: 'Open Roadmap',
      why_now: `You started this topic on your ${roadmap.label} roadmap`,
      estimated_minutes: 45,
      effort_level: 'medium',
      source_type: 'roadmap_topic',
      source_id: topicId,
      task_data: { roadmapId, topicId },
      expires_at: expiresAt,
      completed: false,
      dismissed: false,
    })
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, task: data })
}
