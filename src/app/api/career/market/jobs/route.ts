// Job Market API Routes — Bug 4B: Real job fetching with Remotive + Arbeitnow
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient, getAuthUser } from '@/lib/supabase-server';
import { redis, withFallback } from '@/lib/redis';

export const runtime = 'nodejs';
export const maxDuration = 60;

// The two external job sources are already Next-fetch-cached for 1h, but this
// route still re-runs the DB skill lookup + per-job scoring pass on every
// request. Wrapping the final paginated response in Redis avoids paying that
// cost again on every visit within the window — job listings don't need to
// be fresher than this.
const CACHE_TTL = 15 * 60; // seconds

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
          signal: AbortSignal.timeout(8000),
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

async function fetchFromRemoteOK(): Promise<RawJob[]> {
  try {
    const res = await fetch('https://remoteok.com/api', {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'Mozilla/5.0' }, // RemoteOK 403s requests with no UA
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json() as unknown[];
    // First element is always a legal-notice object, not a job.
    return data.slice(1).map((job: unknown) => {
      const j = job as Record<string, unknown>;
      return {
        id: `rok-${j.id}`,
        title: String(j.position ?? ''),
        company: String(j.company ?? ''),
        location: String(j.location ?? 'Remote'),
        salary: j.salary_min ? `$${j.salary_min}-${j.salary_max ?? j.salary_min}` : '',
        description: String(j.description ?? '').replace(/<[^>]*>/g, '').slice(0, 300),
        url: String(j.url ?? (j.slug ? `https://remoteok.com/remote-jobs/${j.slug}` : '')),
        tags: Array.isArray(j.tags) ? (j.tags as string[]) : [],
        postedAt: String(j.date ?? ''),
        source: 'RemoteOK',
      };
    });
  } catch (e) {
    console.error('[Jobs] RemoteOK fetch failed:', e);
    return [];
  }
}

async function fetchFromJobicy(): Promise<RawJob[]> {
  try {
    const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=50&tag=dev', {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json() as { jobs?: unknown[] };
    return (data.jobs ?? []).map((job: unknown) => {
      const j = job as Record<string, unknown>;
      const industry = Array.isArray(j.jobIndustry) ? (j.jobIndustry as string[]) : [];
      return {
        id: `jby-${j.id}`,
        title: String(j.jobTitle ?? ''),
        company: String(j.companyName ?? ''),
        location: String(j.jobGeo ?? 'Remote'),
        salary: j.annualSalaryMin ? `${j.annualSalaryMin}-${j.annualSalaryMax ?? j.annualSalaryMin} ${j.salaryCurrency ?? ''}`.trim() : '',
        description: String(j.jobExcerpt ?? j.jobDescription ?? '').replace(/<[^>]*>/g, '').slice(0, 300),
        url: String(j.url ?? ''),
        tags: industry,
        postedAt: String(j.pubDate ?? ''),
        source: 'Jobicy',
      };
    });
  } catch (e) {
    console.error('[Jobs] Jobicy fetch failed:', e);
    return [];
  }
}

async function fetchFromArbeitnow(): Promise<RawJob[]> {
  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api?page=1', {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
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

async function fetchFromAdzuna(query: string): Promise<RawJob[]> {
  const appId = process.env.ADZUNA_API_KEY;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];
  try {
    // India + US in parallel — same app_id/app_key work across Adzuna's country endpoints.
    const countries = ['in', 'us'];
    const results = await Promise.allSettled(
      countries.map((c) =>
        fetch(
          `https://api.adzuna.com/v1/api/jobs/${c}/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=25&what=${encodeURIComponent(query)}&content-type=application/json`,
          { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) }
        ).then((r) => r.json())
      )
    );
    return results
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => (r as PromiseFulfilledResult<{ results?: unknown[] }>).value.results ?? [])
      .map((job: unknown) => {
        const j = job as Record<string, unknown>;
        const loc = j.location as Record<string, unknown> | undefined;
        const company = j.company as Record<string, unknown> | undefined;
        return {
          id: `adz-${j.id}`,
          title: String(j.title ?? ''),
          company: String(company?.display_name ?? ''),
          location: String(loc?.display_name ?? 'Remote'),
          salary: j.salary_min ? `${j.salary_min}-${j.salary_max ?? j.salary_min}` : '',
          description: String(j.description ?? '').replace(/<[^>]*>/g, '').slice(0, 300),
          url: String(j.redirect_url ?? ''),
          tags: [],
          postedAt: String(j.created ?? ''),
          source: 'Adzuna',
        };
      });
  } catch (e) {
    console.error('[Jobs] Adzuna fetch failed:', e);
    return [];
  }
}

