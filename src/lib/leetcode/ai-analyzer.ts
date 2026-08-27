import { openai } from '../openai';
import { FullLeetCodeData, UserStream, PriorityTopic, ProblemRecommendation } from './types';
import { fetchProblems } from './alfa-api';

const STREAM_TOPIC_MAP: Record<UserStream, string[]> = {
  'SDE': ['arrays', 'strings', 'dynamic-programming', 'trees', 'graphs', 'binary-search', 'two-pointers', 'sliding-window', 'backtracking', 'heap-priority-queue', 'linked-list', 'stack', 'hash-table'],
  'ML_AI': ['math', 'dynamic-programming', 'matrix', 'probability-and-statistics', 'arrays', 'sorting', 'binary-search', 'hash-table', 'recursion'],
  'DATA_SCIENCE': ['database', 'math', 'sorting', 'arrays', 'hash-table', 'string', 'dynamic-programming', 'greedy'],
  'FRONTEND': ['arrays', 'strings', 'hash-table', 'design', 'recursion', 'tree', 'breadth-first-search', 'depth-first-search'],
  'BACKEND': ['arrays', 'strings', 'database', 'design', 'graphs', 'dynamic-programming', 'binary-search', 'heap-priority-queue'],
  'FULLSTACK': ['arrays', 'strings', 'hash-table', 'trees', 'database', 'design', 'dynamic-programming', 'binary-search'],
  'COMPETITIVE': ['dynamic-programming', 'graphs', 'math', 'trees', 'binary-search', 'segment-tree', 'bit-manipulation', 'combinatorics', 'backtracking', 'greedy'],
  'CS_GENERAL': ['arrays', 'strings', 'hash-table', 'trees', 'graphs', 'dynamic-programming', 'binary-search', 'sorting', 'two-pointers']
};

const COMPANY_TAGS: Record<string, string[]> = {
  'Google': ['arrays', 'dynamic-programming', 'graphs', 'trees', 'strings'],
  'Meta': ['arrays', 'strings', 'trees', 'dynamic-programming', 'binary-search'],
  'Amazon': ['arrays', 'strings', 'trees', 'graphs', 'dynamic-programming'],
  'Microsoft': ['arrays', 'strings', 'trees', 'dynamic-programming'],
  'Apple': ['arrays', 'strings', 'trees', 'dynamic-programming'],
  'Netflix': ['design', 'arrays', 'hash-table', 'dynamic-programming'],
  'Stripe': ['arrays', 'strings', 'dynamic-programming', 'design'],
  'Uber': ['graphs', 'arrays', 'dynamic-programming', 'math'],
  'Flipkart': ['arrays', 'dynamic-programming', 'trees', 'strings'],
  'Swiggy': ['arrays', 'dynamic-programming', 'graphs', 'hash-table'],
  'Zomato': ['arrays', 'dynamic-programming', 'hash-table', 'strings'],
  'Atlassian': ['arrays', 'strings', 'dynamic-programming', 'trees'],
  'Adobe': ['arrays', 'strings', 'dynamic-programming', 'math'],
};

export function computePlacementReadinessScore(data: FullLeetCodeData, stream: UserStream): number {
  if (!data.solved) return 0;
  
  const { easySolved, mediumSolved, hardSolved, solvedProblem: totalSolved } = data.solved;

  // 1. Solved Volume (25pts)
  const volEasy = Math.min(easySolved / 50, 1) * 8;
  const volMedium = Math.min(mediumSolved / 150, 1) * 12;
  const volHard = Math.min(hardSolved / 50, 1) * 5;
  const volumeScore = volEasy + volMedium + volHard;

  // 2. Quality Ratio (25pts)
  const qualityRatio = (mediumSolved + hardSolved * 2) / Math.max(totalSolved, 1);
  const qualityScore = Math.min(qualityRatio * 10, 25);

  // 3. Contest (25pts)
  let contestScore = 0;
  if (data.contestInfo?.contestRating) {
    const rating = data.contestInfo.contestRating;
    if (rating >= 2100) contestScore = 25;
    else if (rating >= 1800) contestScore = 16;
    else if (rating >= 1500) contestScore = 8;
  }

  // 4. Consistency (25pts)
  let consistencyScore = 0;
  if (data.calendar?.submissionCalendar) {
    try {
      const parsed = JSON.parse(data.calendar.submissionCalendar);
      const activeDays = Object.keys(parsed).length;
      consistencyScore = Math.min(activeDays / 200, 1) * 15;
    } catch (e) {
      // JSON parse error
    }
  }
  
  let totalSubs = 0;
  if (data.solved.totalSubmissionNum) {
    const allSubs = data.solved.totalSubmissionNum.find(x => x.difficulty === 'All');
    if (allSubs) totalSubs = allSubs.submissions;
  }
  consistencyScore += Math.min(totalSubs / 500, 1) * 10;

  return Math.round(volumeScore + qualityScore + contestScore + consistencyScore);
}

