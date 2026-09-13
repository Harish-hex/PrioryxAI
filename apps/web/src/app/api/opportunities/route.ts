import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildUserContext } from '@/lib/context/user-context';
import { matchOpportunityToUser } from '@/lib/opportunities/matching';
import { NormalizedOpportunity } from '@/lib/opportunities/types';
import { recordFeedbackEvent } from '@/lib/feedback/events';

export const runtime = 'nodejs';
export const maxDuration = 20;

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
  };
}

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20)));
  const country = searchParams.get('country');
  const offset = (page - 1) * limit;

  let query = supabase
    .from('opportunities')
    .select('*', { count: 'exact' })
    .order('freshness_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (country) query = query.eq('country', country);

  const [{ data, count, error }, context] = await Promise.all([
    query,
    buildUserContext(supabase, user.id, { taskLimit: 5 }),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const opportunities = (data ?? []).map((row) => {
    const opportunity = rowToOpportunity(row as Record<string, unknown>);
    return matchOpportunityToUser(opportunity, context);
  });

  return NextResponse.json({
    opportunities,
    pagination: {
      page,
      limit,
      total: count ?? opportunities.length,
      hasMore: offset + limit < (count ?? opportunities.length),
    },
  });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null) as { opportunity_id?: string; event_type?: string; notes?: string } | null;
  if (!body?.opportunity_id || !['viewed', 'saved', 'ignored', 'applied', 'dismissed'].includes(body.event_type ?? '')) {
    return NextResponse.json({ error: 'opportunity_id and valid event_type are required' }, { status: 400 });
  }

  const eventType = body.event_type;
  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: recentInteraction } = await supabase
    .from('user_opportunity_interactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('opportunity_id', body.opportunity_id)
    .eq('event_type', eventType)
    .gte('occurred_at', cutoff)
    .limit(1);

  if ((recentInteraction ?? []).length > 0) {
    return NextResponse.json({ success: true, deduplicated: true });
  }

  const { error } = await supabase.from('user_opportunity_interactions').insert({
    user_id: user.id,
    opportunity_id: body.opportunity_id,
    event_type: eventType,
    notes: typeof body.notes === 'string' ? body.notes.slice(0, 500) : null,
    occurred_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: 'Failed to record opportunity interaction' }, { status: 500 });

  await recordFeedbackEvent(supabase, user.id, {
    eventType: eventType === 'viewed'
      ? 'opportunity_viewed'
      : eventType === 'saved'
        ? 'opportunity_saved'
        : eventType === 'ignored' || eventType === 'dismissed'
          ? 'opportunity_ignored'
          : 'application_started',
    source: 'opportunities_api',
    entityType: 'opportunity',
    entityId: body.opportunity_id,
    outcome: eventType,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
