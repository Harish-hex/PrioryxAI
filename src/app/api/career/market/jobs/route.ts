// Job Market API Routes — Bug 4B: Real job fetching with Remotive + Arbeitnow
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient, getAuthUser } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface RawJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  url: string;
  tags: string[];
  postedAt: string;
  source: string;
}

async function fetchFromRemotive(): Promise<RawJob[]> {
  try {
    // ONLY tech categories — no product/marketing/design/sales
    const categories = ['software-dev', 'data', 'devops-sysadmin', 'qa'];
    const results = await Promise.allSettled(
      categories.map((cat) =>
        fetch(`https://remotive.com/api/remote-jobs?category=${cat}&limit=25`, {
          next: { revalidate: 3600 },
        }).then((r) => r.json())
      )
    );

    return results
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => {
        const val = (r as PromiseFulfilledResult<{ jobs?: unknown[] }>).value;
        return val.jobs ?? [];
      })
      .map((job: unknown) => {
        const j = job as Record<string, unknown>;
        return {
          id: `rm-${j.id}`,
          title: String(j.title ?? ''),
          company: String(j.company_name ?? ''),
          location: String(j.candidate_required_location ?? 'Remote'),
          salary: String(j.salary ?? ''),
          description: String(j.description ?? '').replace(/<[^>]*>/g, '').slice(0, 300),
          url: String(j.url ?? ''),
          tags: Array.isArray(j.tags) ? (j.tags as string[]) : [],
          postedAt: String(j.publication_date ?? ''),
          source: 'Remotive',
        };
      });
  } catch (e) {
    console.error('[Jobs] Remotive fetch failed:', e);
    return [];
  }
}

async function fetchFromArbeitnow(): Promise<RawJob[]> {
  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api?page=1', {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json() as { data?: unknown[] };
    return (data.data ?? []).map((job: unknown) => {
      const j = job as Record<string, unknown>;
      return {
        id: `an-${j.slug}`,
        title: String(j.title ?? ''),
        company: String(j.company_name ?? ''),
        location: String(j.location ?? 'Remote'),
        salary: '',
        description: String(j.description ?? '').replace(/<[^>]*>/g, '').slice(0, 300),
        url: String(j.url ?? ''),
        tags: Array.isArray(j.tags) ? (j.tags as string[]) : [],
        postedAt: '',
        source: 'Arbeitnow',
      };
    });
  } catch (e) {
    console.error('[Jobs] Arbeitnow fetch failed:', e);
    return [];
  }
}

// ── Tech-only job filter ─────────────────────────────────────────
const TECH_TITLE_KEYWORDS = [
  'software', 'engineer', 'developer', 'programmer', 'coding',
  'frontend', 'backend', 'fullstack', 'full stack', 'full-stack',
  'devops', 'sre', 'site reliability', 'platform engineer',
  'data engineer', 'data scientist', 'data analyst', 'ml engineer',
  'machine learning', 'ai engineer', 'artificial intelligence',
  'python', 'javascript', 'typescript', 'java', 'golang', 'rust',
  'react', 'node', 'django', 'flask', 'spring', 'kubernetes',
  'cloud engineer', 'aws', 'gcp', 'azure', 'infrastructure',
  'security engineer', 'cybersecurity', 'blockchain', 'web3',
  'mobile developer', 'android', 'ios', 'flutter', 'react native',
  'intern', 'internship', 'sde', 'swe', 'tech lead', 'architect',
  'database', 'api', 'microservices', 'embedded', 'firmware',
  'computer', 'systems', 'network engineer', 'qa engineer', 'test engineer'
];

const EXCLUDE_TITLE_KEYWORDS = [
  'sales', 'marketing', 'copywriter', 'writer', 'editor', 'designer',
  'graphic', 'creative', 'brand', 'social media', 'seo', 'content',
  'recruiter', 'hr ', 'human resources', 'accountant', 'finance',
  'lawyer', 'legal', 'nurse', 'doctor', 'medical', 'jedi', 'manager',
  'account manager', 'business development', 'customer success',
  'customer support', 'operations manager', 'product manager',
  'scrum master', 'project manager', 'agile coach', 'data entry',
  'virtual assistant', 'freelance writer', 'translator'
];

