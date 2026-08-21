/**
 * Resume Autodraft — Phase 7
 *
 * Reads existing DB data (no recomputing) and generates:
 * - AI-polished bullet points for each project/experience
 * - A professional summary paragraph
 * - Skill ranking with evidence from GitHub + LeetCode
 *
 * Tool: resume.autodraftFromProfile (registered in resume-agent.ts if needed)
 * Called via /api/career/resume/autodraft
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';
import { checkRateLimit, assistantRatelimit } from '@/lib/redis';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(_request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = await checkRateLimit(assistantRatelimit, `autodraft:${user.id}`);
  if (rl.blocked) {
    return NextResponse.json(
      { error: rl.reason === 'redis_error' ? 'Service temporarily unavailable.' : 'Too many requests.' },
      { status: rl.reason === 'redis_error' ? 503 : 429 }
    );
  }

  // ── Gather all user data from DB (no API calls — read only) ──────────
  const [
    profileRes,
    resumeRes,
    lcProfileRes,
    githubRes,
    projectsRes,
  ] = await Promise.allSettled([
    supabase
      .from('users')
      .select('name, display_name, college, semester, target_companies, target_roles, stream')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('user_resumes')
      .select('skill_entities, swot, parsed_data, extraction_method')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('leetcode_profiles')
      .select('leetcode_username, placement_readiness_score, ai_analysis')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('github_cache')
      .select('repos, languages, health_score, last_commit_at')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('user_projects')
      .select('title, tech_stack, current_phase, completion_pct, verified')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const profile = profileRes.status === 'fulfilled' ? profileRes.value.data : null;
  const resume = resumeRes.status === 'fulfilled' ? resumeRes.value.data : null;
  const lcProfile = lcProfileRes.status === 'fulfilled' ? lcProfileRes.value.data : null;
  const github = githubRes.status === 'fulfilled' ? githubRes.value.data : null;
  const projects = projectsRes.status === 'fulfilled' ? (projectsRes.value.data ?? []) : [];

  const skills = (resume?.skill_entities as { skills?: string[] } | null)?.skills ?? [];
  const repos = (github?.repos as Array<{ name?: string; description?: string; language?: string; stargazers_count?: number }>) ?? [];
  const targetRoles = (profile?.target_roles as string[]) ?? ['Software Engineer'];
  const targetCompanies = (profile?.target_companies as string[]) ?? [];
  const lcScore = (lcProfile as { placement_readiness_score?: number } | null)?.placement_readiness_score;

  const contextForLLM = {
    name: profile?.name ?? profile?.display_name ?? 'Student',
    college: profile?.college,
    semester: profile?.semester,
    targetRoles,
    targetCompanies,
    skills: skills.slice(0, 25),
    lcScore,
    lcUsername: (lcProfile as { leetcode_username?: string } | null)?.leetcode_username,
    githubLanguages: Object.keys((github?.languages as Record<string, number>) ?? {}).slice(0, 8),
    githubHealthScore: github?.health_score,
    topRepos: repos.slice(0, 6).map((r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
    })),
    projects: projects.slice(0, 5).map((p) => ({
      title: p.title,
      techStack: p.tech_stack,
      completion: p.completion_pct,
      verified: p.verified,
    })),
    swot: resume?.swot,
  };

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    max_tokens: 3000,
    temperature: 0.4,
    messages: [
      {
        role: 'system',
        content: `You are a professional resume writer specialising in Indian engineering students targeting top tech companies.
Generate a polished, ATS-optimised resume draft based on the student's profile data.

Return JSON with this EXACT schema:
{
  "summary": "string — 3-line professional summary (name, key skills, target)",
  "skills": {
    "languages": ["string"],
    "frameworks": ["string"],
    "tools": ["string"],
    "concepts": ["string"]
  },
  "projects": [
    {
      "title": "string",
      "techStack": ["string"],
      "bullets": ["string — start with action verb, quantify where possible, max 2 bullets"]
    }
  ],
  "githubHighlights": ["string — 2-3 bullets about GitHub activity"],
  "dsaSection": "string — 1 line on LeetCode/competitive programming achievements",
  "improvementTips": ["string — 3 concrete suggestions to strengthen this resume"]
}`,
      },
      {
        role: 'user',
        content: `Student profile:\n${JSON.stringify(contextForLLM, null, 2)}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';
  let draft: Record<string, unknown>;
  try {
    draft = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Failed to parse autodraft output' }, { status: 500 });
  }

  return NextResponse.json({
    draft,
    sourceData: {
      skillsCount: skills.length,
      projectsCount: projects.length,
      reposCount: repos.length,
      lcScore,
    },
    generatedAt: new Date().toISOString(),
  });
}

export async function GET() {
  // Alias — same as POST but for simpler frontend calls
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ message: 'Send POST to /api/career/resume/autodraft to generate.' });
}
