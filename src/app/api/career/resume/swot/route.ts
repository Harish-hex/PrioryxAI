// SWOT API Route — fetch stored SWOT or regenerate
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: resume, error } = await supabase
    .from('user_resumes')
    .select('skill_entities, swot, ats_score, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !resume) {
    return NextResponse.json({ error: 'No resume found. Upload one first.' }, { status: 404 });
  }

  return NextResponse.json({
    skills: resume.skill_entities,
    swot: resume.swot,
    atsScore: resume.ats_score,
    analyzedAt: resume.created_at,
  });
}
