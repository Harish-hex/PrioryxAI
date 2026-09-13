// Global AI Orchestrator — Conditional Pipeline with Lightweight LLM Planner
import type { SSEEvent, SkillEntity, SWOTAnalysis, CareerAnalysisResult } from './types';
import { executeTool } from './registry';
import { createClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';

export interface OrchestrationPlan {
  stagesToRun: Array<'resume' | 'coding' | 'projects' | 'jobs' | 'roadmap'>;
  skippedStages: Array<{
    stage: 'resume' | 'coding' | 'projects' | 'jobs' | 'roadmap';
    reason: string;
  }>;
  reasoning: string;
}

/**
 * Lightweight planning call using gpt-4o-mini to conditionally select which
 * stages need to execute for this specific user run.
 */
async function planCareerOrchestration(
  userId: string,
  options: {
    rawResumeText?: string;
    leetcodeUsername?: string;
    hackerrankUsername?: string;
    targetRoles?: string[];
    forceFullRun?: boolean;
  }
): Promise<OrchestrationPlan> {
  // If force full run is explicitly set, run everything available
  if (options.forceFullRun) {
    return {
      stagesToRun: ['resume', 'coding', 'projects', 'jobs', 'roadmap'],
      skippedStages: [],
      reasoning: 'Force full run requested by caller.',
    };
  }

  const supabase = createClient();

  // Inspect existing user artifacts and timestamps
  const [resumeRes, lcRes, projectsRes] = await Promise.allSettled([
    supabase
      .from('user_resumes')
      .select('created_at, swot, skill_entities')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('leetcode_profiles')
      .select('updated_at, placement_readiness_score')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('user_projects')
      .select('id, created_at')
      .eq('user_id', userId)
      .limit(9),
  ]);

  const existingResume = resumeRes.status === 'fulfilled' ? resumeRes.value.data : null;
  const existingLC = lcRes.status === 'fulfilled' ? lcRes.value.data : null;
  const existingProjects = projectsRes.status === 'fulfilled' ? (projectsRes.value.data ?? []) : [];

  const hasNewResumeText = Boolean(options.rawResumeText && options.rawResumeText.trim().length > 50);
  const hasExistingSwot = Boolean(existingResume?.swot && Object.keys(existingResume.swot).length > 0);
  const hasExistingProjects = existingProjects.length >= 3;
  const hasCodingHandles = Boolean(options.leetcodeUsername || options.hackerrankUsername);

  try {
    const prompt = `You are the PrioryxAI pipeline planner. Decide which career analysis stages need to run this session.

Available stages:
- "resume": Parse PDF/text, extract skills, generate SWOT (heavy: ~1.5k tokens)
- "coding": Fetch LeetCode/HackerRank, identify weak topics, compute placement score (~1k tokens)
- "projects": Generate 9 tailored portfolio projects based on SWOT gaps (~3k tokens)
- "jobs": Fetch live market jobs & rank by fit score (~1.5k tokens)
- "roadmap": Generate 12-week personalized career roadmap (~2.5k tokens)

Current user state:
- New raw resume text provided in request: ${hasNewResumeText ? 'YES' : 'NO'}
- Existing resume SWOT in database: ${hasExistingSwot ? 'YES' : 'NO'}
- Existing LeetCode placement score in DB: ${existingLC?.placement_readiness_score ?? 'None'}
- Coding handles provided (LeetCode/HackerRank): ${hasCodingHandles ? 'YES' : 'NO'}
- Existing generated projects count in DB: ${existingProjects.length}
- Target roles: ${(options.targetRoles ?? ['Software Engineer']).join(', ')}

Rules:
1. Only run "resume" if new resume text is provided or no existing SWOT exists.
2. Only run "coding" if coding handles are provided.
3. Skip "projects" if the user already has >= 3 generated projects AND no new resume text was supplied.
4. "jobs" and "roadmap" can be run if skill data is available (either newly generated or from database).
5. Return JSON format:
{
  "stagesToRun": ["resume" | "coding" | "projects" | "jobs" | "roadmap"],
  "skippedStages": [{ "stage": "...", "reason": "..." }],
  "reasoning": "1-sentence summary"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 300,
      temperature: 0.1,
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
    if (Array.isArray(parsed.stagesToRun) && parsed.stagesToRun.length > 0) {
      return parsed as OrchestrationPlan;
    }
  } catch (err) {
    console.error('[OrchestrationPlanner] Fallback to deterministic rules:', err);
  }

  // Deterministic fallback plan if LLM call is unavailable
  const stagesToRun: Array<'resume' | 'coding' | 'projects' | 'jobs' | 'roadmap'> = [];
  const skippedStages: Array<{ stage: 'resume' | 'coding' | 'projects' | 'jobs' | 'roadmap'; reason: string }> = [];

  if (hasNewResumeText || !hasExistingSwot) {
    stagesToRun.push('resume');
  } else {
    skippedStages.push({ stage: 'resume', reason: 'Existing SWOT analysis is fresh and no new resume text was uploaded.' });
  }

  if (hasCodingHandles) {
    stagesToRun.push('coding');
  } else {
    skippedStages.push({ stage: 'coding', reason: 'No coding handles provided in request.' });
  }

  if (hasNewResumeText || !hasExistingProjects) {
    stagesToRun.push('projects');
  } else {
    skippedStages.push({ stage: 'projects', reason: `User already has ${existingProjects.length} tailored projects in database.` });
  }

  stagesToRun.push('jobs', 'roadmap');

  return {
    stagesToRun,
    skippedStages,
    reasoning: 'Deterministic rule-based orchestration plan.',
  };
}

export async function runFullCareerAnalysis(
  userId: string,
  emit: (event: SSEEvent) => void,
  options: {
    rawResumeText?: string;
    leetcodeUsername?: string;
    hackerrankUsername?: string;
    targetRoles?: string[];
    targetCompanies?: string[];
    timeline?: string;
    forceFullRun?: boolean;
  }
): Promise<CareerAnalysisResult> {
  const result: CareerAnalysisResult = {
    resumeAnalysis: null,
    codingProfile: null,
    projects: [],
    jobMatches: [],
    roadmap: '',
  };

  // ─── Step 0: Plan Conditional Execution ───
  emit({ event: 'progress', data: { stage: 'planning', message: 'Optimizing analysis pipeline...' } });

  const plan = await planCareerOrchestration(userId, options);
  console.log(`[Orchestrator] Plan for ${userId}:`, plan);

  // Notify client of planned and skipped stages
  for (const skipped of plan.skippedStages) {
    console.log(`[Orchestrator] Skipped ${skipped.stage}: ${skipped.reason}`);
    emit({
      event: 'tool_result',
      data: { stage: skipped.stage, skipped: true, reason: skipped.reason },
    });
  }

  // ─── Stage 1: Resume Analysis ───
  if (plan.stagesToRun.includes('resume') && options.rawResumeText) {
    emit({ event: 'progress', data: { stage: 'resume', message: 'Analyzing resume...' } });

    const parseResult = await executeTool('resume.parseResumeToJSON', {
      rawText: options.rawResumeText,
    }, userId);

    const parsedSkills = parseResult.result.success
      ? ((parseResult.result.data as Record<string, unknown>)?.parsed as Record<string, unknown>)?.skills as string[] ?? []
      : [];

    emit({ event: 'progress', data: { stage: 'skills', message: 'Extracting skills...' } });

    const skillResult = await executeTool('resume.extractSkillEntities', {
      rawText: options.rawResumeText,
      parsedSkills,
    }, userId);

    const skills = skillResult.result.success
      ? (skillResult.result.data as Record<string, unknown>)?.skills as SkillEntity[] ?? []
      : [];

    emit({ event: 'progress', data: { stage: 'swot', message: 'Generating SWOT analysis...' } });

    const swotResult = await executeTool('resume.computeSWOTAnalysis', {
      skills,
      targetRoles: options.targetRoles ?? ['Software Engineer'],
    }, userId);

    const swot = swotResult.result.success
      ? (swotResult.result.data as Record<string, unknown>)?.swot as SWOTAnalysis
      : { strengths: [], weaknesses: [], opportunities: [], threats: [] };

    result.resumeAnalysis = { skills, swot, atsScore: 0 };

    emit({
      event: 'tool_result',
      data: { stage: 'resume', skills: skills.length, swotGenerated: true },
    });
  } else {
    // If resume stage skipped, load existing resume data from Supabase if available
    const supabase = createClient();
    const { data: existingResume } = await supabase
      .from('user_resumes')
      .select('skill_entities, swot')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingResume) {
      const rawSkills = (existingResume.skill_entities as { skills?: string[] } | null)?.skills ?? [];
      const skills: SkillEntity[] = rawSkills.map((s) => ({
        name: s,
        category: 'Technical',
        proficiency: 80,
        evidence: 'Extracted from previous resume upload',
      }));

      result.resumeAnalysis = {
        skills,
        swot: (existingResume.swot as SWOTAnalysis) ?? { strengths: [], weaknesses: [], opportunities: [], threats: [] },
        atsScore: 0,
      };
    }
  }

  // ─── Stage 2: Coding Profile ───
  const weakTopics: string[] = [];

  if (plan.stagesToRun.includes('coding') && options.leetcodeUsername) {
    emit({ event: 'progress', data: { stage: 'leetcode', message: 'Fetching LeetCode profile...' } });

    const lcResult = await executeTool('research.fetchLeetCodeProfile', {
      username: options.leetcodeUsername,
    }, userId);

    if (lcResult.result.success) {
      const lcStats = (lcResult.result.data as Record<string, unknown>)?.stats;

      emit({ event: 'progress', data: { stage: 'analysis', message: 'Analyzing coding patterns...' } });

      const weakResult = await executeTool('research.identifyCodingWeakTopics', {
        lcStats,
        targetRoles: options.targetRoles,
      }, userId);

      const weakData = weakResult.result.success
        ? (weakResult.result.data as Record<string, unknown>)?.weakTopics as Array<{ topic: string }>
        : [];

      weakTopics.push(...weakData.map((w) => w.topic));

      const scoreResult = await executeTool('research.computePlacementReadinessScore', {
        lcStats,
      }, userId);

      result.codingProfile = {
        leetcode: lcStats as import('./types').LeetCodeStats,
        hackerrank: null,
        placementReadiness: (scoreResult.result.data as Record<string, unknown>)?.score as number ?? 0,
        weakTopics,
      };
    }
  }

  if (plan.stagesToRun.includes('coding') && options.hackerrankUsername) {
    emit({ event: 'progress', data: { stage: 'hackerrank', message: 'Fetching HackerRank profile...' } });

    const hrResult = await executeTool('research.fetchHackerRankProfile', {
      username: options.hackerrankUsername,
    }, userId);

    if (hrResult.result.success && result.codingProfile) {
      result.codingProfile.hackerrank = (hrResult.result.data as Record<string, unknown>)?.stats as import('./types').HackerRankStats;
    }
  }

  // ─── Stage 3: Project Generation ───
  if (plan.stagesToRun.includes('projects') && result.resumeAnalysis) {
    emit({ event: 'progress', data: { stage: 'projects', message: 'Generating 9 personalized projects...' } });

    const projectResult = await executeTool('foundry.generate9TailoredProjects', {
      skills: result.resumeAnalysis.skills,
      swot: result.resumeAnalysis.swot,
      targetRoles: options.targetRoles,
    }, userId);

    if (projectResult.result.success) {
      result.projects = (projectResult.result.data as Record<string, unknown>)?.projects as import('./types').GeneratedProject[] ?? [];
    }

    emit({
      event: 'tool_result',
      data: { stage: 'projects', count: result.projects.length },
    });
  }

  // ─── Stage 4: Job Matching ───
  if (plan.stagesToRun.includes('jobs')) {
    emit({ event: 'progress', data: { stage: 'jobs', message: 'Finding matching jobs...' } });

    const jobResult = await executeTool('market.fetchLiveJobListings', {
      targetRoles: options.targetRoles ?? ['Software Engineer'],
      location: 'India',
    }, userId);

    if (jobResult.result.success && result.resumeAnalysis) {
      const jobs = (jobResult.result.data as Record<string, unknown>)?.jobs as import('./types').JobListing[] ?? [];

      const rankResult = await executeTool('market.rankJobsByFitScore', {
        jobs,
        userSkills: result.resumeAnalysis.skills,
      }, userId);

      if (rankResult.result.success) {
        const rankedJobs = (rankResult.result.data as Record<string, unknown>)?.jobs as import('./types').JobListing[] ?? [];
        result.jobMatches = rankedJobs.slice(0, 10).map((job) => ({
          job,
          matchedSkills: [],
          missingSkills: [],
          matchScore: job.matchScore,
          readiness: job.matchScore >= 80 ? ('ready' as const) : job.matchScore >= 50 ? ('almost' as const) : ('gap' as const),
        }));
      }
    }
  }

  // ─── Stage 5: Roadmap Generation ───
  if (plan.stagesToRun.includes('roadmap')) {
    emit({ event: 'progress', data: { stage: 'roadmap', message: 'Building your personalized roadmap...' } });

    const roadmapResult = await executeTool('ai.generatePersonalizedRoadmap', {
      skills: result.resumeAnalysis?.skills.map((s) => s.name) ?? [],
      weakTopics,
      targetRoles: options.targetRoles,
      timeline: options.timeline ?? '12 weeks',
    }, userId);

    if (roadmapResult.result.success) {
      result.roadmap = JSON.stringify(roadmapResult.result.data);
    }
  }

  emit({
    event: 'tool_result',
    data: {
      stage: 'complete',
      summary: {
        skills: result.resumeAnalysis?.skills.length ?? 0,
        projects: result.projects.length,
        jobMatches: result.jobMatches.length,
        placementScore: result.codingProfile?.placementReadiness ?? 0,
      },
    },
  });

  return result;
}