export async function analyzeProfile(data: FullLeetCodeData, stream: UserStream, targetCompanies: string[]) {
  const promptData = {
    username: data.profile?.username,
    ranking: data.profile?.ranking,
    solved: data.solved,
    contest: data.contestInfo,
    skills: data.skillStats?.data?.matchedUser?.tagProblemCounts,
    languages: data.languageStats?.matchedUser?.languageProblemCount,
    stream,
    targetCompanies
  };

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert software engineering career coach and competitive programming mentor. 
Analyze the given LeetCode profile data and produce a structured assessment using the EXACT JSON schema requested.
Ensure priority_topics covers topics relevant to the user's stream.`
      },
      {
        role: "user",
        content: `Analyze this LeetCode profile:\n\n${JSON.stringify(promptData, null, 2)}\n\n
Return JSON with this schema:
{
  "overall_score": number,
  "score_breakdown": {
    "volume": number,
    "quality": number,
    "consistency": number,
    "breadth": number
  },
  "placement_readiness": "NOT_READY" | "EARLY_STAGE" | "DEVELOPING" | "NEARLY_READY" | "READY" | "EXCEPTIONAL",
  "strengths": string[],
  "critical_gaps": string[],
  "priority_topics": [
    {
      "topic": string,
      "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "current_level": "NONE" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
      "target_level": "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
      "reason": string,
      "stream_relevance": string
    }
  ],
  "contest_assessment": {
    "rating_tier": string,
    "contest_advice": string,
    "recommended_contests": string[]
  },
  "language_assessment": {
    "primary_language": string,
    "is_optimal_for_stream": boolean,
    "language_advice": string
  },
  "12_week_roadmap": [
    {
      "week": number,
      "focus": string,
      "daily_target": number,
      "topics": string[],
      "milestone": string
    }
  ],
  "personalized_feedback": string,
  "estimated_ready_in_weeks": number | null
}`
      }
    ],
    response_format: { type: "json_object" }
  });

  return JSON.parse(completion.choices[0].message.content || '{}');
}

// Common mismatches between AI-generated topic names and LeetCode's actual
// tag slugs (singular/plural, spacing) — the AI is free-text, LeetCode's tag
// API is not, and a mismatch here silently produced zero problem candidates.
const TOPIC_SLUG_ALIASES: Record<string, string> = {
  arrays: 'array',
  strings: 'string',
  trees: 'tree',
  graphs: 'graph',
  'linked-lists': 'linked-list',
  stacks: 'stack',
  queues: 'queue',
  heaps: 'heap-priority-queue',
  'heap-priority-queues': 'heap-priority-queue',
  'priority-queue': 'heap-priority-queue',
  'priority-queues': 'heap-priority-queue',
  'hash-tables': 'hash-table',
  'hash-maps': 'hash-table',
  hashmap: 'hash-table',
  hashmaps: 'hash-table',
  'two-pointer': 'two-pointers',
  recursions: 'recursion',
  'bit-manipulations': 'bit-manipulation',
  'dp': 'dynamic-programming',
};

function slugifyTopic(topic: string): string {
  const slug = topic
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
  return TOPIC_SLUG_ALIASES[slug] ?? slug;
}

