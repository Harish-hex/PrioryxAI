import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FeedbackEventType, getRecentFeedbackSignals, recordFeedbackEvent } from '@/lib/feedback/events';

export const runtime = 'nodejs';
export const maxDuration = 20;

const VALID_EVENTS: FeedbackEventType[] = [
  'task_created',
  'task_completed',
  'task_skipped',
  'task_snoozed',
  'task_postponed',
  'task_dismissed',
  'recommendation_accepted',
  'recommendation_rejected',
  'opportunity_viewed',
  'opportunity_saved',
  'opportunity_ignored',
  'application_started',
  'application_completed',
  'project_completed',
  'learning_completed',
  'learning_resource_completed',
];

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const signals = await getRecentFeedbackSignals(supabase, user.id);
  return NextResponse.json(signals);
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = body.event_type;
  const entityType = typeof body.entity_type === 'string' ? body.entity_type.slice(0, 80) : '';
  if (typeof eventType !== 'string' || !VALID_EVENTS.includes(eventType as FeedbackEventType)) {
    return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 });
  }
  if (!entityType) return NextResponse.json({ error: 'entity_type is required' }, { status: 400 });

  await recordFeedbackEvent(supabase, user.id, {
    eventType: eventType as FeedbackEventType,
    source: typeof body.source === 'string' ? body.source.slice(0, 80) : 'api',
    entityType,
    entityId: typeof body.entity_id === 'string' ? body.entity_id.slice(0, 200) : null,
    outcome: typeof body.outcome === 'string' ? body.outcome.slice(0, 120) : null,
    context: typeof body.context === 'object' && body.context !== null && !Array.isArray(body.context)
      ? body.context as Record<string, unknown>
      : {},
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
