import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildUserContext } from '@/lib/context/user-context';
import { analyzeSkillGaps } from '@/lib/skills/skill-gap';

export const runtime = 'nodejs';
export const maxDuration = 20;

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const required = searchParams.getAll('skill').flatMap((value) => value.split(',')).map((s) => s.trim()).filter(Boolean);
  const context = await buildUserContext(supabase, user.id, { taskLimit: 5 });
  return NextResponse.json({ skill_gaps: analyzeSkillGaps(context, required) });
}
