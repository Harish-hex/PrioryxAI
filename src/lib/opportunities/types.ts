export interface NormalizedOpportunity {
  sourceKey: string;
  externalId: string;
  title: string;
  company: string | null;
  location: string | null;
  remotePolicy: string | null;
  country: string | null;
  deadline: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  stipend: string | null;
  currency: string | null;
  eligibility: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  description: string | null;
  applicationUrl: string;
  freshnessAt: string;
  rawPayload?: Record<string, unknown>;
}

export interface OpportunityMatchResult {
  opportunity: NormalizedOpportunity;
  score: number;
  strongMatches: string[];
  missingSkills: string[];
  relevantProjects: Array<{ id: string | null; title: string; matchedSkills: string[] }>;
  roleAlignment: 'none' | 'low' | 'medium' | 'high';
  reasons: string[];
  recommendedActions: string[];
}
