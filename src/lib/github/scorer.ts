// src/lib/github/scorer.ts — Pure project scoring logic (no API calls, no DB)
import type {
  CachedRepo, ProjectScore, ProjectWeakness,
  ScoreDimensions, WeaknessCategory, PriorityLevel, ImpactArea, EffortLevel
} from './types';

const STALE_DAYS = 90;
const RECENT_PUSH_DAYS = 30;
const MEDIUM_PUSH_DAYS = 60;

function daysSince(dateStr: string | null | undefined): number {
  if (!dateStr) return 9999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function gradeFromScore(score: number): ProjectScore['grade'] {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

function computeDimensions(repo: CachedRepo): ScoreDimensions {
  const days = daysSince(repo.pushedAt);
  const hasDescription = !!(repo.description && repo.description.trim().length > 10);
  const descLen = repo.description?.length ?? 0;

  // Documentation: 0-20
  const documentation = Math.min(20,
    (hasDescription ? 6 : 0) +
    (descLen > 60 ? 4 : 0) +
    (repo.language ? 2 : 0)
  );

  // Activity: 0-20
  const activity =
    days <= RECENT_PUSH_DAYS ? 20 :
    days <= MEDIUM_PUSH_DAYS ? 14 :
    days <= STALE_DAYS ? 8 : 2;

  // Code Quality proxy
  const descWords = (repo.description ?? '').split(' ').length;
  const codeQuality = Math.min(20,
    (hasDescription && descWords >= 5 ? 10 : 4) +
    (repo.language ? 6 : 0) +
    (repo.name && !repo.name.match(/^repo\d+|test|untitled/i) ? 4 : 0)
  );

  // Completeness — star count as proxy
  const stars = repo.stargazerCount ?? 0;
  const completeness = Math.min(20,
    stars * 2 + (hasDescription ? 6 : 0) + (repo.language ? 4 : 0)
  );

  // Career Value: 0-20
  const highValueLangs = ['TypeScript', 'Python', 'Go', 'Rust', 'Java', 'Kotlin'];
  const careerValue = Math.min(20,
    (hasDescription ? 6 : 0) +
    (repo.language && highValueLangs.includes(repo.language) ? 6 : repo.language ? 4 : 0) +
    (stars >= 5 ? 8 : stars >= 1 ? 4 : 0)
  );

  return { documentation, codeQuality, activity, completeness, careerValue };
}

function detectWeaknesses(repo: CachedRepo, dims: ScoreDimensions): ProjectWeakness[] {
  const weaknesses: ProjectWeakness[] = [];
  const days = daysSince(repo.pushedAt);

  function add(
    category: WeaknessCategory,
    title: string,
    description: string,
    fix: string,
    effort: EffortLevel,
    priority: PriorityLevel,
    impactAreas: ImpactArea[],
    estimatedMinutes: number,
    aiSuggestedCommands?: string
  ) {
    weaknesses.push({ category, title, description, fix, effort, priority, impactAreas, estimatedMinutes, aiSuggestedCommands });
  }

  if (!repo.description || repo.description.trim().length < 10) {
    add(
      'no_description',
      'Missing repository description',
      'No description set — recruiters and GitHub search skip undescribed repos.',
      'Go to the repo on GitHub → Settings → About → add a 1-sentence description.',
      'quick_win', 'HIGH',
      ['recruiter_visibility', 'career_signal'],
      10,
      '# On GitHub.com: repo → Settings (top-right gear) → About → Description'
    );
  }

  if (dims.documentation < 8) {
    add(
      'poor_readme',
      'README needs improvement',
      'README is missing or too short to explain the project.',
      'Add: What it does, tech stack, how to run locally, screenshots/demo link.',
      'half_day', 'HIGH',
      ['resume_impact', 'interview_talking_point', 'recruiter_visibility'],
      120,
      'echo "# Project\\n\\n## Overview\\n\\n## Tech Stack\\n\\n## Setup\\n\\n## Demo" > README.md && git add README.md && git commit -m "docs: add README" && git push'
    );
  }

  if (days >= STALE_DAYS) {
    add(
      'stale_code',
      `Repository not updated in ${days} days`,
      'Stale repos signal abandoned projects to recruiters.',
      'Make at least one meaningful commit: fix a bug, add a feature, or update docs.',
      'quick_win', 'MEDIUM',
      ['career_signal', 'recruiter_visibility'],
      30,
      'git add . && git commit --allow-empty -m "chore: maintenance update" && git push'
    );
  }

  if (!repo.language) {
    add(
      'single_language',
      'No primary language detected',
      'GitHub cannot detect the language — likely missing actual source files.',
      'Ensure the project has source code files committed, not just config/docs.',
      'quick_win', 'MEDIUM',
      ['resume_impact', 'learning_value'],
      30
    );
  }

  if (dims.completeness < 8) {
    add(
      'no_deployment',
      'No evidence of deployment',
      'Project appears to have no live URL, GitHub Pages, or deployment config.',
      'Deploy free on Vercel/Netlify and add the live URL to the repo description.',
      'half_day', 'HIGH',
      ['resume_impact', 'interview_talking_point', 'career_signal'],
      180,
      'npx vercel --yes  # Then add the URL to About section on GitHub'
    );
  }

  return weaknesses;
}

function computeStrengths(repo: CachedRepo, dims: ScoreDimensions): string[] {
  const s: string[] = [];
  if (dims.activity >= 16) s.push('Actively maintained');
  if (dims.documentation >= 14) s.push('Well documented');
  const stars = repo.stargazerCount ?? 0;
  if (stars >= 5) s.push(`${stars} GitHub stars`);
  if (repo.language && ['TypeScript', 'Go', 'Rust'].includes(repo.language)) {
    s.push(`Modern language (${repo.language})`);
  }
  if (dims.careerValue >= 14) s.push('Strong career signal');
  return s;
}

export function scoreProject(repo: CachedRepo, repoId = 0): ProjectScore {
  const dims = computeDimensions(repo);
  const total = Object.values(dims).reduce((a, b) => a + b, 0);
  const weaknesses = detectWeaknesses(repo, dims);
  const strengths = computeStrengths(repo, dims);

  const interviewTopics: string[] = [];
  if (repo.language) interviewTopics.push(repo.language);
  const desc = (repo.description ?? '').toLowerCase();
  if (desc.includes('api')) interviewTopics.push('REST API design');
  if (desc.includes('ml') || desc.includes('machine learning')) interviewTopics.push('Machine Learning');
  if (desc.includes('realtime') || desc.includes('websocket')) interviewTopics.push('Real-time systems');

  return {
    repoId,
    repoName: repo.name,
    repoUrl: repo.url ?? 'https://github.com',
    totalScore: total,
    grade: gradeFromScore(total),
    dimensions: dims,
    weaknesses,
    strengths,
    primaryLanguage: repo.language ?? null,
    careerRelevance: {
      resumeWorthy: total >= 60,
      interviewTopics,
      skillsShowcased: repo.language ? [repo.language] : [],
    },
    lastAnalysedAt: new Date().toISOString(),
  };
}

export function scorePortfolio(repos: CachedRepo[]): number {
  if (repos.length === 0) return 0;
  const scores = repos.map(r => scoreProject(r).totalScore);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const diversityBonus = Math.min(10, repos.length * 2);
  return Math.min(100, Math.round(avg + diversityBonus));
}
