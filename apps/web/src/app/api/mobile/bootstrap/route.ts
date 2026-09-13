import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildUserContext } from '@/lib/context/user-context';
import { analyzeSkillGaps } from '@/lib/skills/skill-gap';
import { buildWorkloadPlan } from '@/lib/planning/temporal';

export const runtime = 'nodejs';
export const maxDuration = 20;

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const context = await buildUserContext(supabase, user.id, {
    taskLimit: 20,
    includeFeedback: true,
  });

  return NextResponse.json({
    profile: context.profile,
    locale: context.locale,
    tasks: context.tasks.pending.slice(0, 20),
    planning: buildWorkloadPlan(context),
    skill_gaps: analyzeSkillGaps(context),
    coding: {
      github_connected: Boolean(context.coding.github),
      leetcode_connected: Boolean(context.coding.leetcode),
      hackerrank_connected: Boolean(context.coding.hackerrank),
    },
    career: {
      applications: context.career.applications.slice(0, 10),
      projects: context.career.projects.slice(0, 10),
      skills: context.career.skills.slice(0, 30),
    },
  });
}
