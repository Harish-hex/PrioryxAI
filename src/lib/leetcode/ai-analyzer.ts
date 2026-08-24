import { openai } from '../openai';
import { FullLeetCodeData, UserStream, PriorityTopic, ProblemRecommendation } from './types';
import { fetchProblems } from './alfa-api';

export function computePlacementReadinessScore(data: FullLeetCodeData, _stream: UserStream): number {
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
    } catch (_e) {
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

export async function generateProblemRecommendations(
  stream: UserStream,
  priorityTopics: PriorityTopic[],
  targetCompanies: string[]
): Promise<ProblemRecommendation[]> {
  const recommendations: ProblemRecommendation[] = [];
  
  const highPriority = priorityTopics.filter(t => t.priority === 'CRITICAL' || t.priority === 'HIGH');
  
  for (const topic of highPriority) {
    // 1-3. Fetch candidate problems across difficulties
    const easyProbs = await fetchProblems([topic.topic], 'EASY', 5);
    const medProbs = await fetchProblems([topic.topic], 'MEDIUM', 8);
    const hardProbs = await fetchProblems([topic.topic], 'HARD', 3);
    
    const allCandidates = [...easyProbs, ...medProbs, ...hardProbs];
    if (allCandidates.length === 0) continue;

    // 4-5. Ask AI to select the best 5 problems overall
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

    const aiRes = JSON.parse(completion.choices[0].message.content || '{}');
    const selected = aiRes.selected || [];

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
  }

  return recommendations;
}
