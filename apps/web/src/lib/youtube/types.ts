export type VideoCategory =
  | 'dsa_problem'        // LeetCode topic, algorithm, data structure
  | 'tech_stack'         // framework/library the user uses or needs
  | 'language'           // programming language tutorial/deep dive
  | 'system_design'      // system design for interviews
  | 'trending_tech'      // currently trending tools/frameworks
  | 'career_growth'      // resume, interview, placement advice
  | 'project_tutorial'   // tutorial matching user's active project
  | 'certification_prep'; // prep for HackerRank certs or similar

export type VideoSource =
  | 'skill_gap'          // from SWOT/resume analysis
  | 'leetcode_weak'      // from LeetCode weak topics
  | 'hackerrank_missing' // from missing HackerRank badges
  | 'project_phase'      // from active Foundry project tech stack
  | 'trending'           // from AI trend detection
  | 'company_prep';       // from target company tech stack

export interface YouTubeVideo {
  videoId: string;
  title: string;
  channelName: string;
  channelId: string;
  thumbnail: string;        // mqdefault URL
  duration: string;         // e.g. "15:32"
  viewCount: number;
  publishedAt: string;
  description: string;
  tags: string[];
}

export interface RecommendedVideo {
  id: string;               // UUID, PK in Supabase
  userId: string;
  video: YouTubeVideo;
  category: VideoCategory;
  source: VideoSource;
  relevanceTopic: string;   // e.g. "Dynamic Programming", "React", "System Design"
  whyRecommended: string;   // AI-generated 1-sentence reason
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedLearningMinutes: number;
  watched: boolean;
  watchedAt?: string;
  savedForLater: boolean;
  dismissed: boolean;
  createdAt: string;
}

export interface TopicSignal {
  topic: string;
  source: VideoSource;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  searchQuery: string;      // optimised YouTube search string
  category: VideoCategory;
  reason: string;           // why this topic matters for this user
}

export interface RecommendationBatch {
  userId: string;
  signals: TopicSignal[];
  generatedAt: string;
  expiresAt: string;        // 24hrs from generation
}