async function fetchFromJooble(query: string): Promise<RawJob[]> {
  const key = process.env.JOOBLE_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch(`https://jooble.org/api/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords: query }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { jobs?: unknown[] };
    return (data.jobs ?? []).map((job: unknown) => {
      const j = job as Record<string, unknown>;
      return {
        id: `job-${String(j.id ?? j.link ?? '').slice(0, 60)}`,
        title: String(j.title ?? ''),
        company: String(j.company ?? ''),
        location: String(j.location ?? 'Remote'),
        salary: String(j.salary ?? ''),
        description: String(j.snippet ?? '').replace(/<[^>]*>/g, '').slice(0, 300),
        url: String(j.link ?? ''),
        tags: [],
        postedAt: String(j.updated ?? ''),
        source: 'Jooble',
      };
    });
  } catch (e) {
    console.error('[Jobs] Jooble fetch failed:', e);
    return [];
  }
}

async function fetchFromCareerjet(query: string): Promise<RawJob[]> {
  const affid = process.env.CAREERJET_AFFID;
  if (!affid) return [];
  try {
    const url =
      `https://public.api.careerjet.net/search?affid=${affid}&keywords=${encodeURIComponent(query)}` +
      `&location=&user_ip=1.1.1.1&user_agent=Mozilla%2F5.0&url=${encodeURIComponent('https://prioryxai.com/career/market/jobs')}&pagesize=25`;
    const res = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = (await res.json()) as { jobs?: unknown[] };
    return (data.jobs ?? []).map((job: unknown) => {
      const j = job as Record<string, unknown>;
      return {
        id: `cj-${String(j.url ?? '').slice(-40)}`,
        title: String(j.title ?? ''),
        company: String(j.company ?? ''),
        location: String(j.locations ?? 'Remote'),
        salary: String(j.salary ?? ''),
        description: String(j.description ?? '').replace(/<[^>]*>/g, '').slice(0, 300),
        url: String(j.url ?? ''),
        tags: [],
        postedAt: String(j.date ?? ''),
        source: 'Careerjet',
      };
    });
  } catch (e) {
    console.error('[Jobs] Careerjet fetch failed:', e);
    return [];
  }
}

async function fetchFromFindwork(query: string): Promise<RawJob[]> {
  const key = process.env.FINDWORK_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch(`https://findwork.dev/api/jobs/?search=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Token ${key}` },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: unknown[] };
    return (data.results ?? []).map((job: unknown) => {
      const j = job as Record<string, unknown>;
      return {
        id: `fw-${j.id}`,
        title: String(j.role ?? ''),
        company: String(j.company_name ?? ''),
        location: String(j.location ?? 'Remote'),
        salary: '',
        description: String(j.text ?? '').replace(/<[^>]*>/g, '').slice(0, 300),
        url: String(j.url ?? ''),
        tags: Array.isArray(j.keywords) ? (j.keywords as string[]) : [],
        postedAt: String(j.date_posted ?? ''),
        source: 'Findwork',
      };
    });
  } catch (e) {
    console.error('[Jobs] Findwork fetch failed:', e);
    return [];
  }
}

