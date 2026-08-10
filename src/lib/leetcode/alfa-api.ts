import {
  LeetCodeProfile,
  SolvedStats,
  SkillStats,
  ContestInfo,
  ContestHistory,
  SubmissionCalendar,
  LanguageStats,
  LeetCodeProblem,
  FullLeetCodeData
} from './types';
import { getCache, setCache } from './cache';

const BASE_URL = process.env.ALFA_LEETCODE_API_URL || 'https://alfa-leetcode-api.onrender.com';

async function fetchWithRetry<T>(endpoint: string, cacheKey: string): Promise<T | null> {
  // 1. Check cache
  const cached = await getCache<T>(cacheKey);
  if (cached) return cached;

  // 2. Fetch with 1 retry
  let res = await fetch(`${BASE_URL}${endpoint}`, { next: { revalidate: 3600 } });
  if (!res.ok) {
    // Retry once after 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    res = await fetch(`${BASE_URL}${endpoint}`, { next: { revalidate: 3600 } });
    if (!res.ok) {
      console.error(`[alfa-api] Failed to fetch ${endpoint}: ${res.status}`);
      return null;
    }
  }

  const data = await res.json();
  
  // Basic validation to check if API returned an error payload
  if (data && (data.errors || data.error)) {
     console.error(`[alfa-api] API returned error for ${endpoint}:`, data);
     return null;
  }

  // 3. Cache result
  await setCache(cacheKey, data, 3600);
  return data as T;
}

export async function fetchProfile(username: string): Promise<LeetCodeProfile | null> {
  return fetchWithRetry<LeetCodeProfile>(`/${username}`, `leetcode:${username}:profile`);
}

export async function fetchSolved(username: string): Promise<SolvedStats | null> {
  return fetchWithRetry<SolvedStats>(`/${username}/solved`, `leetcode:${username}:solved`);
}

export async function fetchSkillStats(username: string): Promise<SkillStats | null> {
  return fetchWithRetry<SkillStats>(`/${username}/skill`, `leetcode:${username}:skill`);
}

export async function fetchContestInfo(username: string): Promise<ContestInfo | null> {
  return fetchWithRetry<ContestInfo>(`/${username}/contest`, `leetcode:${username}:contest`);
}

export async function fetchContestHistory(username: string): Promise<ContestHistory[] | null> {
  const data = await fetchWithRetry<any>(`/${username}/contest/history`, `leetcode:${username}:contestHistory`);
  return data?.contestHistory ?? null;
}

export async function fetchCalendar(username: string): Promise<SubmissionCalendar | null> {
  return fetchWithRetry<SubmissionCalendar>(`/${username}/calendar`, `leetcode:${username}:calendar`);
}

export async function fetchLanguageStats(username: string): Promise<LanguageStats | null> {
  return fetchWithRetry<LanguageStats>(`/${username}/language`, `leetcode:${username}:language`);
}

export async function fetchBadges(username: string): Promise<unknown | null> {
  return fetchWithRetry<unknown>(`/${username}/badges`, `leetcode:${username}:badges`);
}

export async function fetchProblems(tags: string[], difficulty?: string, limit: number = 20): Promise<LeetCodeProblem[]> {
  const query = new URLSearchParams();
  if (tags.length > 0) query.set('tags', tags.join('+'));
  // Note: For Alfa API, difficulty might need to be appended or handled differently, but let's assume it accepts difficulty param as per spec.
  // Actually alfa api might not have this exact param, but we will pass it anyway.
  const res = await fetch(`${BASE_URL}/problems?limit=${limit}&${query.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  
  let problems = (data.problemsetQuestionList || []) as LeetCodeProblem[];
  if (difficulty) {
    problems = problems.filter(p => p.difficulty === difficulty);
  }
  return problems.slice(0, limit);
}

export async function fetchDailyProblem(): Promise<LeetCodeProblem | null> {
  return fetchWithRetry<LeetCodeProblem>(`/daily`, `leetcode:daily`);
}

export async function fetchProblemBySlug(slug: string): Promise<LeetCodeProblem | null> {
  return fetchWithRetry<LeetCodeProblem>(`/select?titleSlug=${slug}`, `leetcode:problem:${slug}`);
}

export async function fetchFullLeetCodeProfile(username: string): Promise<FullLeetCodeData> {
  const [
    profileResult,
    solvedResult,
    skillStatsResult,
    contestInfoResult,
    contestHistoryResult,
    calendarResult,
    languageStatsResult,
    badgesResult
  ] = await Promise.allSettled([
    fetchProfile(username),
    fetchSolved(username),
    fetchSkillStats(username),
    fetchContestInfo(username),
    fetchContestHistory(username),
    fetchCalendar(username),
    fetchLanguageStats(username),
    fetchBadges(username)
  ]);

  return {
    profile: profileResult.status === 'fulfilled' ? profileResult.value : null,
    solved: solvedResult.status === 'fulfilled' ? solvedResult.value : null,
    skillStats: skillStatsResult.status === 'fulfilled' ? skillStatsResult.value : null,
    contestInfo: contestInfoResult.status === 'fulfilled' ? contestInfoResult.value : null,
    contestHistory: contestHistoryResult.status === 'fulfilled' ? contestHistoryResult.value : null,
    calendar: calendarResult.status === 'fulfilled' ? calendarResult.value : null,
    languageStats: languageStatsResult.status === 'fulfilled' ? languageStatsResult.value : null,
    badges: badgesResult.status === 'fulfilled' ? badgesResult.value : null,
  };
}
