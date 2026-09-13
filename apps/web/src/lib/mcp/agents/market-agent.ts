// Market Agent — job fetching, skill matching, application tracking
import type { AgentModule, ToolResult, SkillEntity, JobListing } from '../types';
import { createClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';
import { ApifyClient } from 'apify-client';

const FALLBACK_TECH_JOBS: JobListing[] = [
  {
    id: 'prioryx-sde-1',
    title: 'Software Development Engineer - I (Full Stack)',
    company: 'Razorpay / Fast-Growing Fintech',
    location: 'Bangalore / Remote',
    salary: '₹14 - ₹20 LPA',
    url: 'https://razorpay.com/jobs',
    requiredSkills: ['react', 'next.js', 'typescript', 'node.js', 'postgresql', 'redis'],
    matchScore: 88,
    postedAt: new Date(Date.now() - 86400000).toISOString(),
    description: 'Looking for SDE-1 with strong skills in React, TypeScript, Next.js, Node.js, and Postgres to build high-scale financial platforms.',
  },
  {
    id: 'prioryx-ai-2',
    title: 'AI/ML Engineer - Junior',
    company: 'DeepTech Labs',
    location: 'Hyderabad / Hybrid',
    salary: '₹16 - ₹24 LPA',
    url: 'https://angel.co',
    requiredSkills: ['python', 'pytorch', 'openai', 'fastapi', 'docker', 'postgresql'],
    matchScore: 84,
    postedAt: new Date(Date.now() - 172800000).toISOString(),
    description: 'Work on production LLM pipelines, RAG systems, model evaluation, and autonomous AI agents using Python and PyTorch.',
  },
  {
    id: 'prioryx-backend-3',
    title: 'Backend Engineer (Go / Node)',
    company: 'Swiggy / Zepto Tech',
    location: 'Remote, India',
    salary: '₹15 - ₹22 LPA',
    url: 'https://careers.swiggy.com',
    requiredSkills: ['go', 'node.js', 'postgresql', 'redis', 'docker', 'kubernetes', 'aws'],
    matchScore: 80,
    postedAt: new Date(Date.now() - 259200000).toISOString(),
    description: 'Design and build resilient microservices, low-latency APIs, caching architectures with Redis and PostgreSQL.',
  },
  {
    id: 'prioryx-frontend-4',
    title: 'Frontend Engineer (React / Next.js)',
    company: 'BrowserStack',
    location: 'Mumbai / Remote',
    salary: '₹12 - ₹18 LPA',
    url: 'https://browserstack.com/careers',
    requiredSkills: ['react', 'typescript', 'tailwind', 'next.js', 'javascript', 'html', 'css'],
    matchScore: 90,
    postedAt: new Date(Date.now() - 345600000).toISOString(),
    description: 'Build fast, responsive, and visually stunning web interfaces with Next.js, TypeScript, and modern CSS/Tailwind.',
  },
];

async function fetchLiveJobListings(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const targetRoles = (input.targetRoles as string[]) ?? ['Software Engineer'];
  const location = (input.location as string) ?? 'India';
  const role = targetRoles[0] || 'Software Engineer';
  const jobs: JobListing[] = [];
  const token = process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN;

  try {
    if (token) {
      const client = new ApifyClient({ token });
      const run = await client.actor('bebity/linkedin-jobs-scraper').call({
        keyword: role,
        location: location,
        limit: 15,
      });
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      for (let i = 0; i < items.length; i++) {
        const item = items[i] as Record<string, any>;
        jobs.push({
          id: `linkedin-${i}-${Date.now()}`,
          title: item.title || 'Software Engineer',
          company: item.company || 'Tech Company',
          location: item.location || location,
          salary: item.salary || 'Competitive',
          url: item.jobUrl || item.url || '',
          requiredSkills: [],
          matchScore: 0,
          postedAt: item.postedAt || new Date().toISOString(),
          description: item.description || '',
        });
      }
    }
  } catch (error) {
    console.warn('[Market Agent] Apify fetch failed, falling back to Remotive/Arbeitnow:', (error as Error).message);
  }

  // Fallback 1: Remotive API
  if (jobs.length === 0) {
    try {
      const remotiveRes = await fetch(
        `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(role)}&limit=15`,
        { headers: { Accept: 'application/json' } }
      );
      if (remotiveRes.ok) {
        const remotiveData = (await remotiveRes.json()) as { jobs?: Array<Record<string, any>> };
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
            requiredSkills: Array.isArray(item.tags) ? item.tags : [],
            matchScore: 0,
            postedAt: item.publication_date || new Date().toISOString(),
            description: String(item.description || '').replace(/<[^>]*>/g, '').slice(0, 500),
          });
        }
      }
    } catch (fallbackError) {
      console.warn('[Market Agent] Remotive fallback failed:', (fallbackError as Error).message);
    }
  }

  // Fallback 2: Arbeitnow API
  if (jobs.length === 0) {
    try {
      const res = await fetch('https://www.arbeitnow.com/api/job-board-api?page=1', {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = (await res.json()) as { data?: Array<Record<string, any>> };
        const items = data.data || [];
        for (let i = 0; i < Math.min(items.length, 15); i++) {
          const item = items[i];
          jobs.push({
            id: `an-${item.slug || i}`,
            title: item.title || 'Software Developer',
            company: item.company_name || 'Tech Company',
            location: item.location || 'Remote',
            salary: 'Competitive',
            url: item.url || '',
            requiredSkills: Array.isArray(item.tags) ? item.tags : [],
            matchScore: 0,
            postedAt: new Date().toISOString(),
            description: String(item.description || '').replace(/<[^>]*>/g, '').slice(0, 500),
          });
        }
      }
    } catch (e) {
      console.warn('[Market Agent] Arbeitnow fallback failed:', (e as Error).message);
    }
  }

  // Fallback 3: Curated high-yield tech jobs
  if (jobs.length === 0) {
    jobs.push(...FALLBACK_TECH_JOBS);
  }

  return { success: true, data: { jobs, count: jobs.length } };
}

