// Daily Growth Picks — three skill-gap-targeted recommendations shown on the
// priority dashboard alongside GitHub/code analysis: a YouTube video, a
// GitHub repo to study, and a college subject/course to revisit. Refreshed
// once per day (cached until midnight IST) so it reads as a daily digest,
// not something that reshuffles on every page load.
import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { withFallback, redis, midnightISTttl } from '@/lib/redis';
import { extractUserSignals } from '@/lib/youtube/signal-extractor';
import { searchYouTubeVideos } from '@/lib/youtube/fetcher';
import type { TopicSignal } from '@/lib/youtube/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface GitHubResourcePick {
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  stars: number;
  language: string | null;
}

interface DailyGrowthPicks {
  topic: string;
  reason: string;
  video: {
    videoId: string;
    title: string;
    channelName: string;
    thumbnail: string;
    duration: string;
  } | null;
  githubRepo: GitHubResourcePick | null;
  courseSuggestion: {
    type: 'college_subject' | 'general';
    title: string;
    detail: string;
  } | null;
  generatedAt: string;
}

/** Picks the single most urgent skill-gap signal to build today's digest around. */
function pickTopSignal(signals: TopicSignal[]): TopicSignal | null {
  if (signals.length === 0) return null;
  const rank: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return [...signals].sort((a, b) => (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9))[0];
}

/** Finds a well-regarded GitHub repo to study for a given skill topic. */
async function fetchGitHubResource(topic: string): Promise<GitHubResourcePick | null> {
  const controller = new AbortController();
  // 3s, not 8s — a slow/aborted search just means no repo pick (handled
  // gracefully below), so there's no reason to make the whole request wait
  // that long for an optional part of the digest.
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const q = encodeURIComponent(`${topic} in:name,description,readme stars:>500`);
    const res = await fetch(`https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=1`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const repo = data.items?.[0];
    if (!repo) return null;
    return {
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description ?? null,
      url: repo.html_url,
      stars: repo.stargazers_count ?? 0,
      language: repo.language ?? null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Cross-references the skill gap against the student's own tracked college
 * subjects — if one is plausibly related, nudge them back to coursework they
 * already have rather than inventing an external course that may not exist.
 */
function matchCollegeSubject(topic: string, subjects: string[]): { title: string; detail: string } | null {
  const topicLower = topic.toLowerCase();
  const SUBJECT_KEYWORD_MAP: Record<string, string[]> = {
    'data structures': ['dynamic programming', 'graphs', 'trees', 'recursion', 'arrays', 'linked list', 'stack', 'queue'],
    'algorithms': ['dynamic programming', 'graphs', 'sorting', 'searching', 'greedy', 'backtracking'],
    'dbms': ['sql', 'database', 'normalization', 'transactions'],
    'operating systems': ['os', 'process', 'threading', 'concurrency', 'memory management'],
    'computer networks': ['networking', 'tcp', 'http', 'protocols'],
    'object oriented programming': ['oop', 'design patterns', 'java', 'c++'],
    'machine learning': ['ml', 'machine learning', 'model', 'neural network', 'pytorch', 'tensorflow'],
    'software engineering': ['system design', 'design patterns', 'architecture'],
  };

  for (const subject of subjects) {
    const subjectLower = subject.toLowerCase();
    const keywords = SUBJECT_KEYWORD_MAP[subjectLower] ?? [];
    if (subjectLower.includes(topicLower) || topicLower.includes(subjectLower) || keywords.some(k => topicLower.includes(k))) {
      return {
        title: `Revisit ${subject}`,
        detail: `Your coursework in ${subject} directly covers ${topic} — review your notes before diving into new material.`,
      };
    }
  }
  return null;
}

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cacheKey = `daily_growth:${user.id}`;
  const cached = await withFallback(() => redis.get<DailyGrowthPicks>(cacheKey), null);
  if (cached) return NextResponse.json(cached);

  const db = createServiceClient();
  const [{ data: profile }, signals] = await Promise.all([
    db.from('users').select('subjects').eq('id', user.id).maybeSingle(),
    extractUserSignals(user.id).catch(() => [] as TopicSignal[]),
  ]);

  const topSignal = pickTopSignal(signals);

  if (!topSignal) {
    const empty: DailyGrowthPicks = {
      topic: '',
      reason: 'Connect GitHub, LeetCode, or upload your resume to unlock daily growth picks.',
      video: null,
      githubRepo: null,
      courseSuggestion: null,
      generatedAt: new Date().toISOString(),
    };
    await withFallback(() => redis.set(cacheKey, empty, { ex: midnightISTttl() }), undefined);
    return NextResponse.json(empty);
  }

  const [videos, githubRepo] = await Promise.all([
    searchYouTubeVideos(topSignal, 1).catch(() => []),
    fetchGitHubResource(topSignal.topic),
  ]);

  const subjects: string[] = profile?.subjects ?? [];
  const courseMatch = matchCollegeSubject(topSignal.topic, subjects);

  const result: DailyGrowthPicks = {
    topic: topSignal.topic,
    reason: topSignal.reason,
    video: videos[0]
      ? {
          videoId: videos[0].videoId,
          title: videos[0].title,
          channelName: videos[0].channelName,
          thumbnail: videos[0].thumbnail,
          duration: videos[0].duration,
        }
      : null,
    githubRepo,
    courseSuggestion: courseMatch
      ? { type: 'college_subject', ...courseMatch }
      : {
          type: 'general',
          title: `Study: ${topSignal.topic}`,
          detail: `No matching subject found in your tracked coursework — add "${topSignal.topic}"-related subjects in Settings so this can point back to your own classes.`,
        },
    generatedAt: new Date().toISOString(),
  };

  await withFallback(() => redis.set(cacheKey, result, { ex: midnightISTttl() }), undefined);
  return NextResponse.json(result);
}
