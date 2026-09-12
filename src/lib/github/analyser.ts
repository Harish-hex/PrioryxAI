// src/lib/github/analyser.ts — Orchestrates scoring + GPT-4o + Supabase writes
import { createServiceClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';
import { scoreProject, scorePortfolio } from './scorer';
import { inspectRepoStructure, fetchFileContent, type RepoStructureSignals } from './repo-inspector';
import { scanDependenciesForVulnerabilities, type VulnerablePackage } from './security-scanner';
import type { CachedRepo, GitHubIntelligenceReport, PriorityAction, ProjectScore } from './types';
import { v4 as uuidv4 } from 'uuid';

// Bounds how many repos get a real file-tree inspection (2 REST calls each)
// per analysis run. Matches github-sync.ts's own `first: 20` GraphQL cap, so
// every repo we ever actually sync gets real structural signals — anything
// beyond that falls back to metadata-only scoring, which produces repetitive
// generic weaknesses (e.g. "no README"/"no deployment" on every repo) since
// it can't see the actual file tree.
const MAX_STRUCTURE_INSPECTIONS = 20;

function impactScore(weakness: { priority: string; impactAreas: string[] }): number {
  const base =
    weakness.priority === 'CRITICAL' ? 90 :
    weakness.priority === 'HIGH' ? 70 :
    weakness.priority === 'MEDIUM' ? 50 : 30;
  return base + weakness.impactAreas.length * 2;
}

export async function runGitHubIntelligence(
  userId: string,
  onProgress?: (msg: string) => void
): Promise<GitHubIntelligenceReport> {
  const emit = (msg: string) => { onProgress?.(msg); };
  const supabase = createServiceClient();

  emit('Reading GitHub cache...');
  const { data: cache } = await supabase
    .from('github_cache')
    .select('repos, languages, streak_days, contribution_days, synced_at')
    .eq('user_id', userId)
    .single();

  const { data: user } = await supabase
    .from('users')
    .select('name, github_username, stream')
    .eq('id', userId)
    .single();

  const repos: CachedRepo[] = (cache?.repos as CachedRepo[]) ?? [];
  if (repos.length === 0) {
    // Distinguish "sync never populated the cache" from a genuine zero-repo
    // portfolio, so the caller doesn't save this as a valid zero-score report.
    throw new Error('GITHUB_CACHE_EMPTY');
  }
  emit('Inspecting repository structure (tests, CI, architecture)...');
  const inspectionCount = Math.min(repos.length, MAX_STRUCTURE_INSPECTIONS);
  const structureResults = await Promise.allSettled(
    repos.slice(0, inspectionCount).map(r => inspectRepoStructure(r.url))
  );
  const structures: Array<RepoStructureSignals | null> = structureResults.map(r =>
    r.status === 'fulfilled' ? r.value : null
  );

  emit('Scanning dependencies for known vulnerabilities...');
  const vulnResults = await Promise.allSettled(
    structures.map(async (s, i) => {
      if (!s?.hasDependencyManifest || !s.dependencyManifestPath) return [];
      const content = await fetchFileContent(repos[i].url, s.dependencyManifestPath);
      if (!content) return [];
      return scanDependenciesForVulnerabilities(s.dependencyManifestPath, content);
    })
  );
  const vulnerablePackagesByRepo: Array<VulnerablePackage[]> = vulnResults.map(r =>
    r.status === 'fulfilled' ? r.value : []
  );

  emit(`Scoring ${repos.length} repositories...`);

  const scored: ProjectScore[] = repos.map((repo, i) =>
    scoreProject(repo, i, structures[i] ?? null, vulnerablePackagesByRepo[i] ?? [])
  );
  const portfolioScore = scorePortfolio(repos, scored);

  // Build all priority actions across all repos
  const allActions: PriorityAction[] = [];
  for (const ps of scored) {
    for (const weakness of ps.weaknesses) {
      allActions.push({
        id: uuidv4(),
        userId,
        repoName: ps.repoName,
        repoUrl: ps.repoUrl,
        actionTitle: weakness.title,
        actionDescription: weakness.description,
        weakness: weakness.category,
        priority: weakness.priority,
        effort: weakness.effort,
        estimatedMinutes: weakness.estimatedMinutes,
        impactAreas: weakness.impactAreas,
        impactScore: impactScore(weakness),
        completed: false,
        createdAt: new Date().toISOString(),
        aiSuggestedCommands: weakness.aiSuggestedCommands,
      });
    }
  }

  // Sort by impact score descending
  allActions.sort((a, b) => b.impactScore - a.impactScore);

  const allProjects = [...scored].sort((a, b) => b.totalScore - a.totalScore);
  const topProjects = allProjects.slice(0, 5);
  const weakestProjects = [...scored].sort((a, b) => a.totalScore - b.totalScore).slice(0, 3);
  const resumeReadyProjects = scored.filter(p => p.careerRelevance.resumeWorthy).map(p => p.repoName);

  // Derive language diversity from repos
  const langs = Array.from(new Set(
    repos.map(r => r.language).filter((l): l is string => l !== null && l !== undefined)
  ));

  // Contribution pattern from cache
  const days = ((cache?.contribution_days as Array<{ date: string; count: number }>) ?? []);
  const last90 = days.filter(d => {
    const diff = (Date.now() - new Date(d.date).getTime()) / 86_400_000;
    return diff <= 90;
  });
  const totalCommits = last90.reduce((s, d) => s + d.count, 0);
  const avgPerWeek = Math.round(totalCommits / 13);
  const streak = (cache?.streak_days as number) ?? 0;
  const consistencyScore = Math.min(100, streak * 3 + avgPerWeek * 5);

  const profileStrength: GitHubIntelligenceReport['careerReadiness']['estimatedProfileStrength'] =
    portfolioScore >= 80 ? 'exceptional' :
    portfolioScore >= 65 ? 'strong' :
    portfolioScore >= 50 ? 'solid' :
    portfolioScore >= 35 ? 'developing' : 'weak';

  // GPT-4o portfolio narrative
  let profileStrengths: string[] = [];
  let profileWeaknesses: string[] = [];

  if (repos.length > 0 && process.env.OPENAI_API_KEY) {
    emit('Generating AI portfolio narrative...');
    try {
      // Real structural signals (tests/CI/architecture/notebook-vs-production)
      // where we managed to inspect the repo, not just its one-line
      // description — grounds the narrative in actual repo content instead
      // of guessing from metadata alone.
      const repoSummaries = repos.slice(0, 8).map((r, i) => {
        const s = structures[i];
        const structureNote = s
          ? ` [structure: ${[
              s.hasTests ? 'has tests' : 'no tests',
              s.hasCI ? 'has CI' : 'no CI',
              s.hasOrganizedStructure ? 'organized folders' : 'flat/unorganized',
              s.isNotebookHeavy ? 'notebook-only (no production code)' : null,
              s.hasModelArtifacts ? 'contains model/training code' : null,
              s.hasDependencyManifest ? 'has dependency manifest' : 'missing dependency manifest',
            ].filter(Boolean).join(', ')}]`
          : '';
        return `${r.name} (${r.language ?? 'unknown lang'}): ${r.description ?? 'no description'}${structureNote}`;
      }).join('\n');

      // Read actual source code (not just file names) for a handful of the
      // strongest-scoring repos, so the critique can point at real
      // architecture problems (e.g. no separation between data loading,
      // model definition, and training loop) instead of guessing from
      // structure flags alone.
      const codeExcerptTargets = scored
        .map((ps, i) => ({ ps, i }))
        .sort((a, b) => b.ps.totalScore - a.ps.totalScore)
        .filter(({ i }) => structures[i]?.keySourceFilePath)
        .slice(0, 3);

      const codeExcerptResults = await Promise.allSettled(
        codeExcerptTargets.map(({ i }) =>
          fetchFileContent(repos[i].url, structures[i]!.keySourceFilePath!)
        )
      );

      const codeExcerpts = codeExcerptTargets
        .map(({ ps, i }, idx) => {
          const content = codeExcerptResults[idx].status === 'fulfilled' ? codeExcerptResults[idx].value : null;
          if (!content) return null;
          return `--- ${ps.repoName} :: ${structures[i]!.keySourceFilePath} ---\n${content}`;
        })
        .filter(Boolean)
        .join('\n\n');

      const stream = (user as { stream?: string } | null)?.stream ?? 'software engineering';

      const narrative = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 700,
        messages: [{
          role: 'user',
          content: `Analyze this student's GitHub portfolio for a ${stream} career. Where a repo has a [structure: ...] tag, that reflects its ACTUAL file tree (tests, CI, folder organization, whether it's a notebook-only ML project vs a properly structured one) — prioritize those real signals over the description text, and call out specific architecture/code-organization gaps (e.g. "model training code has no separation between data loading, model definition, and training loop", "no test coverage on the core logic", "ML work is notebook-only, never productionized") rather than generic README/documentation feedback.${
            codeExcerpts
              ? `\n\nBelow are real source-code excerpts from this student's highest-scoring repos. Use them to give SPECIFIC, code-grounded architecture feedback (e.g. name an actual missing abstraction, a hardcoded value that should be config, a training loop that doesn't checkpoint, missing validation split) — not generic advice:\n\n${codeExcerpts}`
              : ''
          }\n\nRepos:\n${repoSummaries}\n\nReturn ONLY raw JSON (no markdown):\n{\n  "strengths": ["2-3 concise strengths, grounded in actual repo structure/code where available"],\n  "weaknesses": ["2-3 specific gaps in architecture, testing, or code organization — reference actual code/files when excerpts were provided"]\n}`
        }]
      });

      const raw = narrative.choices[0]?.message?.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned) as { strengths?: string[]; weaknesses?: string[] };
      profileStrengths = parsed.strengths ?? [];
      profileWeaknesses = parsed.weaknesses ?? [];
    } catch (e) {
      console.error('[GitHub Analyser] GPT narrative failed:', e);
    }

    // Per-repo implementation feedback — every repo with a readable key
    // source file (not just the top 3), so each repo gets its own specific
    // model/architecture/implementation critique instead of the generic
    // structural checklist repeating across every repo past the top few.
    emit('Generating per-repo implementation feedback...');
    try {
      const feedbackTargets = scored
        .map((ps, i) => ({ ps, i }))
        .filter(({ i }) => structures[i]?.keySourceFilePath)
        .slice(0, 12);

      if (feedbackTargets.length > 0) {
        const excerptResults = await Promise.allSettled(
          feedbackTargets.map(({ i }) =>
            fetchFileContent(repos[i].url, structures[i]!.keySourceFilePath!, 2500)
          )
        );

        const perRepoExcerpts = feedbackTargets
          .map(({ ps, i }, idx) => {
            const content = excerptResults[idx].status === 'fulfilled' ? excerptResults[idx].value : null;
            if (!content) return null;
            return `--- ${ps.repoName} (${ps.primaryLanguage ?? 'unknown'}) :: ${structures[i]!.keySourceFilePath} ---\n${content}`;
          })
          .filter((x): x is string => x !== null)
          .join('\n\n');

        if (perRepoExcerpts) {
          const feedbackResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            max_tokens: 1200,
            messages: [{
              role: 'user',
              content: `For EACH repo below, give exactly 2 specific, code-grounded implementation improvements — point at the actual model design, architecture, error handling, algorithm choice, or code structure visible in the excerpt (e.g. "the training loop has no validation split", "the API handler has no input validation before hitting the DB", "the model class hardcodes hyperparameters instead of accepting config"). Do NOT mention README, documentation, or deployment — those are tracked separately. If an excerpt is too short to say anything specific, give one general best-practice suggestion for that language/domain instead.\n\n${perRepoExcerpts}\n\nReturn ONLY raw JSON (no markdown), keyed by exact repo name:\n{ "RepoName": ["suggestion 1", "suggestion 2"], ... }`
            }]
          });

          const rawFeedback = feedbackResponse.choices[0]?.message?.content ?? '{}';
          const cleanedFeedback = rawFeedback.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const feedbackByRepo = JSON.parse(cleanedFeedback) as Record<string, string[]>;

          for (const { ps } of feedbackTargets) {
            const fb = feedbackByRepo[ps.repoName];
            if (Array.isArray(fb) && fb.length > 0) {
              ps.implementationFeedback = fb;
            }
          }
        }
      }
    } catch (e) {
      console.error('[GitHub Analyser] Per-repo implementation feedback failed:', e);
    }
  }

  emit('Saving analysis to database...');

  // Upsert per-repo analysis in bulk
  const analysisPayload = scored.map(ps => ({
    user_id: userId,
    repo_name: ps.repoName,
    total_score: ps.totalScore,
    grade: ps.grade,
    dimensions: ps.dimensions,
    weaknesses: ps.weaknesses,
    strengths: ps.strengths,
    career_relevance: ps.careerRelevance,
    analysed_at: new Date().toISOString(),
  }));

  if (analysisPayload.length > 0) {
    const { error: upsertErr } = await supabase.from('github_analysis').upsert(analysisPayload, { onConflict: 'user_id,repo_name' });
    if (upsertErr) console.error('[GitHub Analyser] Failed to bulk upsert analysis:', upsertErr);
  }

  // Clear non-completed actions and insert fresh ones
  await supabase
    .from('github_priority_actions')
    .delete()
    .eq('user_id', userId)
    .eq('completed', false);

  if (allActions.length > 0) {
    await supabase.from('github_priority_actions').insert(
      allActions.slice(0, 30).map(a => ({
        id: a.id,
        user_id: userId,
        repo_name: a.repoName,
        repo_url: a.repoUrl,
        action_title: a.actionTitle,
        action_description: a.actionDescription,
        weakness_category: a.weakness,
        priority: a.priority,
        effort: a.effort,
        estimated_minutes: a.estimatedMinutes,
        impact_score: a.impactScore,
        impact_areas: a.impactAreas,
        ai_suggested_commands: a.aiSuggestedCommands ?? null,
        completed: false,
        created_at: a.createdAt,
      }))
    );
  }

  emit('Analysis complete!');

  const username = (user as { github_username?: string } | null)?.github_username ?? '';

  return {
    userId,
    username,
    totalRepos: repos.length,
    portfolioScore,
    profileStrengths,
    profileWeaknesses,
    topProjects,
    weakestProjects,
    allProjects,
    priorityActions: allActions.slice(0, 20),
    careerReadiness: {
      resumeReadyProjects,
      languageDiversity: langs,
      estimatedProfileStrength: profileStrength,
    },
    commitPatterns: {
      totalCommitsLast90Days: totalCommits,
      averageCommitsPerWeek: avgPerWeek,
      longestStreak: streak,
      currentStreak: streak,
      consistencyScore,
    },
    generatedAt: new Date().toISOString(),
  };
}
