// Foundry Generate API Route
import { NextResponse } from 'next/server'
import { getAuthUser, createServiceRoleClient } from '@/lib/supabase-server'
import { executeTool } from '@/lib/mcp/registry'
import { createSSEStream, sseResponse } from '@/lib/mcp/stream'
import type { SkillEntity, SWOTAnalysis } from '@/lib/mcp/types'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST() {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceRoleClient()

  // Fetch ALL user context for deep personalization
  const [
    { data: resume },
    { data: profile },
    { data: codingProfile },
    { data: githubCache },
  ] = await Promise.all([
    db.from('user_resumes')
      .select('skill_entities, swot, parsed_data')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from('users')
      .select('target_roles, semester, cgpa, college, subjects')
      .eq('id', user.id)
      .single(),
    db.from('coding_profiles')
      .select('leetcode_stats, hackerrank_stats, placement_readiness_score, weak_topics')
      .eq('user_id', user.id)
      .maybeSingle(),
    db.from('github_cache')
      .select('health_score, languages, repos, last_commit_at')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  if (!resume) {
    return NextResponse.json(
      { error: 'No resume found. Please upload a valid resume first.' },
      { status: 400 }
    )
  }

  let skills: string[] = []
  if (resume) {
    const se = resume.skill_entities
    if (Array.isArray(se)) {
      skills = se.map((s: any) => (typeof s === 'string' ? s : s?.name)).filter(Boolean) as string[]
    } else if (se && typeof se === 'object') {
      skills = (se as { skills?: string[] }).skills ?? []
    }
    if (skills.length === 0 && resume.parsed_data) {
      skills = (resume.parsed_data as { skills?: string[] }).skills ?? []
    }
  }

  const effectiveSkills = skills.length > 0 ? skills : ['Python', 'AI', 'Machine Learning'];

  // Extract coding context
  const lcStats = (codingProfile?.leetcode_stats ?? {}) as Record<string, unknown>;
  const hrStats = (codingProfile?.hackerrank_stats ?? {}) as Record<string, unknown>;
  const codingContext = {
    leetcode: {
      totalSolved: lcStats.totalSolved ?? 0,
      easySolved: lcStats.easySolved ?? 0,
      mediumSolved: lcStats.mediumSolved ?? 0,
      hardSolved: lcStats.hardSolved ?? 0,
      contestRating: lcStats.contestRating ?? 0,
      contestsAttended: lcStats.contestsAttended ?? 0,
      weakTopics: codingProfile?.weak_topics ?? [],
    },
    hackerrank: {
      totalScore: hrStats.totalScore ?? 0,
      skills: hrStats.skills ?? {},
    },
    placementReadiness: codingProfile?.placement_readiness_score ?? 0,
  };

  // Extract GitHub context
  const githubContext = githubCache ? {
    healthScore: githubCache.health_score ?? 0,
    languages: githubCache.languages ?? {},
    reposCount: (githubCache.repos as any[] ?? []).length,
    reposWithDesc: (githubCache.repos as any[] ?? []).filter((r: any) => r.description?.trim()).length,
    lastCommit: githubCache.last_commit_at,
  } : null;

  const academicContext = {
    semester: profile?.semester ?? 0,
    cgpa: profile?.cgpa ?? null,
    college: profile?.college ?? null,
    subjects: profile?.subjects ?? [],
  };

  const { stream, emit, close } = createSSEStream()

  // Run generation asynchronously
  ;(async () => {
    try {
      emit({ event: 'progress', data: { message: 'Generating 9 personalized projects...' } })

      const result = await executeTool('foundry.generate9TailoredProjects', {
        skills: effectiveSkills.map(s => ({ name: s })) as SkillEntity[],
        swot: (resume.swot ?? {}) as SWOTAnalysis,
        targetRoles: profile?.target_roles ?? ['Software Engineer'],
        codingContext,
        githubContext,
        academicContext,
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
    
  // Double check profile flag against actual table record
  const hasResume = !!resume || (profile?.resume_uploaded ?? false)
  
  let skillsCount = 0
  if (resume) {
    skillsCount = (resume.skill_entities as { skills?: string[] })?.skills?.length ?? 0
    if (skillsCount === 0 && resume.parsed_data) {
      skillsCount = (resume.parsed_data as { skills?: string[] }).skills?.length ?? 0
    }
  }

  return NextResponse.json({ 
    projects: (projects ?? []).map((p: any) => ({
      ...p,
      // Derive completion_pct from current_phase if DB value is missing
      completion_pct: p.completion_pct > 0 ? p.completion_pct : Math.round(((p.current_phase - 1) / 6) * 100),
    })),
    resumeUploaded: hasResume,
    resumeValid: hasResume && skillsCount > 0,
  })
}
