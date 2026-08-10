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

  // Get latest resume analysis
  const { data: resume } = await supabase
    .from('user_resumes')
    .select('skill_entities, swot')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

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

  return NextResponse.json({ projects: projects ?? [] });
}