async function fetchFromUSAJobs(query: string): Promise<RawJob[]> {
  const key = process.env.USAJOBS_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch(`https://data.usajobs.gov/api/search?Keyword=${encodeURIComponent(query)}&ResultsPerPage=25`, {
      headers: {
        Host: 'data.usajobs.gov',
        // USAJOBS requires the User-Agent to be the email registered for the key.
        'User-Agent': 'yugendhars06@gmail.com',
        'Authorization-Key': key,
      },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { SearchResult?: { SearchResultItems?: unknown[] } };
    const items = data.SearchResult?.SearchResultItems ?? [];
    return items.map((item: unknown) => {
      const desc = ((item as Record<string, unknown>)?.MatchedObjectDescriptor ?? {}) as Record<string, any>;
      const pay = desc.PositionRemuneration?.[0];
      return {
        id: `usa-${desc.PositionID ?? desc.PositionURI ?? Math.random()}`,
        title: String(desc.PositionTitle ?? ''),
        company: String(desc.OrganizationName ?? ''),
        location: String(desc.PositionLocationDisplay ?? 'USA'),
        salary: pay ? `${pay.MinimumRange}-${pay.MaximumRange} ${pay.RateIntervalCode ?? ''}`.trim() : '',
        description: String(desc.UserArea?.Details?.JobSummary ?? desc.QualificationSummary ?? '')
          .replace(/<[^>]*>/g, '')
          .slice(0, 300),
        url: String(desc.PositionURI ?? ''),
        tags: [],
        postedAt: String(desc.PublicationStartDate ?? ''),
        source: 'USAJOBS',
      };
    });
  } catch (e) {
    console.error('[Jobs] USAJOBS fetch failed:', e);
    return [];
  }
}

async function fetchFromTheMuse(): Promise<RawJob[]> {
  const key = process.env.THEMUSE_API_KEY;
  if (!key) return [];
  try {
    const categories = ['Software Engineering', 'Data Science', 'Data and Analytics', 'IT'];
    const results = await Promise.allSettled(
      categories.map((cat) =>
        fetch(`https://www.themuse.com/api/public/jobs?category=${encodeURIComponent(cat)}&page=0&api_key=${key}`, {
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(8000),
        }).then((r) => r.json())
      )
    );
    return results
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => (r as PromiseFulfilledResult<{ results?: unknown[] }>).value.results ?? [])
      .map((job: unknown) => {
        const j = job as Record<string, unknown>;
        const locations = Array.isArray(j.locations)
          ? (j.locations as Array<{ name?: string }>).map((l) => l.name).filter(Boolean).join(', ')
          : '';
        const company = j.company as Record<string, unknown> | undefined;
        const refs = j.refs as Record<string, unknown> | undefined;
        return {
          id: `muse-${j.id}`,
          title: String(j.name ?? ''),
          company: String(company?.name ?? ''),
          location: locations || 'Remote',
          salary: '',
          description: String(j.contents ?? '').replace(/<[^>]*>/g, '').slice(0, 300),
          url: String(refs?.landing_page ?? ''),
          tags: Array.isArray(j.tags) ? (j.tags as string[]) : [],
          postedAt: String(j.publication_date ?? ''),
          source: 'The Muse',
        };
      });
  } catch (e) {
    console.error('[Jobs] The Muse fetch failed:', e);
    return [];
  }
}