function isTechJob(job: { title: string; tags?: string[] }): boolean {
  const titleLower = job.title.toLowerCase();
  // Hard exclude non-tech keywords
  if (EXCLUDE_TITLE_KEYWORDS.some((kw) => titleLower.includes(kw))) return false;
  // Must contain at least one tech keyword
  return TECH_TITLE_KEYWORDS.some((kw) => titleLower.includes(kw));
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceRoleClient();

  // Fetch user skills from multiple sources
  const [resumeRes, codingRes, profileRes] = await Promise.all([
    db.from('user_resumes')
      .select('skill_entities, parsed_data')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from('user_coding_profiles')
      .select('data')
      .eq('user_id', user.id),
    db.from('users')
      .select('subjects')
      .eq('id', user.id)
      .single()
  ]);

  const resume = resumeRes.data;
  const codingProfiles = codingRes.data ?? [];
  const profile = profileRes.data;

  // Extract skills from resume
  let resumeSkills: string[] = [];
  if (resume) {
    resumeSkills = (resume.skill_entities as { skills?: string[] })?.skills ?? [];
    if (resumeSkills.length === 0 && resume.parsed_data) {
      resumeSkills = (resume.parsed_data as { skills?: string[] }).skills ?? [];
    }
  }

  // Combine all skills
  const userSkillsSet = new Set([
    ...resumeSkills,
    ...codingProfiles.flatMap((p: any) => p.data?.strongTopics ?? p.data?.skills ?? []),
    ...(profile?.subjects ?? [])
  ].filter(Boolean).map((s: string) => s.toLowerCase().trim()));
  
  const userSkillsArray = Array.from(userSkillsSet);
  console.log(`[Jobs] userSkills count: ${userSkillsArray.length}`);

  // Fetch from both sources in parallel
  const [remotiveJobs, arbeitnowJobs] = await Promise.allSettled([
    fetchFromRemotive(),
    fetchFromArbeitnow(),
  ]);

  const allJobs: RawJob[] = [
    ...(remotiveJobs.status === 'fulfilled' ? remotiveJobs.value : []),
    ...(arbeitnowJobs.status === 'fulfilled' ? arbeitnowJobs.value : []),
  ];

  // Filter to tech jobs only — remove Sales, Marketing, Design, etc.
  const techJobs = allJobs.filter(isTechJob);
  console.log(`[Jobs] Total: ${allJobs.length}, Tech only: ${techJobs.length}`);

  // Compute match scores
  const scoreJob = (job: RawJob, skills: string[]): { score: number, matched: string[] } => {
    if (skills.length === 0) return { score: 0, matched: [] };
    const jobText = (job.title + ' ' + job.description + ' ' + job.tags.join(' ')).toLowerCase();
    
    let matchCount = 0;
    let totalWeight = 0;
    const matched: string[] = [];
    
    skills.forEach(skill => {
      const weight = skill.length > 4 ? 2 : 1; // longer/specific skills worth more
      totalWeight += weight;
      if (jobText.includes(skill)) {
        matchCount += weight;
        matched.push(skill);
      }
    });
    
    const rawScore = Math.round((matchCount / (totalWeight || 1)) * 100);
    // Boost for title match
    const titleBoost = skills.some(s => job.title.toLowerCase().includes(s)) ? 10 : 0;
    return { score: Math.min(100, rawScore + titleBoost), matched };
  };

  const jobsWithScores = techJobs.map((job) => {
    const { score, matched } = scoreJob(job, userSkillsArray);
    return { ...job, matchScore: score, matchedSkills: matched };
  });

  // Sort by match score desc
  jobsWithScores.sort((a, b) => b.matchScore - a.matchScore);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  const total = jobsWithScores.length;
  const paginatedJobs = jobsWithScores.slice(offset, offset + limit);

  console.log(`[Jobs] Returning ${paginatedJobs.length} of ${total} tech jobs (page ${page}/${Math.ceil(total / limit)})`);

  return NextResponse.json({ 
    jobs: paginatedJobs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: offset + limit < total,
    },
    debugSkillCount: userSkillsArray.length 
  });
}


// POST: Save a job application
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    jobTitle: string;
    company: string;
    jdUrl?: string;
    matchScore?: number;
  };

  const { error } = await supabase.from('job_applications').insert({
    user_id: user.id,
    job_title: body.jobTitle,
    company: body.company,
    jd_url: body.jdUrl,
    match_score: body.matchScore ?? 0,
    status: 'saved',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
