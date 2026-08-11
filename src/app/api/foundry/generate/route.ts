// Foundry Generate API Route
import { NextResponse } from 'next/server'
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server'
import { executeTool } from '@/lib/mcp/registry'
import { createSSEStream, sseResponse } from '@/lib/mcp/stream'
import type { SkillEntity, SWOTAnalysis } from '@/lib/mcp/types'

export const runtime = 'nodejs'
export const maxDuration = 90

export async function POST() {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceRoleClient()

  // Find resume deterministically by user_id
  const { data: resume, error: resumeErr } = await db
    .from('user_resumes')
    .select('skill_entities, swot, parsed_data')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (resumeErr) {
    console.error('[Foundry] Error fetching resume:', resumeErr)
    return NextResponse.json({ error: 'Database error fetching resume' }, { status: 500 })
  }

  console.log('[Foundry] Resume found:', !!resume)
  
  let skills: string[] = []
  if (resume) {
    skills = (resume.skill_entities as { skills?: string[] })?.skills ?? []
    if (skills.length === 0 && resume.parsed_data) {
      skills = (resume.parsed_data as { skills?: string[] }).skills ?? []
    }
  }
  
  console.log('[Foundry] Skills count:', skills.length)

  if (!resume || skills.length === 0) {
    return NextResponse.json(
      { error: 'No skills found. Please upload a valid resume first.' },
      { status: 400 }
    )
  }

  const { data: profile } = await db
    .from('users')
    .select('target_roles')
    .eq('id', user.id)
    .single()

  const { stream, emit, close } = createSSEStream()

  // Run generation asynchronously
  ;(async () => {
    try {
      emit({ event: 'progress', data: { message: 'Generating 9 personalized projects...' } })

      const result = await executeTool('foundry.generate9TailoredProjects', {
        skills: skills.map(s => ({ name: s })) as SkillEntity[],
        swot: (resume.swot ?? {}) as SWOTAnalysis,
        targetRoles: profile?.target_roles ?? ['Software Engineer'],
      }, user.id)

      if (result.result.error) {
        emit({ event: 'tool_error', data: { error: result.result.error } })
      } else {
        emit({ event: 'tool_result', data: result.result.data || {} })
      }
    } catch (err) {
      console.error('[Foundry] Generation error:', err)
      emit({ event: 'tool_error', data: { error: (err as Error).message } })
    } finally {
      close()
    }
  })()

  return sseResponse(stream)
}

// GET: Fetch user's projects and resume status
export async function GET() {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceRoleClient()

  const { data: projects } = await db
    .from('user_projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at')

  const { data: profile } = await db
    .from('users')
    .select('resume_uploaded')
    .eq('id', user.id)
    .single()

  const { data: resume } = await db
    .from('user_resumes')
    .select('skill_entities, parsed_data')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
    
  let skillsCount = 0
  if (resume) {
    skillsCount = (resume.skill_entities as { skills?: string[] })?.skills?.length ?? 0
    if (skillsCount === 0 && resume.parsed_data) {
      skillsCount = (resume.parsed_data as { skills?: string[] }).skills?.length ?? 0
    }
  }

  // Double check profile flag against actual table record
  const hasResume = !!resume || (profile?.resume_uploaded ?? false)

  return NextResponse.json({ 
    projects: projects ?? [],
    resumeUploaded: hasResume,
    resumeValid: skillsCount > 0
  })
}
