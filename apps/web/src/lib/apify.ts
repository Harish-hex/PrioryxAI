import { ApifyClient } from 'apify-client';
import { withFallback, redis } from '@/lib/redis';

const client = new ApifyClient({ token: process.env.APIFY_TOKEN! });

// Maintained Internshala scraper — scrapes internshala.com/internships search
// Actor docs: https://apify.com/curious_coder/internshala-scraper
const INTERNSHALA_ACTOR_ID = 'curious_coder/internshala-scraper';
const CACHE_TTL = 6 * 60 * 60; // 6 hours

export interface InternshalaJob {
  id: string;
  title: string;
  company: string;
  location: string;
  stipend: string | null;
  duration: string | null;
  applyBy: string | null;
  url: string;
  isWFH: boolean;
  skills: string[];
}

export async function fetchInternshalaJobs(
  roles: string[],
  location: string = 'India'
): Promise<InternshalaJob[]> {
  if (!process.env.APIFY_TOKEN) return [];

  const cacheKey = `internshala:${roles.sort().join(',')}:${location}`;
  const cached = await withFallback(() => redis.get<InternshalaJob[]>(cacheKey), null);
  if (cached) return cached;

  try {
    // curious_coder/internshala-scraper accepts a list of search URLs
    // Build one URL per role to get targeted results
    const searchUrls = roles.slice(0, 3).map((role) => {
      const slug = role.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      return `https://internshala.com/internships/${slug}-internship`;
    });

    // Fallback: generic search URL if no slugs
    if (searchUrls.length === 0) {
      searchUrls.push('https://internshala.com/internships/computer-science-internship');
    }

    const run = await client.actor(INTERNSHALA_ACTOR_ID).call({
      startUrls: searchUrls.map((url) => ({ url })),
      maxItems: 60,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    const jobs: InternshalaJob[] = (items as any[])
      .filter((item: any) => item.title || item.internshipTitle || item.name)
      .map((item: any) => ({
        id: item.id ?? item.internshipId ?? item.uniqueId ?? String(item.url ?? Math.random()),
        title: (item.title ?? item.internshipTitle ?? item.name ?? 'Internship').slice(0, 200),
        company: (item.company ?? item.companyName ?? item.employer ?? 'Unknown').slice(0, 200),
        location: item.location ?? item.city ?? location,
        stipend: item.stipend ?? item.salary ?? item.stipendMin ?? null,
        duration: item.duration ?? null,
        applyBy: parseApplyBy(
          item.deadline ?? item.applyBy ?? item.lastDate ?? item.applicationDeadline ?? null
        ),
        url: item.url ?? item.internshipUrl ?? item.link ?? '',
        isWFH: Boolean(item.isWFH ?? item.workFromHome ?? item.remote ?? false),
        skills: Array.isArray(item.skills)
          ? item.skills
          : typeof item.skills === 'string'
            ? item.skills.split(',').map((s: string) => s.trim())
            : [],
      }));

    await withFallback(() => redis.set(cacheKey, jobs, { ex: CACHE_TTL }), undefined);
    return jobs;
  } catch (err) {
    console.error('[apify] Internshala fetch failed:', err);
    return [];
  }
}

function parseApplyBy(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d.toISOString();
    // "15 Apr '25" → "15 Apr 2025"
    const cleaned = raw.replace(/'(\d{2})/g, '20$1');
    const d2 = new Date(cleaned);
    if (!isNaN(d2.getTime())) return d2.toISOString();
  } catch {}
  return null;
}
