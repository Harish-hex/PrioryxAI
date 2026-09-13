import { openai } from '../openai';
import { HRAIAnalysis, HRAnalyzedProfile, HRPracticeRecommendation } from './types';
import { HACKERRANK_BADGE_DOMAIN_MAP, STREAM_EXPECTED_BADGES } from './cps-client';

export async function analyzeHackerRankWithAI(
  analyzed: HRAnalyzedProfile,
  stream: string,
  targetCompanies: string[],
  leetcodeScore?: number
): Promise<HRAIAnalysis> {
  const promptData = {
    badges: analyzed.raw.badges,
    streamRelevantBadges: analyzed.badgeDomains.map(b => b.badgeName),
    missingStreamBadges: analyzed.missingBadges,
    certificationsCount: analyzed.raw.certifications,
    hasVerifiedCerts: analyzed.raw.certificationLinks && analyzed.raw.certificationLinks.length > 0,
    totalSolved: analyzed.raw.totalSolved,
    targetCompanies,
    leetcodeScore,
    stream,
  };

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert career coach specializing in software placement preparation. Analyze the HackerRank profile data and produce actionable, stream-specific guidance using the EXACT JSON schema requested.`,
      },
      {
        role: 'user',
        content: `Analyze this HackerRank profile data:\n\n${JSON.stringify(promptData, null, 2)}\n\n
Return JSON with this EXACT schema:
{
  "overallAssessment": string,
  "strengthsFromBadges": string[],
  "criticalMissingSkills": string[],
  "certificationAdvice": string,
  "hrPracticeRecommendations": [
    {
      "domain": string,
      "url": string,
      "why": string,
      "priority": "IMMEDIATE" | "SOON" | "EVENTUALLY",
      "estimatedTimeToComplete": string
    }
  ],
  "crossPlatformInsight": string,
  "companySpecificAdvice": string,
  "weeklyActionPlan": [
    {
      "week": number,
      "focus": string,
      "hrGoal": string,
      "lcGoal": string,
      "milestone": string
    }
  ],
  "placementReadinessFromHR": number
}`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(completion.choices[0].message.content || '{}');
}

export async function generateHRPracticeProblems(
  stream: string,
  missingBadges: string[],
  earnedBadges: string[],
  targetCompanies: string[]
): Promise<HRPracticeRecommendation[]> {
  const recommendations: HRPracticeRecommendation[] = [];
  const streamBadges = STREAM_EXPECTED_BADGES[stream] || [];

  // 1. CRITICAL: Missing stream badges
  for (const badge of missingBadges) {
    if (streamBadges.includes(badge) && HACKERRANK_BADGE_DOMAIN_MAP[badge]) {
      const map = HACKERRANK_BADGE_DOMAIN_MAP[badge];
      recommendations.push({
        domain: map.domain,
        subdomain: badge,
        difficulty: 'Easy',
        priority: 'CRITICAL',
        hackerrankUrl: map.hr_practice_url,
        estimatedProblems: 30,
        whyThisForStream: `Critical requirement for the ${stream} stream.`,
        companyRelevance: targetCompanies,
      });
    }
  }

  // 2. HIGH: Earned badges to go deeper
  for (const badge of earnedBadges) {
    if (streamBadges.includes(badge) && HACKERRANK_BADGE_DOMAIN_MAP[badge]) {
      const map = HACKERRANK_BADGE_DOMAIN_MAP[badge];
      recommendations.push({
        domain: map.domain,
        subdomain: badge,
        difficulty: 'Medium',
        priority: 'HIGH',
        hackerrankUrl: map.hr_practice_url,
        estimatedProblems: 20,
        whyThisForStream: `Deepen your existing expertise in ${badge} for ${stream}.`,
        companyRelevance: targetCompanies,
      });
    }
  }

  // 3. MEDIUM: Missing non-critical badges
  const allDomainBadges = Object.keys(HACKERRANK_BADGE_DOMAIN_MAP);
  for (const badge of allDomainBadges) {
    if (!earnedBadges.includes(badge) && !streamBadges.includes(badge)) {
      const map = HACKERRANK_BADGE_DOMAIN_MAP[badge];
      if (map.stream_relevance.includes(stream)) {
         recommendations.push({
          domain: map.domain,
          subdomain: badge,
          difficulty: 'Medium',
          priority: 'MEDIUM',
          hackerrankUrl: map.hr_practice_url,
          estimatedProblems: 15,
          whyThisForStream: `Valuable complementary skill for ${stream}.`,
          companyRelevance: targetCompanies,
        });
      }
    }
  }

  return recommendations;
}
