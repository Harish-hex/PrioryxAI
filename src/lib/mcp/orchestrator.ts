// Global AI Orchestrator — chains all 6 agents for full career analysis
import type { SSEEvent, SkillEntity, SWOTAnalysis, CareerAnalysisResult } from './types';
import { executeTool } from './registry';

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
  }
): Promise<CareerAnalysisResult> {
  const result: CareerAnalysisResult = {
    resumeAnalysis: null,
    codingProfile: null,
    projects: [],
    jobMatches: [],
    roadmap: '',
  };

  // ─── Stage 1: Resume Analysis ───
  if (options.rawResumeText) {
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
  }

  // ─── Stage 2: Coding Profile ───
  const weakTopics: string[] = [];

  if (options.leetcodeUsername) {
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

  if (options.hackerrankUsername) {
    emit({ event: 'progress', data: { stage: 'hackerrank', message: 'Fetching HackerRank profile...' } });

    const hrResult = await executeTool('research.fetchHackerRankProfile', {
      username: options.hackerrankUsername,
    }, userId);

    if (hrResult.result.success && result.codingProfile) {
      result.codingProfile.hackerrank = (hrResult.result.data as Record<string, unknown>)?.stats as import('./types').HackerRankStats;
    }
  }

  // ─── Stage 3: Project Generation ───
  if (result.resumeAnalysis) {
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
        readiness: job.matchScore >= 80 ? 'ready' as const : job.matchScore >= 50 ? 'almost' as const : 'gap' as const,
      }));
    }
  }

  // ─── Stage 5: Roadmap Generation ───
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
