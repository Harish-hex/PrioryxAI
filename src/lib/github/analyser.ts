// src/lib/github/analyser.ts — Orchestrates scoring + GPT-4o + Supabase writes
import { createServiceClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';
import { scoreProject, scorePortfolio } from './scorer';
import type { CachedRepo, GitHubIntelligenceReport, PriorityAction, ProjectScore } from './types';
import { v4 as uuidv4 } from 'uuid';

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
  emit(`Scoring ${repos.length} repositories...`);

  const scored: ProjectScore[] = repos.map((repo, i) => scoreProject(repo, i));
  const portfolioScore = scorePortfolio(repos);

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

  const topProjects = [...scored].sort((a, b) => b.totalScore - a.totalScore).slice(0, 5);
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
      const repoSummaries = repos.slice(0, 8).map(r =>
        `${r.name} (${r.language ?? 'unknown lang'}): ${r.description ?? 'no description'}`
      ).join('\n');

      const stream = (user as { stream?: string } | null)?.stream ?? 'software engineering';

      const narrative = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `Analyze this student's GitHub portfolio for a ${stream} career.\n\nRepos:\n${repoSummaries}\n\nReturn ONLY raw JSON (no markdown):\n{\n  "strengths": ["2-3 concise strengths of this portfolio"],\n  "weaknesses": ["2-3 specific gaps that hurt career prospects"]\n}`
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
  }

  emit('Saving analysis to database...');

  // Upsert per-repo analysis
  for (const ps of scored) {
    await supabase.from('github_analysis').upsert({
      user_id: userId,
      repo_name: ps.repoName,
      total_score: ps.totalScore,
      grade: ps.grade,
      dimensions: ps.dimensions,
      weaknesses: ps.weaknesses,
      strengths: ps.strengths,
      career_relevance: ps.careerRelevance,
      analysed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,repo_name' });
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
