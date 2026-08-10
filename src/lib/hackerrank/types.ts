export interface HackerRankRawData {
  platform: 'hackerrank';
  username: string;
  totalSolved: number;
  badges: string[];
  certifications: number;
  certificationLinks: string[];
  cached?: boolean;
}

export interface CodeChefData {
  platform: 'codechef';
  username: string;
  totalSolved: number;
  rating: number;
  maxRating: number;
  globalRank: number;
  countryRank: number;
  contestsParticipated: number;
  cached?: boolean;
}

export interface GFGData {
  platform: 'gfg';
  username: string;
  totalSolved: number;
  streak: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  maxRating?: number;
  cached?: boolean;
}

export interface CodeforcesData {
  platform: 'codeforces';
  username: string;
  totalSolved: number;
  rating: number;
  maxRating: number;
  contestsParticipated: number;
  questionsByType: Record<string, number>;
  cached?: boolean;
}

export interface CPSResponse {
  profiles: Array<HackerRankRawData | CodeChefData | GFGData | CodeforcesData>;
}

export interface MultiPlatformFetchResult {
  hackerrank: HackerRankRawData | null;
  codechef: CodeChefData | null;
  gfg: GFGData | null;
  codeforces: CodeforcesData | null;
  fetchedAt: string;
  errors: Record<string, string>;
}

export interface HRBadgeDomain {
  domain: string;
  stream_relevance: string[];
  skill_level: 'core' | 'language' | 'specialization' | 'framework';
  leetcode_topics: string[];
  hr_practice_url: string;
}

export interface HRAnalyzedProfile {
  raw: HackerRankRawData;
  badgeDomains: Array<HRBadgeDomain & { badgeName: string }>;
  missingBadges: string[];
  certificationScore: number;
  badgeScore: number;
  solvedScore: number;
  totalScore: number;
  streamAlignment: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
  priorityBadgesToEarn: string[];
}

export interface HRAIAnalysis {
  overallAssessment: string;
  strengthsFromBadges: string[];
  criticalMissingSkills: string[];
  certificationAdvice: string;
  hrPracticeRecommendations: Array<{
    domain: string;
    url: string;
    why: string;
    priority: 'IMMEDIATE' | 'SOON' | 'EVENTUALLY';
    estimatedTimeToComplete: string;
  }>;
  crossPlatformInsight: string;
  companySpecificAdvice: string;
  weeklyActionPlan: Array<{
    week: number;
    focus: string;
    hrGoal: string;
    lcGoal: string;
    milestone: string;
  }>;
  placementReadinessFromHR: number;
}

export interface HRPracticeRecommendation {
  domain: string;
  subdomain: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  hackerrankUrl: string;
  estimatedProblems: number;
  whyThisForStream: string;
  companyRelevance: string[];
}
