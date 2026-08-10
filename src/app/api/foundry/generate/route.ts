// Foundry Generate API Route
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeTool } from '@/lib/mcp/registry';
import { createSSEStream, sseResponse } from '@/lib/mcp/stream';
import type { SkillEntity, SWOTAnalysis } from '@/lib/mcp/types';

export const runtime = 'nodejs';
export const maxDuration = 90;

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Try multiple ways to find the resume
  let resume = null

  // Method 1: by user_id
  const { data: r1 } = await supabase
    .from('user_resumes')
    .select('skill_entities, swot')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (r1) {
    resume = r1
    console.log('[Foundry] Found resume via user_id')
  }

  // Method 2: by id in users if linked
  if (!resume) {
    const { data: profile } = await supabase
      .from('users') // We use 'users' table in this app mostly
      .select('resume_id')
      .eq('id', user.id)
      .single()

    if (profile?.resume_id) {
      const { data: r2 } = await supabase
        .from('user_resumes')
        .select('skill_entities, swot')
        .eq('id', profile.resume_id)
        .single()
      if (r2) resume = r2
    }
  }

  console.log('[Foundry] Resume found:', !!resume)
  console.log('[Foundry] Skills count:', (resume?.skill_entities as any)?.skills?.length ?? 0)

  if (!resume) {
    return NextResponse.json({ error: 'Upload a resume first' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('target_roles')
    .eq('id', user.id)
    .single();

  const { stream, emit, close } = createSSEStream();

  (async () => {
    try {
      emit({ event: 'progress', data: { message: 'Generating 9 personalized projects...' } });

      const result = await executeTool('foundry.generate9TailoredProjects', {
        skills: resume.skill_entities as SkillEntity[],
        swot: resume.swot as SWOTAnalysis,
        targetRoles: profile?.target_roles ?? ['Software Engineer'],
      }, user.id);

      emit({
        event: 'tool_result',
        data: result.result.data ?? { error: result.result.error },
      });
    } catch (err) {
      emit({ event: 'tool_error', data: { error: (err as Error).message } });
    } finally {
      close();
    }
  })();

  return sseResponse(stream);
}

// GET: Fetch user's projects
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: projects } = await supabase
    .from('user_projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at');

  const { data: profile } = await supabase
    .from('users')
    .select('resume_uploaded')
    .eq('id', user.id)
    .single();

  const { data: resume } = await supabase
    .from('user_resumes')
    .select('skill_entities')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();
    
  const skillsCount = (resume?.skill_entities as any)?.skills?.length ?? 0;

  return NextResponse.json({ 
    projects: projects ?? [],
    resumeUploaded: profile?.resume_uploaded ?? false,
    resumeValid: skillsCount > 0
  });
}
