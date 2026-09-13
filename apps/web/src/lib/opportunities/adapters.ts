import { NormalizedOpportunity } from './types';

export interface OpportunityAdapterResult {
  sourceKey: string;
  fetchedAt: string;
  opportunities: NormalizedOpportunity[];
  errors: string[];
}

export interface OpportunitySourceAdapter {
  sourceKey: string;
  country: string | null;
  fetchForUser(input: {
    userId: string;
    country?: string | null;
    skills: string[];
    targetRoles: string[];
    targetCompanies: string[];
  }): Promise<OpportunityAdapterResult>;
}

const adapters = new Map<string, OpportunitySourceAdapter>();

export function registerOpportunityAdapter(adapter: OpportunitySourceAdapter) {
  adapters.set(adapter.sourceKey, adapter);
}

export function getOpportunityAdapter(sourceKey: string): OpportunitySourceAdapter | null {
  return adapters.get(sourceKey) ?? null;
}

export function listOpportunityAdapters(): Array<Pick<OpportunitySourceAdapter, 'sourceKey' | 'country'>> {
  return Array.from(adapters.values()).map((adapter) => ({
    sourceKey: adapter.sourceKey,
    country: adapter.country,
  }));
}