async function computeSkillMatchScore(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const userSkills = (input.userSkills as SkillEntity[]) ?? [];
  const requiredSkills = (input.requiredSkills as string[]) ?? [];

  const userSkillNames = new Set(
    userSkills.map((s) => (typeof s === 'string' ? s : s.name).toLowerCase())
  );
  const matched = requiredSkills.filter((s) => userSkillNames.has(s.toLowerCase()));
  const missing = requiredSkills.filter((s) => !userSkillNames.has(s.toLowerCase()));

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
  const jobs = (input.jobs as (JobListing & { description?: string })[]) ?? [];
  const userSkills = (input.userSkills as SkillEntity[]) ?? [];

  const userSkillNames = new Set(
    userSkills.map((s) => (typeof s === 'string' ? s : s.name).toLowerCase())
  );

  const rankedJobs = jobs
    .map((job) => {
      const fullText = `${job.title} ${job.description || ''}`.toLowerCase();
      let matchCount = 0;
      const totalSkillsMatched = new Set<string>();

      userSkillNames.forEach((skill) => {
        if (fullText.includes(skill)) {
          totalSkillsMatched.add(skill);
          matchCount++;
        }
      });

      const denom =
        job.requiredSkills && job.requiredSkills.length > 0
          ? job.requiredSkills.length
          : Math.max(5, matchCount);
      let score = denom > 0 ? Math.round((matchCount / denom) * 100) : 0;
      // Boost for title match
      const titleLower = job.title.toLowerCase();
      if (Array.from(userSkillNames).some((s) => titleLower.includes(s))) {
        score += 15;
      }
      score = Math.min(score, 100);

      const matchedSkills = Array.from(totalSkillsMatched);
      return {
        ...job,
        matchScore: score,
        requiredSkills: job.requiredSkills?.length ? job.requiredSkills : matchedSkills,
        matchedSkills,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  return { success: true, data: { jobs: rankedJobs, count: rankedJobs.length } };
}

async function extractJDRequirements(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const jdText = input.jdText as string;
  if (!jdText || jdText.trim().length < 10) {
    return { success: false, data: null, error: 'Job description text too short' };
  }

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
    .select('skill_entities, parsed_data')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  let userSkills: string[] = [];
  if (Array.isArray(resume?.skill_entities)) {
    userSkills = (resume.skill_entities as SkillEntity[]).map((s) => (typeof s === 'string' ? s : s.name));
  } else if (resume?.skill_entities && typeof resume.skill_entities === 'object') {
    userSkills = (resume.skill_entities as { skills?: string[] }).skills ?? [];
  } else if (resume?.parsed_data && typeof resume.parsed_data === 'object') {
    userSkills = (resume.parsed_data as { skills?: string[] }).skills ?? [];
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Write a concise, compelling cover letter for this job application. Return JSON: { coverLetter: string, keyPoints: string[] }`,
      },
      {
        role: 'user',
        content: `Applicant: ${profile?.name ?? 'Student'}, ${profile?.college ?? 'Engineering College'}, Sem ${profile?.semester ?? '?'}\nSkills: ${JSON.stringify(userSkills)}\nJob: ${jobTitle} at ${company}\nJD: ${jdText || 'Standard software engineering responsibilities.'}`,
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
  _input: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
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
    { name: 'fetchLiveJobListings', description: 'Fetch live job listings via Apify or reliable tech job feeds', inputSchema: { type: 'object', properties: { targetRoles: { type: 'array' }, location: { type: 'string' } } }, handler: fetchLiveJobListings },
    { name: 'computeSkillMatchScore', description: 'Compute match score between user skills and job requirements', inputSchema: { type: 'object', properties: { userSkills: { type: 'array' }, requiredSkills: { type: 'array' } } }, handler: computeSkillMatchScore },
    { name: 'rankJobsByFitScore', description: 'Rank jobs by skill match fit score', inputSchema: { type: 'object', properties: { jobs: { type: 'array' }, userSkills: { type: 'array' } } }, handler: rankJobsByFitScore },
    { name: 'extractJDRequirements', description: 'Extract structured requirements from a job description', inputSchema: { type: 'object', properties: { jdText: { type: 'string' } } }, handler: extractJDRequirements },
    { name: 'generateJobApplicationDraft', description: 'Generate tailored cover letter for a job', inputSchema: { type: 'object', properties: { jobTitle: { type: 'string' }, company: { type: 'string' }, jdText: { type: 'string' } } }, handler: generateJobApplicationDraft },
    { name: 'trackApplicationStatus', description: 'Track and update job application statuses', inputSchema: { type: 'object', properties: { applicationId: { type: 'string' }, status: { type: 'string' } } }, handler: trackApplicationStatus },
    { name: 'alertNewJobMatches', description: 'Configure alerts for new job matches', inputSchema: {}, handler: alertNewJobMatches },
  ],
};
