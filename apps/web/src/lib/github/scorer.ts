// src/lib/github/scorer.ts — Pure project scoring logic (no API calls, no DB)
import type {
  CachedRepo, ProjectScore, ProjectWeakness,
  ScoreDimensions, WeaknessCategory, PriorityLevel, ImpactArea, EffortLevel
} from './types';
import type { RepoStructureSignals } from './repo-inspector';
import type { VulnerablePackage } from './security-scanner';

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

function computeDimensions(
  repo: CachedRepo,
  structure?: RepoStructureSignals | null,
  vulnerablePackages?: VulnerablePackage[]
): ScoreDimensions {
  const days = daysSince(repo.pushedAt);
  const hasDescription = !!(repo.description && repo.description.trim().length > 10);
  const descLen = repo.description?.length ?? 0;

  // Documentation: 0-20 — the short GitHub description is a weak proxy on
  // its own; when we can actually see the repo tree, weight the real
  // README file's presence/size instead of guessing from the blurb.
  const documentation = structure
    ? Math.min(20,
        (structure.hasReadme ? 8 : 0) +
        (structure.readmeSizeBytes > 1500 ? 6 : structure.readmeSizeBytes > 300 ? 3 : 0) +
        (repo.language ? 2 : 0) +
        (hasDescription ? 4 : 0)
      )
    : Math.min(20,
        (hasDescription ? 6 : 0) +
        (descLen > 60 ? 4 : 0) +
        (repo.language ? 2 : 0)
      );

  // Activity: 0-20
  const activity =
    days <= RECENT_PUSH_DAYS ? 20 :
    days <= MEDIUM_PUSH_DAYS ? 14 :
    days <= STALE_DAYS ? 8 : 2;

  // Code Quality: 0-20 — real structural signals (tests, CI, organized
  // folders) when available, falling back to the metadata-only proxy.
  const descWords = (repo.description ?? '').split(' ').length;
  // A known-vulnerable dependency knocks points off code quality — capped so
  // it can't single-handedly zero out an otherwise well-built project.
  const vulnPenalty = Math.min(8, (vulnerablePackages?.length ?? 0) * 4);

  const codeQuality = structure
    ? Math.max(0, Math.min(20,
        (structure.hasTests ? 7 : 0) +
        (structure.hasCI ? 5 : 0) +
        (structure.hasOrganizedStructure ? 5 : 0) +
        (repo.language ? 3 : 0)
      ) - vulnPenalty)
    : Math.max(0, Math.min(20,
        (hasDescription && descWords >= 5 ? 10 : 4) +
        (repo.language ? 6 : 0) +
        (repo.name && !repo.name.match(/^repo\d+|test|untitled/i) ? 4 : 0)
      ) - vulnPenalty);

  // Completeness: 0-20 — dependency manifest + deployment signals (Docker)
  // over the old star-count-only proxy, which said nothing about whether
  // the project actually runs.
  const stars = repo.stargazerCount ?? 0;
  const completeness = structure
    ? Math.min(20,
        (structure.hasDependencyManifest ? 8 : 0) +
        (structure.hasDockerfile ? 4 : 0) +
        Math.min(stars * 2, 6) +
        (hasDescription ? 2 : 0)
      )
    : Math.min(20,
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

function detectWeaknesses(
  repo: CachedRepo,
  dims: ScoreDimensions,
  structure?: RepoStructureSignals | null,
  vulnerablePackages?: VulnerablePackage[]
): ProjectWeakness[] {
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

  // ── Real repo-content signals — only checked when the file tree was
  // successfully fetched, so a fetch failure never produces a false gap. ──
  if (structure) {
    if (!structure.hasTests) {
      add(
        'no_tests',
        'No automated tests found',
        'No test files or test directory detected — recruiters and interviewers will ask about test coverage on any real project.',
        'Add a tests/ directory with at least a few unit tests covering core logic (pytest, Jest, or your stack\'s standard runner).',
        'half_day', 'HIGH',
        ['interview_talking_point', 'career_signal', 'learning_value'],
        180
      );
    }

    if (!structure.hasCI) {
      add(
        'no_ci_cd',
        'No CI/CD pipeline configured',
        'No GitHub Actions, GitLab CI, or CircleCI config found — nothing runs your tests or checks automatically on push.',
        'Add a .github/workflows/ci.yml that installs dependencies and runs your test suite on every push.',
        'quick_win', 'MEDIUM',
        ['interview_talking_point', 'career_signal'],
        45,
        'mkdir -p .github/workflows && echo "name: CI\\non: [push]\\njobs:\\n  test:\\n    runs-on: ubuntu-latest\\n    steps:\\n      - uses: actions/checkout@v4" > .github/workflows/ci.yml'
      );
    }

    if (structure.isNotebookHeavy) {
      add(
        'notebook_only',
        'Model/analysis lives only in notebooks',
        'This looks like an ML/data project implemented entirely in .ipynb notebooks with little to no modular source code — that reads as exploratory work, not a shippable project, to recruiters.',
        'Extract the core logic (data loading, model definition, training loop, inference) into proper .py modules with a clear entry point (train.py / predict.py). Keep the notebook only for exploration/visualization.',
        'full_day', 'HIGH',
        ['resume_impact', 'interview_talking_point', 'career_signal'],
        240
      );
    }

    if (structure.hasModelArtifacts && !structure.hasOrganizedStructure) {
      add(
        'unorganized_structure',
        'Model code lacks clear architecture separation',
        'Model/training files exist but aren\'t separated into a coherent structure (e.g. data/, models/, training/, inference/) — this makes it hard for an interviewer to see your design decisions at a glance.',
        'Reorganize into clear modules: data/ (loading & preprocessing), models/ (architecture definitions), train.py (training loop), inference.py (serving/prediction). This is exactly what interviewers look for when reviewing an ML repo.',
        'full_day', 'HIGH',
        ['interview_talking_point', 'career_signal', 'learning_value'],
        240
      );
    } else if (structure.fileCount >= 15 && !structure.hasOrganizedStructure) {
      add(
        'unorganized_structure',
        'Codebase has no folder architecture',
        `${structure.fileCount}+ files with no src/lib/app-style organization — this is a strong signal of a "everything in one place" project rather than a designed system.`,
        'Introduce a src/ (or equivalent) layout separating concerns: entry point, business logic, utilities, and tests each in their own folder.',
        'half_day', 'MEDIUM',
        ['interview_talking_point', 'career_signal'],
        150
      );
    }

    if (!structure.hasDependencyManifest && (repo.language === 'Python' || repo.language === 'JavaScript' || repo.language === 'TypeScript')) {
      add(
        'no_dependency_manifest',
        'No dependency manifest found',
        `No requirements.txt/pyproject.toml/package.json detected for a ${repo.language} project — nobody else (including a recruiter trying it locally) can install and run this.`,
        repo.language === 'Python'
          ? 'Run `pip freeze > requirements.txt` (or add a pyproject.toml) and commit it.'
          : 'Ensure package.json lists real dependencies and is committed at the repo root.',
        'quick_win', 'MEDIUM',
        ['recruiter_visibility', 'career_signal'],
        20
      );
    }
  }

  if (vulnerablePackages && vulnerablePackages.length > 0) {
    const names = vulnerablePackages.map(v => v.name).slice(0, 3).join(', ');
    add(
      'vulnerable_dependency',
      `${vulnerablePackages.length} dependenc${vulnerablePackages.length === 1 ? 'y has' : 'ies have'} known vulnerabilities`,
      `${names}${vulnerablePackages.length > 3 ? ', and others' : ''} — flagged by OSV.dev with known CVE/GHSA advisories.`,
      'Update the affected package(s) to a patched version and re-run your test suite.',
      'quick_win', 'HIGH',
      ['career_signal', 'interview_talking_point'],
      30
    );
  }

  return weaknesses;
}

function computeStrengths(repo: CachedRepo, dims: ScoreDimensions, structure?: RepoStructureSignals | null): string[] {
  const s: string[] = [];
  if (dims.activity >= 16) s.push('Actively maintained');
  if (dims.documentation >= 14) s.push('Well documented');
  const stars = repo.stargazerCount ?? 0;
  if (stars >= 5) s.push(`${stars} GitHub stars`);
  if (repo.language && ['TypeScript', 'Go', 'Rust'].includes(repo.language)) {
    s.push(`Modern language (${repo.language})`);
  }
  if (dims.careerValue >= 14) s.push('Strong career signal');
  if (structure?.hasTests) s.push('Has automated tests');
  if (structure?.hasCI) s.push('CI/CD pipeline configured');
  if (structure?.hasOrganizedStructure) s.push('Clean folder architecture');
  if (structure?.hasModelArtifacts && structure.hasOrganizedStructure) s.push('Well-structured model code');
  return s;
}

export function scoreProject(
  repo: CachedRepo,
  repoId = 0,
  structure?: RepoStructureSignals | null,
  vulnerablePackages?: VulnerablePackage[]
): ProjectScore {
  const dims = computeDimensions(repo, structure, vulnerablePackages);
  const total = Object.values(dims).reduce((a, b) => a + b, 0);
  const weaknesses = detectWeaknesses(repo, dims, structure, vulnerablePackages);
  const strengths = computeStrengths(repo, dims, structure);

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

export function scorePortfolio(repos: CachedRepo[], precomputed?: ProjectScore[]): number {
  if (repos.length === 0) return 0;
  // Reuse already-computed scores when available so structure-aware scoring
  // (tests/CI/architecture) isn't silently dropped by a redundant re-score.
  const scores = precomputed
    ? precomputed.map(p => p.totalScore)
    : repos.map(r => scoreProject(r).totalScore);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const diversityBonus = Math.min(10, repos.length * 2);
  return Math.min(100, Math.round(avg + diversityBonus));
}
