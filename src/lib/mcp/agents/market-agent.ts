// Market Agent — job fetching, skill matching, application tracking
import type { AgentModule, ToolResult, SkillEntity, JobListing } from '../types';
import { createClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';

import { ApifyClient } from 'apify-client';

async function fetchLiveJobListings(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const targetRoles = (input.targetRoles as string[]) ?? ['Software Engineer'];
  const location = (input.location as string) ?? 'India';
  const role = targetRoles[0] || 'Software Engineer';
  const jobs: JobListing[] = [];

  try {
    if (process.env.APIFY_API_TOKEN) {
      const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
      const run = await client.actor('bebity/linkedin-jobs-scraper').call({
        "keyword": role,
        "location": location,
        "limit": 15
      });
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      for (let i = 0; i < items.length; i++) {
        const item = items[i] as any;
        jobs.push({
          id: `linkedin-${i}-${Date.now()}`,
          title: item.title || 'Unknown Title',
          company: item.company || 'Unknown Company',
          location: item.location || location,
          salary: item.salary || 'Not disclosed',
          url: item.jobUrl || item.url || '',
          requiredSkills: [], // We'll infer this in ranking if missing
          matchScore: 0,
          postedAt: item.postedAt || new Date().toISOString(),
          description: item.description || '' // Stored for matching
        });
      }
    }
  } catch (error) {
    console.error('[Market Agent] Apify fetch failed:', error);
  }

  // Fallback to Remotive API if Apify failed or is unconfigured
  if (jobs.length === 0) {
    try {
      const remotiveRes = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(role)}&limit=15`);
      if (remotiveRes.ok) {
        const remotiveData = await remotiveRes.json();
        const apiJobs = remotiveData.jobs || [];
        for (let i = 0; i < Math.min(apiJobs.length, 15); i++) {
          const item = apiJobs[i];
          jobs.push({
            id: `remotive-${item.id}`,
            title: item.title,
            company: item.company_name,
            location: item.candidate_required_location || 'Remote',
            salary: item.salary || 'Not disclosed',
            url: item.url,
            requiredSkills: [],
            matchScore: 0,
            postedAt: item.publication_date,
            description: item.description || ''
          });
        }
      }
    } catch (fallbackError) {
      console.error('[Market Agent] Remotive fallback failed:', fallbackError);
    }
  }

  return { success: true, data: { jobs } };
}

async function computeSkillMatchScore(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const userSkills = input.userSkills as SkillEntity[];
  const requiredSkills = input.requiredSkills as string[];

  const userSkillNames = new Set(
    userSkills.map((s) => s.name.toLowerCase())
  );
  const matched = requiredSkills.filter((s) =>
    userSkillNames.has(s.toLowerCase())
  );
  const missing = requiredSkills.filter(
    (s) => !userSkillNames.has(s.toLowerCase())
  );

  const score =
    requiredSkills.length > 0
      ? Math.round((matched.length / requiredSkills.length) * 100)
      : 0;

  const readiness: 'ready' | 'almost' | 'gap' =
    score >= 80 ? 'ready' : score >= 50 ? 'almost' : 'gap';

  return {
    success: true,
    data: { score, matched, missing, readiness, totalRequired: requiredSkills.length },
  };
}

async function rankJobsByFitScore(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const jobs = input.jobs as (JobListing & { description?: string })[];
  const userSkills = input.userSkills as SkillEntity[];

  const userSkillNames = new Set(
    userSkills.map((s) => s.name.toLowerCase())
  );

  const rankedJobs = jobs
    .map((job) => {
      // Create a combined text block from title and description
      const fullText = `${job.title} ${job.description || ''}`.toLowerCase();
      let matchCount = 0;
      const totalSkillsMatched = new Set<string>();

      Array.from(userSkillNames).forEach((skill) => {
        if (fullText.includes(skill)) {
          totalSkillsMatched.add(skill);
          matchCount++;
        }
      });

      // If Apify or Remotive returned requiredSkills we use that for denominator, else we use an arbitrary base of 5 
      const denom = job.requiredSkills?.length > 0 ? job.requiredSkills.length : Math.max(5, matchCount);
      let score = denom > 0 ? Math.round((matchCount / denom) * 100) : 0;
      score = Math.min(score, 100); // cap at 100

      return { ...job, matchScore: score, requiredSkills: Array.from(totalSkillsMatched) };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  return { success: true, data: { jobs: rankedJobs } };
}

async function extractJDRequirements(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const jdText = input.jdText as string;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Extract structured requirements from a job description. Return JSON: { requiredSkills: string[], preferredSkills: string[], experienceYears: number, educationLevel: string, responsibilities: string[] }`,
      },
      { role: 'user', content: jdText },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 800,
  });

  const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  return { success: true, data: result };
}

