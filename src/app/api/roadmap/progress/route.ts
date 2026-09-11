import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server'
import { getRoadmap } from '@/lib/roadmaps/data'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const streamId = req.nextUrl.searchParams.get('stream')
  if (!streamId || !getRoadmap(streamId)) {
    return NextResponse.json({ error: 'Unknown stream' }, { status: 400 })
  }

  const db = createServiceRoleClient()
  const { data, error } = await db
    .from('roadmap_progress')
    .select('topic_id, completed_at')
    .eq('user_id', user.id)
    .eq('stream_id', streamId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ completed: data ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { stream?: string; topicId?: string; completed?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { stream: streamId, topicId, completed = true } = body
  const roadmap = streamId ? getRoadmap(streamId) : null
  if (!roadmap || !topicId) {
    return NextResponse.json({ error: 'Invalid stream or topic' }, { status: 400 })
  }
  const validTopic = roadmap.sections.some((s) => s.topics.some((t) => t.id === topicId))
  if (!validTopic) {
    return NextResponse.json({ error: 'Unknown topic for this stream' }, { status: 400 })
  }

  const db = createServiceRoleClient()

  if (completed) {
    const { error } = await db
      .from('roadmap_progress')
      .upsert(
        { user_id: user.id, stream_id: streamId, topic_id: topicId, completed_at: new Date().toISOString() },
        { onConflict: 'user_id,stream_id,topic_id' }
      )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await db
      .from('roadmap_progress')
      .delete()
      .eq('user_id', user.id)
      .eq('stream_id', streamId)
      .eq('topic_id', topicId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
