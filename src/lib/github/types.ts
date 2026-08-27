// src/lib/github/types.ts — GitHub Intelligence shared types

export type WeaknessCategory =
  | 'no_readme'
  | 'poor_readme'
  | 'no_description'
  | 'no_topics'
  | 'no_license'
  | 'stale_code'
  | 'no_tests'
  | 'single_language'
  | 'no_ci_cd'
  | 'low_commit_quality'
  | 'low_commit_frequency'
  | 'tiny_project'
  | 'no_deployment'
  | 'forked_only'
  | 'notebook_only'
  | 'no_dependency_manifest'
  | 'unorganized_structure';

export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ImpactArea =
  | 'resume_impact'
  | 'interview_talking_point'
  | 'career_signal'
  | 'recruiter_visibility'
  | 'learning_value';
export type EffortLevel = 'quick_win' | 'half_day' | 'full_day' | 'multi_day';

export interface ProjectWeakness {
  category: WeaknessCategory;
  title: string;
  description: string;
  fix: string;
  effort: EffortLevel;
  priority: PriorityLevel;
  impactAreas: ImpactArea[];
  estimatedMinutes: number;
  aiSuggestedCommands?: string;
}

export interface ScoreDimensions {
  documentation: number;  // 0-20
  codeQuality: number;    // 0-20
  activity: number;       // 0-20
  completeness: number;   // 0-20
  careerValue: number;    // 0-20
}

export interface ProjectScore {
  repoId: number;
  repoName: string;
  repoUrl: string;
  totalScore: number;   // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  dimensions: ScoreDimensions;
  weaknesses: ProjectWeakness[];
  strengths: string[];
  primaryLanguage: string | null;
  careerRelevance: {
    resumeWorthy: boolean;
    interviewTopics: string[];
    skillsShowcased: string[];
  };
  lastAnalysedAt: string;
}

export interface PriorityAction {
  id: string;
  userId: string;
  repoName: string;
  repoUrl: string;
  actionTitle: string;
  actionDescription: string;
  weakness: WeaknessCategory;
  priority: PriorityLevel;
  effort: EffortLevel;
  estimatedMinutes: number;
  impactAreas: ImpactArea[];
  impactScore: number;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  aiSuggestedCommands?: string;
}

export interface CommitPatterns {
  totalCommitsLast90Days: number;
  averageCommitsPerWeek: number;
  longestStreak: number;
  currentStreak: number;
  consistencyScore: number;
}

export interface GitHubIntelligenceReport {
  userId: string;
  username: string;
  totalRepos: number;
  portfolioScore: number;
  profileStrengths: string[];
  profileWeaknesses: string[];
  topProjects: ProjectScore[];
  weakestProjects: ProjectScore[];
  priorityActions: PriorityAction[];
  careerReadiness: {
    resumeReadyProjects: string[];
    languageDiversity: string[];
    estimatedProfileStrength: 'weak' | 'developing' | 'solid' | 'strong' | 'exceptional';
  };
  commitPatterns: CommitPatterns;
  generatedAt: string;
}

export interface CachedRepo {
  name: string;
  description: string | null;
  url: string | null;
  language: string | null;
  stargazerCount?: number | null;
  pushedAt?: string | null;
}