async function generateJobApplicationDraft(
  input: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  const jobTitle = input.jobTitle as string;
  const company = input.company as string;
  const jdText = input.jdText as string;

  const supabase = createClient();
  const { data: profile } = await supabase
    .from('users')
    .select('name, college, semester, target_roles')
    .eq('id', userId)
    .single();

  const { data: resume } = await supabase
    .from('user_resumes')
    .select('skill_entities')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Write a concise, compelling cover letter for this job application. Return JSON: { coverLetter: string, keyPoints: string[] }`,
      },
      {
        role: 'user',
        content: `Applicant: ${profile?.name ?? 'Student'}, ${profile?.college ?? 'Engineering College'}, Sem ${profile?.semester ?? '?'}\nSkills: ${JSON.stringify((resume?.skill_entities as SkillEntity[])?.map((s) => s.name) ?? [])}\nJob: ${jobTitle} at ${company}\nJD: ${jdText}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1000,
  });

  const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  return { success: true, data: result };
}

async function trackApplicationStatus(
  input: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  const supabase = createClient();
  const applicationId = input.applicationId as string;
  const newStatus = input.status as string;

  if (applicationId && newStatus) {
    await supabase
      .from('job_applications')
      .update({ status: newStatus, ...(newStatus === 'applied' ? { applied_at: new Date().toISOString() } : {}) })
      .eq('id', applicationId)
      .eq('user_id', userId);
  }

  const { data: applications } = await supabase
    .from('job_applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { success: true, data: { applications: applications ?? [] } };
}

async function alertNewJobMatches(
  input: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  // Check for new jobs matching user's profile since last check
  const supabase = createClient();
  const { data: profile } = await supabase
    .from('users')
    .select('target_roles, target_companies')
    .eq('id', userId)
    .single();

  return {
    success: true,
    data: {
      targetRoles: profile?.target_roles ?? [],
      targetCompanies: profile?.target_companies ?? [],
      message: 'Job alerts configured for target roles and companies',
    },
  };
}

export const marketAgent: AgentModule = {
  name: 'Market Agent',
  prefix: 'market',
  tools: [
    { name: 'fetchLiveJobListings', description: 'Fetch live job listings via Apify or AI-generated mock data', inputSchema: { type: 'object', properties: { targetRoles: { type: 'array' }, location: { type: 'string' } } }, handler: fetchLiveJobListings },
    { name: 'computeSkillMatchScore', description: 'Compute match score between user skills and job requirements', inputSchema: { type: 'object', properties: { userSkills: { type: 'array' }, requiredSkills: { type: 'array' } } }, handler: computeSkillMatchScore },
    { name: 'rankJobsByFitScore', description: 'Rank jobs by skill match fit score', inputSchema: { type: 'object', properties: { jobs: { type: 'array' }, userSkills: { type: 'array' } } }, handler: rankJobsByFitScore },
    { name: 'extractJDRequirements', description: 'Extract structured requirements from a job description', inputSchema: { type: 'object', properties: { jdText: { type: 'string' } } }, handler: extractJDRequirements },
    { name: 'generateJobApplicationDraft', description: 'Generate tailored cover letter for a job', inputSchema: { type: 'object', properties: { jobTitle: { type: 'string' }, company: { type: 'string' }, jdText: { type: 'string' } } }, handler: generateJobApplicationDraft },
    { name: 'trackApplicationStatus', description: 'Track and update job application statuses', inputSchema: { type: 'object', properties: { applicationId: { type: 'string' }, status: { type: 'string' } } }, handler: trackApplicationStatus },
    { name: 'alertNewJobMatches', description: 'Configure alerts for new job matches', inputSchema: {}, handler: alertNewJobMatches },
  ],
};
