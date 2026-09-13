import crypto from 'crypto';
import { NormalizedOpportunity } from './types';

const SKILL_KEYWORDS = [
  'javascript', 'typescript', 'react', 'next.js', 'node.js', 'python', 'java',
  'spring', 'sql', 'postgresql', 'mysql', 'mongodb', 'docker', 'kubernetes',
  'aws', 'gcp', 'azure', 'machine learning', 'data science', 'pandas',
  'tensorflow', 'pytorch', 'html', 'css', 'tailwind', 'graphql', 'rest api',
  'git', 'linux', 'c++', 'c#', 'go', 'rust', 'swift', 'kotlin', 'android', 'ios',
];

function compact(value: unknown, max = 5000): string | null {
  const text = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  return text ? text.slice(0, max) : null;
}

function inferSkills(text: string | null): string[] {
  const lower = (text ?? '').toLowerCase();
  return SKILL_KEYWORDS.filter((skill) => lower.includes(skill));
}

function hashOpportunity(value: NormalizedOpportunity): string {
  return crypto
    .createHash('sha256')
    .update(`${value.sourceKey}:${value.externalId}:${value.title}:${value.company}:${value.applicationUrl}`)
    .digest('hex');
}

export function contentHash(value: NormalizedOpportunity): string {
  return hashOpportunity(value);
}

export function normalizeJobOpportunity(raw: Record<string, unknown>, sourceKey: string): NormalizedOpportunity {
  const title = compact(raw.title, 300) ?? 'Untitled opportunity';
  const company = compact(raw.company ?? raw.company_name, 200);
  const description = compact(raw.description ?? raw.jd_text, 5000);
  const tags = Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === 'string') : [];
  const matched = Array.isArray(raw.matchedSkills) ? raw.matchedSkills.filter((t): t is string => typeof t === 'string') : [];
  const inferred = inferSkills(`${title} ${description ?? ''} ${tags.join(' ')}`);
  const requiredSkills = Array.from(new Set([...matched, ...tags, ...inferred].map((s) => s.toLowerCase().trim()).filter(Boolean))).slice(0, 30);
  const url = compact(raw.url ?? raw.jdUrl ?? raw.application_url, 1000) ?? '';

  return {
    sourceKey,
    externalId: String(raw.id ?? raw.slug ?? hashOpportunity({
      sourceKey,
      externalId: title,
      title,
      company,
      location: null,
      remotePolicy: null,
      country: null,
      deadline: null,
      salaryMin: null,
      salaryMax: null,
      stipend: null,
      currency: null,
      eligibility: null,
      requiredSkills: [],
      preferredSkills: [],
      description,
      applicationUrl: url,
      freshnessAt: new Date().toISOString(),
    })),
    title,
    company,
    location: compact(raw.location, 200),
    remotePolicy: String(raw.location ?? '').toLowerCase().includes('remote') ? 'remote' : null,
    country: typeof raw.country === 'string' ? raw.country : null,
    deadline: typeof raw.deadline === 'string' ? raw.deadline : null,
    salaryMin: typeof raw.salaryMin === 'number' ? raw.salaryMin : null,
    salaryMax: typeof raw.salaryMax === 'number' ? raw.salaryMax : null,
    stipend: compact(raw.stipend ?? raw.salary, 200),
    currency: typeof raw.currency === 'string' ? raw.currency : null,
    eligibility: compact(raw.eligibility, 1000),
    requiredSkills,
    preferredSkills: [],
    description,
    applicationUrl: url,
    freshnessAt: typeof raw.postedAt === 'string' && raw.postedAt ? raw.postedAt : new Date().toISOString(),
    rawPayload: raw,
  };
}
