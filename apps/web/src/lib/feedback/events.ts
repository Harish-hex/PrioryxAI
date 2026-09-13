import { SupabaseClient } from '@supabase/supabase-js';
import { withFallback, redis } from '@/lib/redis';

export type FeedbackEventType =
  | 'task_created'
  | 'task_completed'
  | 'task_skipped'
  | 'task_snoozed'
  | 'task_postponed'
  | 'task_dismissed'
  | 'recommendation_accepted'
  | 'recommendation_rejected'
  | 'opportunity_viewed'
  | 'opportunity_saved'
  | 'opportunity_ignored'
  | 'application_started'
  | 'application_completed'
  | 'project_completed'
  | 'learning_completed'
  | 'learning_resource_completed';

export interface FeedbackEventInput {
  eventType: FeedbackEventType;
  source?: string;
  entityType: string;
  entityId?: string | null;
  outcome?: string | null;
  context?: Record<string, unknown>;
}

export async function recordFeedbackEvent(
  db: SupabaseClient,
  userId: string,
  input: FeedbackEventInput
): Promise<void> {
  const context = input.context ? sanitizeContext(input.context) : {};
  const { error } = await db.from('recommendation_events').insert({
    user_id: userId,
    event_type: input.eventType,
    source: input.source ?? 'app',
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    outcome: input.outcome ?? null,
    context,
    occurred_at: new Date().toISOString(),
  });

  if (error) {
    console.warn('[feedback] failed to record event:', error.message);
    return;
  }

  await withFallback(() => redis.del(`feedback:${userId}:recent`), 0);
}

function sanitizeContext(context: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (typeof value === 'string') clean[key] = value.slice(0, 500);
    else if (typeof value === 'number' || typeof value === 'boolean' || value === null) clean[key] = value;
    else if (Array.isArray(value)) clean[key] = value.slice(0, 20);
    else if (typeof value === 'object') clean[key] = '[object]';
  }
  return clean;
}

export async function getRecentFeedbackSignals(
  db: SupabaseClient,
  userId: string,
  limit = 50
): Promise<{
  accepted: number;
  rejected: number;
  postponed: number;
  completed: number;
  dismissed: number;
  recentEvents: Array<Record<string, unknown>>;
}> {
  const cacheKey = `feedback:${userId}:recent`;
  const cached = await withFallback<{
    accepted: number;
    rejected: number;
    postponed: number;
    completed: number;
    dismissed: number;
    recentEvents: Array<Record<string, unknown>>;
  } | null>(() => redis.get(cacheKey), null, 500);
  if (cached) return cached;

  const { data } = await db
    .from('recommendation_events')
    .select('event_type, source, entity_type, entity_id, outcome, context, occurred_at')
    .eq('user_id', userId)
    .order('occurred_at', { ascending: false })
    .limit(limit);

  const events = (data ?? []) as Array<Record<string, unknown>>;
  const result = {
    accepted: events.filter((e) => e.event_type === 'recommendation_accepted' || e.event_type === 'opportunity_saved').length,
    rejected: events.filter((e) => e.event_type === 'recommendation_rejected' || e.event_type === 'opportunity_ignored').length,
    postponed: events.filter((e) => e.event_type === 'task_postponed' || e.event_type === 'task_snoozed').length,
    completed: events.filter((e) => e.event_type === 'task_completed' || e.event_type === 'learning_resource_completed' || e.event_type === 'learning_completed').length,
    dismissed: events.filter((e) => e.event_type === 'task_dismissed').length,
    recentEvents: events,
  };

  await withFallback(() => redis.set(cacheKey, result, { ex: 300 }), undefined, 500);
  return result;
}