/**
 * Curates a study list for a single topic: fetches a pool of candidate
 * problems for the topic, then asks the model to pick the best 5 spanning
 * difficulties. Isolated per-topic so the caller can run many of these
 * concurrently instead of paying each topic's fetch + completion latency
 * serially (that sequential loop was the main reason study-plan generation
 * timed out in production).
 */
async function generateRecommendationsForTopic(
  topic: PriorityTopic,
  stream: UserStream,
  targetCompanies: string[]
): Promise<ProblemRecommendation[]> {
  const slug = slugifyTopic(topic.topic);

  // One request for a broad pool (mixed difficulties) rather than three
  // separate easy/medium/hard requests — cuts external API calls by 3x,
  // which matters because this free, shared API rate-limits aggressively
  // under concurrency (6 topics × 3 calls = 18 simultaneous requests was
  // enough to get every one of them rejected).
  let allCandidates = await fetchProblems([slug], undefined, 40);

  // The AI's topic name may not correspond to any real LeetCode tag slug at
  // all — fall back to an unfiltered pool rather than giving up on the topic.
  if (allCandidates.length === 0) {
    allCandidates = await fetchProblems([], undefined, 40);
  }
  if (allCandidates.length === 0) return [];

  // 4-5. Ask AI to select the best 5 problems overall
  let aiRes: any = {};
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert algorithm mentor curating study lists."
        },
        {
          role: "user",
          content: `Topic: ${topic.topic}\nStream: ${stream}\nTarget Companies: ${targetCompanies.join(', ')}\n
Candidates:\n${JSON.stringify(allCandidates.map(p => ({ title: p.title, slug: p.titleSlug, diff: p.difficulty })), null, 2)}

Select exactly 5 problems that build up knowledge well. Return JSON:
{
  "selected": [
    {
      "problem_slug": string,
      "why_this_problem": "1-sentence explanation of why it's good for their stream",
      "company_tags": ["Company1", "Company2"] // estimate tags if possible
    }
  ]
}`
        }
      ],
      response_format: { type: "json_object" }
    });
    aiRes = JSON.parse(completion.choices[0].message.content || '{}');
  } catch (e) {
    // If the model call fails/times out for this one topic, fall back to a
    // deterministic pick (first 5 candidates, easy-to-hard) rather than
    // dropping the whole topic — a partial plan beats none.
    console.error(`[generateRecommendationsForTopic] AI selection failed for "${topic.topic}", using fallback:`, e);
    aiRes = {
      selected: allCandidates.slice(0, 5).map(p => ({
        problem_slug: p.titleSlug,
        why_this_problem: `Builds core ${topic.topic} skills relevant to ${stream}.`,
        company_tags: [],
      })),
    };
  }

  const selected = aiRes.selected || [];
  const recommendations: ProblemRecommendation[] = [];

  for (const s of selected) {
    const prob = allCandidates.find(p => p.titleSlug === s.problem_slug);
    if (prob) {
      recommendations.push({
        stream,
        priority: topic.priority,
        topic: topic.topic,
        problem_slug: prob.titleSlug,
        problem_title: prob.title,
        difficulty: prob.difficulty,
        why_this_problem: s.why_this_problem,
        company_tags: s.company_tags || []
      });
    }
  }

  return recommendations;
}

const PRIORITY_RANK: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export async function generateProblemRecommendations(
  stream: UserStream,
  priorityTopics: PriorityTopic[],
  targetCompanies: string[]
): Promise<ProblemRecommendation[]> {
  // Rank ALL topics by priority rather than filtering to CRITICAL/HIGH only —
  // a solid profile can legitimately have nothing but MEDIUM/LOW gaps, and
  // filtering them out entirely produced a silent empty plan with no error.
  // Cap topic count so total latency/cost stays bounded even if the AI
  // analysis flags many topics — the rest still surface via a regenerate.
  const topTopics = [...priorityTopics]
    .sort((a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9))
    .slice(0, 6);

  const results = await Promise.allSettled(
    topTopics.map(topic => generateRecommendationsForTopic(topic, stream, targetCompanies))
  );

  return results.flatMap(r => (r.status === 'fulfilled' ? r.value : []));
}
