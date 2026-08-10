// Research Agent — LeetCode, HackerRank profile analysis + problem recommendations
import type {
  AgentModule,
  ToolResult,
  LeetCodeStats,
  HackerRankStats,
  ProblemRecommendation,
} from '../types';
import { createClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';

// ─── LeetCode GraphQL queries ───

const LC_PROFILE_QUERY = `
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    submitStats: submitStatsGlobal {
      acSubmissionNum { difficulty count }
    }
    profile { ranking reputation }
  }
}`;

const LC_CONTEST_QUERY = `
query userContestRankingInfo($username: String!) {
  userContestRanking(username: $username) {
    rating
    globalRanking
    attendedContestsCount
  }
}`;

const LC_RECENT_QUERY = `
query recentSubmissions($username: String!, $limit: Int!) {
  recentAcSubmissionList(username: $username, limit: $limit) {
    title
    titleSlug
    timestamp
  }
}`;

async function fetchLeetCodeProfile(
  input: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  const username = input.username as string;
  if (!username) return { success: false, data: null, error: 'Username required' };

  try {
    // Fetch profile stats
    const profileRes = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: LC_PROFILE_QUERY, variables: { username } }),
    });

    const profileData = await profileRes.json() as Record<string, unknown>;
    const matchedUser = (profileData as { data?: { matchedUser?: Record<string, unknown> } })
      .data?.matchedUser;

    if (!matchedUser) {
      return { success: false, data: null, error: `LeetCode user '${username}' not found` };
    }

    // Fetch contest rating
    const contestRes = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: LC_CONTEST_QUERY, variables: { username } }),
    });
    const contestData = await contestRes.json() as Record<string, unknown>;

    // Fetch recent submissions
    const recentRes = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: LC_RECENT_QUERY, variables: { username, limit: 20 } }),
    });
    const recentData = await recentRes.json() as Record<string, unknown>;

    const submitStats = (matchedUser as { submitStats?: { acSubmissionNum?: Array<{ difficulty: string; count: number }> } })
      .submitStats?.acSubmissionNum ?? [];
    const profile = matchedUser.profile as { ranking?: number } | undefined;
    const contestRanking = (contestData as { data?: { userContestRanking?: { rating?: number; attendedContestsCount?: number } } })
      .data?.userContestRanking;
    const recentSubmissions = (recentData as { data?: { recentAcSubmissionList?: Array<{ title: string; titleSlug: string; timestamp: string }> } })
      .data?.recentAcSubmissionList ?? [];

    const easySolved = submitStats.find((s) => s.difficulty === 'Easy')?.count ?? 0;
    const mediumSolved = submitStats.find((s) => s.difficulty === 'Medium')?.count ?? 0;
    const hardSolved = submitStats.find((s) => s.difficulty === 'Hard')?.count ?? 0;

    const stats: LeetCodeStats = {
      totalSolved: easySolved + mediumSolved + hardSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      acceptanceRate: 0,
      ranking: profile?.ranking ?? 0,
      contestRating: contestRanking?.rating ?? 0,
      contestsAttended: contestRanking?.attendedContestsCount ?? 0,
      topicBreakdown: {},
      recentSubmissions: recentSubmissions.map((s) => ({
        title: s.title,
        difficulty: '',
        timestamp: Number(s.timestamp),
      })),
    };

    // Store in Supabase
    const supabase = createClient();
    await supabase.from('coding_profiles').upsert({
      user_id: userId,
      leetcode_username: username,
      leetcode_stats: stats as unknown as Record<string, unknown>,
      last_synced: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    await supabase.from('users').update({ coding_connected: true }).eq('id', userId);

    return { success: true, data: { stats } };
  } catch (err) {
    return { success: false, data: null, error: `LeetCode fetch failed: ${(err as Error).message}` };
  }
}

