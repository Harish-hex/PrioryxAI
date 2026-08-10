// Job Market API Routes — Bug 4B: Real job fetching with Remotive + Arbeitnow
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const categories = ['software-dev', 'data', 'devops-sysadmin', 'product'];
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

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch user skills for match scoring
  const { data: resume } = await supabase
    .from('user_resumes')
    .select('skill_entities')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const userSkills: string[] = (
    (resume?.skill_entities as { skills?: string[] } | null)?.skills ?? []
  ).map((s: string) => s.toLowerCase());

  // Fetch from both sources in parallel
  const [remotiveJobs, arbeitnowJobs] = await Promise.allSettled([
    fetchFromRemotive(),
    fetchFromArbeitnow(),
  ]);

  const allJobs: RawJob[] = [
    ...(remotiveJobs.status === 'fulfilled' ? remotiveJobs.value : []),
    ...(arbeitnowJobs.status === 'fulfilled' ? arbeitnowJobs.value : []),
  ];

  // Compute match scores
  const jobsWithScores = allJobs.map((job) => {
    if (userSkills.length === 0) return { ...job, matchScore: 0, matchedSkills: [] };
    const jdText = (
      job.title + ' ' + job.description + ' ' + job.tags.join(' ')
    ).toLowerCase();
    const matched = userSkills.filter((s) => jdText.includes(s));
    const score = Math.min(Math.round((matched.length / Math.max(userSkills.length, 1)) * 100), 95);
    return { ...job, matchScore: score, matchedSkills: matched };
  });

  // Sort by match score desc
  jobsWithScores.sort((a, b) => b.matchScore - a.matchScore);

  console.log(`[Jobs] Returning ${jobsWithScores.length} jobs (${remotiveJobs.status === 'fulfilled' ? remotiveJobs.value.length : 0} Remotive + ${arbeitnowJobs.status === 'fulfilled' ? arbeitnowJobs.value.length : 0} Arbeitnow)`);

  return NextResponse.json({ jobs: jobsWithScores });
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
