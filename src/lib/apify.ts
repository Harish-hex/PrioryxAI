import { ApifyClient } from 'apify-client';
import { withFallback, redis } from '@/lib/redis';

const client = new ApifyClient({ token: process.env.APIFY_TOKEN! });

// Internshala actor ID on Apify
const INTERNSHALA_ACTOR_ID = 'dhrumil/internshala-scraper';
const CACHE_TTL = 6 * 60 * 60; // 6 hours — avoid hammering Apify quota

export interface InternshalaJob {
  id: string;          // Apify item ID for deduplication
  title: string;
  company: string;
  location: string;
  stipend: string | null;
  duration: string | null;
  applyBy: string | null;   // ISO date string if parseable
  url: string;
  isWFH: boolean;
  skills: string[];
}

export async function fetchInternshalaJobs(
  roles: string[],
  location: string = 'India'
): Promise<InternshalaJob[]> {
  const cacheKey = `internshala:${roles.sort().join(',')}:${location}`;

  // Check cache first
  const cached = await withFallback(() => redis.get<InternshalaJob[]>(cacheKey), null);
  if (cached) return cached;

  try {
    const run = await client.actor(INTERNSHALA_ACTOR_ID).call({
      searchKeywords: roles.join(' OR '),
      location,
      maxItems: 50,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    const jobs: InternshalaJob[] = (items as any[]).map((item: any) => ({
      id: item.id ?? item.internshipId ?? String(item.url),
      title: item.title ?? item.internshipName ?? 'Internship',
      company: item.company ?? item.companyName ?? 'Unknown',
      location: item.location ?? location,
      stipend: item.stipend ?? item.salary ?? null,
      duration: item.duration ?? null,
      applyBy: parseApplyBy(item.deadline ?? item.applyBy ?? null),
      url: item.url ?? item.internshipUrl ?? '',
      isWFH: Boolean(item.isWFH ?? item.workFromHome ?? false),
      skills: Array.isArray(item.skills) ? item.skills : [],
    }));

    // Cache for 6 hours
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
    // Try parsing "15 Apr '25" style
    const cleaned = raw.replace(/'/g, '20');
    const d2 = new Date(cleaned);
    if (!isNaN(d2.getTime())) return d2.toISOString();
  } catch {}
  return null;
}