async function fetchHackerRankProfile(
  input: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  const username = input.username as string;
  if (!username) return { success: false, data: null, error: 'Username required' };

  try {
    const response = await fetch(
      `https://www.hackerrank.com/rest/hackers/${encodeURIComponent(username)}/scores_elo`,
      { headers: { Accept: 'application/json' } }
    );

    if (!response.ok) {
      return { success: false, data: null, error: `HackerRank user '${username}' not found` };
    }

    const data = await response.json() as Record<string, unknown>[];

    const skills: Record<string, number> = {};
    let totalScore = 0;
    for (const item of data) {
      const name = String(item.name ?? '');
      const score = Number(item.score ?? 0);
      if (name) {
        skills[name] = score;
        totalScore += score;
      }
    }

    const stats: HackerRankStats = {
      username,
      totalScore,
      badges: [],
      skills,
    };

    const supabase = createClient();
    await supabase.from('coding_profiles').upsert({
      user_id: userId,
      hackerrank_username: username,
      hackerrank_stats: stats as unknown as Record<string, unknown>,
      last_synced: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    return { success: true, data: { stats } };
  } catch (err) {
    return { success: false, data: null, error: `HackerRank fetch failed: ${(err as Error).message}` };
  }
}

async function analyzeContestHistory(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const lcStats = input.lcStats as LeetCodeStats | undefined;
  if (!lcStats) return { success: true, data: { analysis: 'No contest data available' } };

  const trend = lcStats.contestRating > 1600 ? 'strong' :
    lcStats.contestRating > 1400 ? 'competitive' : 'developing';

  return {
    success: true,
    data: {
      rating: lcStats.contestRating,
      contests: lcStats.contestsAttended,
      trend,
      analysis: `Rating ${lcStats.contestRating} after ${lcStats.contestsAttended} contests. Performance: ${trend}.`,
    },
  };
}

async function identifyCodingWeakTopics(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const lcStats = input.lcStats as LeetCodeStats | undefined;
  const targetRoles = (input.targetRoles as string[]) ?? ['Software Engineer'];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Analyze a student's coding profile and identify weak topics they need to improve for their target roles. Return JSON: { weakTopics: [{ topic: string, currentLevel: "beginner"|"intermediate"|"advanced", requiredLevel: string, priority: "critical"|"high"|"medium", reason: string }] }`,
      },
      {
        role: 'user',
        content: `LeetCode stats: Easy=${lcStats?.easySolved ?? 0}, Medium=${lcStats?.mediumSolved ?? 0}, Hard=${lcStats?.hardSolved ?? 0}, Rating=${lcStats?.contestRating ?? 0}\nTopics solved: ${JSON.stringify(lcStats?.topicBreakdown ?? {})}\nTarget roles: ${targetRoles.join(', ')}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1000,
  });

  const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  return { success: true, data: result };
}

async function recommendProblems(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const weakTopics = input.weakTopics as string[];
  const targetCompanies = (input.targetCompanies as string[]) ?? [];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Recommend LeetCode problems for weak topics. Return JSON: { recommendations: [{ problemId: string, title: string, difficulty: "easy"|"medium"|"hard", topic: string, platform: "leetcode", companyTags: string[], whyRecommended: string, url: string }] }. For each weak topic, recommend 5 Easy + 5 Medium + 3 Hard problems. Use real LeetCode problem names.`,
      },
      {
        role: 'user',
        content: `Weak topics: ${weakTopics.join(', ')}\nTarget companies: ${targetCompanies.join(', ')}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 3000,
  });

  const result = JSON.parse(completion.choices[0]?.message?.content ?? '{ "recommendations": [] }');
  return { success: true, data: result };
}

async function generateStudyPlan(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const weakTopics = input.weakTopics as string[];
  const timeline = (input.timeline as string) ?? '30 days';
  const targetCompanies = (input.targetCompanies as string[]) ?? [];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Create a structured coding study plan. Return JSON: { plan: { totalDays: number, dailyHours: number, weeks: [{ weekNumber: number, focus: string, problems: [{ day: number, topic: string, problemTitle: string, difficulty: string, estimatedMinutes: number }] }] } }`,
      },
      {
        role: 'user',
        content: `Weak topics: ${weakTopics.join(', ')}\nTimeline: ${timeline}\nTarget companies: ${targetCompanies.join(', ')}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 2000,
  });

  const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  return { success: true, data: result };
}

async function trackProblemSolvingProgress(
  _input: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  const supabase = createClient();
  const { data: problems } = await supabase
    .from('problem_progress')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  const total = problems?.length ?? 0;
  const completed = problems?.filter((p) => p.completed).length ?? 0;

  return {
    success: true,
    data: { total, completed, completionRate: total > 0 ? Math.round((completed / total) * 100) : 0, problems: problems ?? [] },
  };
}

async function computePlacementReadinessScore(
  input: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  const lcStats = input.lcStats as LeetCodeStats | undefined;
  const hrStats = input.hrStats as HackerRankStats | undefined;

  // Weighted scoring: problems (40%), contest (20%), topic breadth (25%), streak (15%)
  let problemScore = 0;
  if (lcStats) {
    const total = lcStats.totalSolved;
    problemScore = Math.min(total / 3, 40); // 120+ problems = max 40 points
  }

  let contestScore = 0;
  if (lcStats?.contestRating) {
    contestScore = Math.min(lcStats.contestRating / 100, 20); // 2000+ rating = max 20
  }

  let breadthScore = 0;
  const topicCount = Object.keys(lcStats?.topicBreakdown ?? {}).length;
  breadthScore = Math.min((topicCount / 10) * 25, 25); // 10+ topics = max 25

  let streakScore = 0;
  if (lcStats?.recentSubmissions && lcStats.recentSubmissions.length > 10) {
    streakScore = 15;
  } else if (lcStats?.recentSubmissions && lcStats.recentSubmissions.length > 5) {
    streakScore = 10;
  }

  const totalScore = Math.round(problemScore + contestScore + breadthScore + streakScore);
  const clampedScore = Math.min(totalScore, 100);

  // Update in database
  const supabase = createClient();
  await supabase
    .from('coding_profiles')
    .update({ placement_readiness_score: clampedScore })
    .eq('user_id', userId);

  return {
    success: true,
    data: {
      score: clampedScore,
      breakdown: { problemScore, contestScore, breadthScore, streakScore },
    },
  };
}

export const researchAgent: AgentModule = {
  name: 'Research Agent',
  prefix: 'research',
  tools: [
    { name: 'fetchLeetCodeProfile', description: 'Fetch LeetCode profile via GraphQL API', inputSchema: { type: 'object', properties: { username: { type: 'string' } }, required: ['username'] }, handler: fetchLeetCodeProfile },
    { name: 'fetchHackerRankProfile', description: 'Fetch HackerRank profile via REST API', inputSchema: { type: 'object', properties: { username: { type: 'string' } }, required: ['username'] }, handler: fetchHackerRankProfile },
    { name: 'analyzeContestHistory', description: 'Analyze contest performance trends', inputSchema: { type: 'object', properties: { lcStats: { type: 'object' } } }, handler: analyzeContestHistory },
    { name: 'identifyCodingWeakTopics', description: 'Identify weak coding topics via AI analysis', inputSchema: { type: 'object', properties: { lcStats: { type: 'object' }, targetRoles: { type: 'array' } } }, handler: identifyCodingWeakTopics },
    { name: 'recommendProblems', description: 'Generate prioritized problem recommendations for weak topics', inputSchema: { type: 'object', properties: { weakTopics: { type: 'array' }, targetCompanies: { type: 'array' } } }, handler: recommendProblems },
    { name: 'generateStudyPlan', description: 'Create a structured coding study plan', inputSchema: { type: 'object', properties: { weakTopics: { type: 'array' }, timeline: { type: 'string' }, targetCompanies: { type: 'array' } } }, handler: generateStudyPlan },
    { name: 'trackProblemSolvingProgress', description: 'Track problem-solving progress', inputSchema: {}, handler: trackProblemSolvingProgress },
    { name: 'computePlacementReadinessScore', description: 'Compute weighted placement readiness score (0-100)', inputSchema: { type: 'object', properties: { lcStats: { type: 'object' }, hrStats: { type: 'object' } } }, handler: computePlacementReadinessScore },
  ],
};
