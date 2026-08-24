// Job Applications API Route
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recordFeedbackEvent } from '@/lib/feedback/events';

export const maxDuration = 20

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: applications } = await supabase
    .from('job_applications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ applications: applications ?? [] });
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null) as {
    id: string;
    status: string;
    notes?: string;
  } | null;

  const validStatuses = new Set(['saved', 'applied', 'interview', 'offer', 'rejected', 'withdrawn']);
  if (!body?.id || !validStatuses.has(body.status)) {
    return NextResponse.json({ error: 'id and valid status are required' }, { status: 400 });
  }

  const updates: Record<string, unknown> = { status: body.status };
  if (body.status === 'applied') updates.applied_at = new Date().toISOString();
  if (typeof body.notes === 'string') updates.notes = body.notes.slice(0, 1000);

  const { error } = await supabase
    .from('job_applications')
    .update(updates)
    .eq('id', body.id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await recordFeedbackEvent(supabase, user.id, {
    eventType: body.status === 'applied' ? 'application_started' : body.status === 'offer' ? 'application_completed' : 'opportunity_saved',
    source: 'application_tracker',
    entityType: 'job_application',
    entityId: body.id,
    outcome: body.status,
  });
  return NextResponse.json({ success: true });
}
