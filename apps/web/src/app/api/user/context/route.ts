import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildAIContextSummary, buildUserContext } from '@/lib/context/user-context';
import { analyzeSkillGaps } from '@/lib/skills/skill-gap';

export const runtime = 'nodejs';
export const maxDuration = 20;

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const context = await buildUserContext(supabase, user.id, { includeFeedback: true });
  const skillGaps = analyzeSkillGaps(context);

  return NextResponse.json({
    context,
    ai_context_summary: buildAIContextSummary(context),
    skill_gaps: skillGaps,
  });
}
