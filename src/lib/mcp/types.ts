// MCP Agent Architecture — Shared type definitions
// All agents, tools, and SSE events use these types

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (input: Record<string, unknown>, userId: string) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  data: Record<string, unknown> | null;
  error?: string;
}

export interface SSEEvent {
  event: 'tool_start' | 'tool_result' | 'tool_error' | 'progress' | 'done';
  data: Record<string, unknown>;
}

export interface AgentModule {
  name: string;
  prefix: string;
  tools: ToolDefinition[];
}

// ─── Skill & SWOT Types ───

export interface SkillEntity {
  name: string;
  category: string; // e.g. "language", "framework", "database", "devops", "soft_skill"
  proficiency: number; // 0-100
  evidence: string; // where it was found in the resume
}

export interface SWOTAnalysis {
  strengths: SWOTItem[];
  weaknesses: SWOTItem[];
  opportunities: SWOTItem[];
  threats: SWOTItem[];
}

export interface SWOTItem {
  title: string;
  description: string;
  relatedSkills: string[];
  priority: 'high' | 'medium' | 'low';
}

// ─── Project & Phase Types ───

export type ProjectDifficulty = 'foundation' | 'intermediate' | 'advanced';

export interface ProjectPhase {
  number: number;
  name: string; // Conceptualize, Design, Build, Test, Deploy, Review
  status: 'locked' | 'active' | 'submitted' | 'passed' | 'failed';
  instructions: string;
  deliverable: string;
  score: number;
}

export interface GeneratedProject {
  title: string;
  description: string;
  techStack: string[];
  skillGapsAddressed: string[];
  difficulty: ProjectDifficulty;
  estimatedHours: number;
  phases: ProjectPhase[];
  successCriteria: string[];
}

// ─── Coding Profile Types ───

export interface LeetCodeStats {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  acceptanceRate: number;
  ranking: number;
  contestRating: number;
  contestsAttended: number;
  topicBreakdown: Record<string, number>;
  recentSubmissions: LeetCodeSubmission[];
}

export interface LeetCodeSubmission {
  title: string;
  difficulty: string;
  timestamp: number;
}

export interface HackerRankStats {
  username: string;
  totalScore: number;
  badges: HackerRankBadge[];
  skills: Record<string, number>;
}

export interface HackerRankBadge {
  name: string;
  stars: number;
}

export interface ProblemRecommendation {
  problemId: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  platform: 'leetcode' | 'hackerrank';
  companyTags: string[];
  whyRecommended: string;
  url: string;
}

// ─── Job Market Types ───

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  url: string;
  requiredSkills: string[];
  matchScore: number;
  postedAt: string;
  description?: string;
}

export interface JobMatchResult {
  job: JobListing;
  matchedSkills: string[];
  missingSkills: string[];
  matchScore: number;
  readiness: 'ready' | 'almost' | 'gap';
}

// ─── Collaboration Types ───

export interface PeerMatch {
  userId: string;
  name: string;
  avatar: string;
  matchScore: number;
  commonSkills: string[];
  complementarySkills: string[];
  whyMatch: string;
  placementScore: number;
}

// ─── Orchestration Types ───

export interface CareerAnalysisResult {
  resumeAnalysis: {
    skills: SkillEntity[];
    swot: SWOTAnalysis;
    atsScore: number;
  } | null;
  codingProfile: {
    leetcode: LeetCodeStats | null;
    hackerrank: HackerRankStats | null;
    placementReadiness: number;
    weakTopics: string[];
  } | null;
  projects: GeneratedProject[];
  jobMatches: JobMatchResult[];
  roadmap: string;
}
