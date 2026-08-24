import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildUserContext } from '@/lib/context/user-context';
import { matchOpportunityToUser } from '@/lib/opportunities/matching';
import { normalizeJobOpportunity } from '@/lib/opportunities/normalize';

export const runtime = 'nodejs';
export const maxDuration = 20;

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

  const sourceKey = typeof body.source === 'string' ? body.source : 'manual';
  const raw = typeof body.opportunity === 'object' && body.opportunity !== null
    ? body.opportunity as Record<string, unknown>
    : body;
  const normalized = normalizeJobOpportunity(raw, sourceKey);
  if (!normalized.applicationUrl) {
    return NextResponse.json({ error: 'application URL is required for matching' }, { status: 400 });
  }

  const context = await buildUserContext(supabase, user.id, { taskLimit: 5 });
  const match = matchOpportunityToUser(normalized, context);

  return NextResponse.json({ match });
}