// JobDataLake — kept as an explicit no-op rather than a guessed integration.
// The key exists in the environment but the API has no publicly documented
// endpoint/response schema we could verify; wiring it up on a guess risks
// silently returning nothing (or breaking) with no way to tell why. Ask
// whoever issued this key for the base URL + request/response shape and this
// slots in exactly like the fetchers above.
async function fetchFromJobDataLake(): Promise<RawJob[]> {
  return [];
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

  const { searchParams: qs } = new URL(request.url);
  const cacheKey = `jobs:${user.id}:${qs.get('page') ?? '1'}:${qs.get('limit') ?? '20'}`;
  const cached = await withFallback(() => redis.get(cacheKey), null);
  if (cached) {
    return NextResponse.json(cached);
  }

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
      .select('platform, data')
      .eq('user_id', user.id),
    db.from('users')
      .select('subjects')
      .eq('id', user.id)
      .single()
  ]);

  const resume = resumeRes.data;
  const codingProfiles = codingRes.data ?? [];
  const profile = profileRes.data;

  // Extract skills/strong topics from a connected coding platform profile.
  // `user_coding_profiles.data` shape differs per platform — see
  // src/app/api/leetcode/connect/route.ts and src/app/api/hackerrank/connect/route.ts
  // for what actually gets written.
  function extractSkillsFromCodingProfile(p: { platform: string; data: any }): string[] {
    if (p.platform === 'leetcode') {
      const tags = p.data?.skillStats?.data?.matchedUser?.tagProblemCounts ?? {};
      const tagNames = [...(tags.advanced ?? []), ...(tags.intermediate ?? []), ...(tags.fundamental ?? [])]
        .filter((t: any) => t?.problemsSolved > 0)
        .map((t: any) => t.tagName);
      const langs = (p.data?.languageStats?.matchedUser?.languageProblemCount ?? [])
        .filter((l: any) => l?.problemsSolved > 0)
        .map((l: any) => l.languageName);
      return [...tagNames, ...langs];
    }
    if (p.platform === 'hackerrank') {
      return Array.isArray(p.data?.badges) ? p.data.badges : [];
    }
    return [];
  }

  // Extract skills from resume — handle both { skills: string[] } and SkillEntity[] formats
  let resumeSkills: string[] = [];
  if (resume) {
    const se = resume.skill_entities;
    if (Array.isArray(se)) {
      // SkillEntity[] format: [{name, category, proficiency, evidence}]
      resumeSkills = se.map((s: any) => (typeof s === 'string' ? s : s?.name)).filter(Boolean) as string[];
    } else if (se && typeof se === 'object') {
      resumeSkills = (se as { skills?: string[] }).skills ?? [];
    }
    if (resumeSkills.length === 0 && resume.parsed_data) {
      resumeSkills = (resume.parsed_data as { skills?: string[] }).skills ?? [];
    }
  }

  // Combine all skills
  const userSkillsSet = new Set([
    ...resumeSkills,
    ...codingProfiles.flatMap((p: any) => extractSkillsFromCodingProfile(p)),
    ...(profile?.subjects ?? [])
  ].filter(Boolean).map((s: string) => s.toLowerCase().trim()));
  
  const userSkillsArray = Array.from(userSkillsSet);
  console.log(`[Jobs] userSkills count: ${userSkillsArray.length}`);

  // The keyed sources below (Adzuna, Jooble, Careerjet, Findwork, USAJOBS,
  // The Muse) take a search query — bias it toward the user's own strongest
  // skills so these sources return jobs actually relevant to them, instead of
  // a generic "software developer" firehose.
  const querySkills = userSkillsArray.slice(0, 3);
  const searchQuery = querySkills.length > 0 ? querySkills.join(' ') : 'software developer';

  // Fetch from all sources in parallel — more sources means more real
  // candidates for a genuinely good match to actually surface.
  const [
    remotiveJobs, arbeitnowJobs, remoteOkJobs, jobicyJobs,
    adzunaJobs, joobleJobs, careerjetJobs, findworkJobs, usaJobsJobs, museJobs, jobDataLakeJobs,
  ] = await Promise.allSettled([
    fetchFromRemotive(),
    fetchFromArbeitnow(),
    fetchFromRemoteOK(),
    fetchFromJobicy(),
    fetchFromAdzuna(searchQuery),
    fetchFromJooble(searchQuery),
    fetchFromCareerjet(searchQuery),
    fetchFromFindwork(searchQuery),
    fetchFromUSAJobs(searchQuery),
    fetchFromTheMuse(),
    fetchFromJobDataLake(),
  ]);

  const allJobs: RawJob[] = [
    ...(remotiveJobs.status === 'fulfilled' ? remotiveJobs.value : []),
    ...(arbeitnowJobs.status === 'fulfilled' ? arbeitnowJobs.value : []),
    ...(remoteOkJobs.status === 'fulfilled' ? remoteOkJobs.value : []),
    ...(jobicyJobs.status === 'fulfilled' ? jobicyJobs.value : []),
    ...(adzunaJobs.status === 'fulfilled' ? adzunaJobs.value : []),
    ...(joobleJobs.status === 'fulfilled' ? joobleJobs.value : []),
    ...(careerjetJobs.status === 'fulfilled' ? careerjetJobs.value : []),
    ...(findworkJobs.status === 'fulfilled' ? findworkJobs.value : []),
    ...(usaJobsJobs.status === 'fulfilled' ? usaJobsJobs.value : []),
    ...(museJobs.status === 'fulfilled' ? museJobs.value : []),
    ...(jobDataLakeJobs.status === 'fulfilled' ? jobDataLakeJobs.value : []),
  ];

  console.log(`[Jobs] Sources fulfilled: remotive=${remotiveJobs.status} arbeitnow=${arbeitnowJobs.status} remoteok=${remoteOkJobs.status} jobicy=${jobicyJobs.status} adzuna=${adzunaJobs.status} jooble=${joobleJobs.status} careerjet=${careerjetJobs.status} findwork=${findworkJobs.status} usajobs=${usaJobsJobs.status} muse=${museJobs.status}`);

  // Multiple aggregators frequently surface the exact same posting (a job
  // board syndicated to several of these APIs) — dedupe by URL before
  // scoring so the user doesn't see the same listing repeated.
  const seenUrls = new Set<string>();
  const dedupedJobs = allJobs.filter((job) => {
    if (!job.url || !job.title) return false;
    if (seenUrls.has(job.url)) return false;
    seenUrls.add(job.url);
    return true;
  });

  // Filter to tech jobs only — remove Sales, Marketing, Design, etc.
  const techJobs = dedupedJobs.filter(isTechJob);
  console.log(`[Jobs] Total: ${allJobs.length}, Deduped: ${dedupedJobs.length}, Tech only: ${techJobs.length}`);

  // Escape a skill string for safe use inside a RegExp
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Word-boundary match so short/common skill tokens (e.g. "R", "Go", "C")
  // don't spuriously match inside unrelated words (e.g. "Recruiter", "Google", "Coordinate").
  const matchesSkill = (text: string, skill: string): boolean => {
    const pattern = new RegExp(`(?<![a-z0-9])${escapeRegExp(skill)}(?![a-z0-9])`, 'i');
    return pattern.test(text);
  };

  // Compute match scores
  //
  // The denominator used to be the sum of weights across the user's ENTIRE
  // skill inventory — so a user with 20 tracked skills could only ever hit a
  // high score on a job that happened to mention nearly all 20 of them,
  // which essentially never happens for any single real posting (a job
  // needs maybe 4-6 relevant skills, not someone's whole resume). That bug
  // is why defaulting the UI to a 70%+ filter showed zero jobs for
  // virtually every real user. Normalize instead against a realistic
  // "how much of a strong match looks like" expectation.
  const EXPECTED_MATCH_WEIGHT = 10; // roughly 5-6 substantial skills' worth
  const scoreJob = (job: RawJob, skills: string[]): { score: number, matched: string[] } => {
    if (skills.length === 0) return { score: 0, matched: [] };
    const jobText = job.title + ' ' + job.description + ' ' + job.tags.join(' ');

    let matchCount = 0;
    const matched: string[] = [];

    skills.forEach(skill => {
      const weight = skill.length > 4 ? 2 : 1; // longer/specific skills worth more
      if (matchesSkill(jobText, skill)) {
        matchCount += weight;
        matched.push(skill);
      }
    });

    if (matched.length === 0) return { score: 0, matched: [] };

    const rawScore = Math.round((matchCount / EXPECTED_MATCH_WEIGHT) * 100);
    // Boost for title match
    const titleBoost = skills.some(s => matchesSkill(job.title, s)) ? 10 : 0;
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

  const result = {
    jobs: paginatedJobs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: offset + limit < total,
    },
    debugSkillCount: userSkillsArray.length
  };
  await withFallback(() => redis.set(cacheKey, result, { ex: CACHE_TTL }), undefined);
  return NextResponse.json(result);
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
