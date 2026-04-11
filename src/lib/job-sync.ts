import { fetchInternshalaJobs } from "@/lib/apify";
import { redis, withFallback } from "@/lib/redis";
import { createServiceClient } from "@/lib/supabase/server";

const JOB_SYNC_TTL = 6 * 60 * 60;

function normalizeRole(value: string): string | null {
  const lowered = value.trim().toLowerCase();
  if (!lowered) return null;

  if (["typescript", "javascript", "react", "next", "frontend"].some((token) => lowered.includes(token))) {
    return "frontend developer";
  }
  if (["node", "express", "backend", "api", "java", "spring"].some((token) => lowered.includes(token))) {
    return "backend developer";
  }
  if (["python", "machine learning", "ai", "data", "analytics"].some((token) => lowered.includes(token))) {
    return "python developer";
  }
  if (["c++", "compiler", "operating system", "systems"].some((token) => lowered.includes(token))) {
    return "software developer";
  }

  return lowered;
}

export function deriveJobRoles(subjects: string[] = [], languages?: Record<string, number> | null): string[] {
  const subjectRoles = subjects.map(normalizeRole).filter(Boolean) as string[];
  const languageRoles = Object.keys(languages ?? {})
    .map(normalizeRole)
    .filter(Boolean) as string[];

  return Array.from(
    new Set([...subjectRoles, ...languageRoles, "software developer", "web developer", "data science"])
  ).slice(0, 4);
}

export async function syncInternshalaJobsForUser(options: {
  userId: string;
  subjects?: string[] | null;
  college?: string | null;
  languages?: Record<string, number> | null;
  force?: boolean;
}) {
  const { userId, subjects = [], college = null, languages = null, force = false } = options;

  if (!process.env.APIFY_TOKEN) {
    return { inserted: 0, total_fetched: 0, skipped: "missing_apify_token" as const };
  }

  const syncMarkerKey = `jobs:lastsync:${userId}`;
  if (!force) {
    const recentlySynced = await withFallback(() => redis.get<string>(syncMarkerKey), null);
    if (recentlySynced) {
      return { inserted: 0, total_fetched: 0, skipped: "recently_synced" as const };
    }
  }

  const jobs = await fetchInternshalaJobs(deriveJobRoles(subjects ?? [], languages), college ?? "India");
  await withFallback(() => redis.set(syncMarkerKey, "1", { ex: JOB_SYNC_TTL }), undefined);

  if (jobs.length === 0) {
    return { inserted: 0, total_fetched: 0, skipped: "no_jobs" as const };
  }

  const supabase = createServiceClient();
  const rows = jobs.map((job) => ({
    user_id: userId,
    type: "job",
    title: `${job.title} @ ${job.company}`,
    subject: job.skills.slice(0, 3).join(", ") || null,
    due_at: job.applyBy ?? null,
    weightage: null,
    source: "github",
    completed: false,
    stage: "saved",
    apify_id: job.id,
    external_url: job.url,
    stipend: job.stipend,
  }));

  // Conflict on (user_id, apify_id) — per-user deduplication.
  // A global apify_id unique constraint was dropped in migration v3;
  // the same Internshala listing can now be stored for each user independently.
  const { data, error } = await supabase
    .from("tasks")
    .upsert(rows, { onConflict: "user_id,apify_id", ignoreDuplicates: true })
    .select("id");

  if (error) {
    throw error;
  }

  await withFallback(() => redis.del(`feed:${userId}`), 0);
  return { inserted: data?.length ?? 0, total_fetched: jobs.length, skipped: null };
}
