import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient, getAuthUser } from '@/lib/supabase-server'
import { recordFeedbackEvent } from '@/lib/feedback/events'

export const maxDuration = 20

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceRoleClient()

  const { error } = await db
    .from('priority_tasks')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await recordFeedbackEvent(db, user.id, {
    eventType: 'recommendation_accepted',
    source: 'priority_api',
    entityType: 'priority_task',
    entityId: params.id,
    outcome: 'completed',
  })
  return NextResponse.json({ success: true })
}
