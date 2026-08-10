export type UserStream = 'SDE' | 'ML_AI' | 'DATA_SCIENCE' | 'FRONTEND' | 'BACKEND' | 'FULLSTACK' | 'COMPETITIVE' | 'CS_GENERAL';

export interface LeetCodeProfile {
  username: string;
  name: string;
  avatar: string;
  ranking: number;
  reputation: number;
  gitHub: string;
  twitter: string;
  linkedIN: string;
  website: string[];
  country: string;
  company: string;
  school: string;
  starRating: number;
  about: string;
  skillTags: string[];
}

export interface SolvedStats {
  solvedProblem: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalSubmissionNum: Array<{
    difficulty: string; count: number; submissions: number
  }>;
  acSubmissionNum: Array<{
    difficulty: string; count: number; submissions: number
  }>;
}

export interface SkillStats {
  data: {
    matchedUser: {
      tagProblemCounts: {
        advanced: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
        intermediate: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
        fundamental: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
      }
    }
  }
}

export interface ContestInfo {
  contestAttend: number;
  contestRating: number;
  contestGlobalRanking: number;
  totalParticipants: number;
  contestTopPercentage: number;
  contestBadges: unknown;
}

export interface ContestHistory {
  attended: boolean;
  trendDirection: string;
  problemsSolved: number;
  totalProblems: number;
  finishTimeInSeconds: number;
  rating: number;
  ranking: number;
  contest: { title: string; startTime: number };
}

export interface SubmissionCalendar {
  submissionCalendar: string; // The API returns a stringified JSON object
}

export interface LanguageStats {
  matchedUser: {
    languageProblemCount: Array<{ languageName: string; problemsSolved: number }>;
  }
}

export interface LeetCodeProblem {
  title: string;
  titleSlug: string;
  difficulty: string;
  topicTags: Array<{ name: string; slug: string }>;
  acRate: number;
  status: string | null;
  frontendQuestionId: string;
}

export interface FullLeetCodeData {
  profile: LeetCodeProfile | null;
  solved: SolvedStats | null;
  skillStats: SkillStats | null;
  contestInfo: ContestInfo | null;
  contestHistory: ContestHistory[] | null;
  calendar: SubmissionCalendar | null;
  languageStats: LanguageStats | null;
  badges: unknown | null;
}

export interface PriorityTopic {
  topic: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  current_level: 'NONE' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  target_level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  reason: string;
  stream_relevance: string;
}

export interface ProblemRecommendation {
  stream: UserStream;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  topic: string;
  problem_slug: string;
  problem_title: string;
  difficulty: string;
  why_this_problem: string;
  company_tags: string[];
  completed?: boolean;
}
