/**
 * Phase 3 — Score Explanation via LLM
 *
 * Takes a deterministic breakdown from readiness-score.ts, generates a
 * short specific explanation + 3 ranked next actions. The LLM is
 * constrained to NEVER invent a different score — it only explains the
 * number the deterministic code already produced.
 *
 * Cached in Redis keyed on userId:scoreVersion:breakdownHash so identical
 * score states never re-hit the LLM on every page load.
 */

import { openai, sanitize } from '@/lib/openai';
import { redis, withFallback } from '@/lib/redis';
import { ReadinessScoreResult } from './readiness-score';

// ─────────────────────────────────────────────────────────────────────────────
// Output type
// ─────────────────────────────────────────────────────────────────────────────

export interface ScoreExplanation {
  summary: string;            // 1–2 sentence plain-English explanation of the score
  nextActions: [string, string, string]; // Exactly 3 ranked concrete next actions
  cached: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Simple deterministic hash of the breakdown for the cache key. */
function hashBreakdown(breakdown: ReadinessScoreResult['breakdown']): string {
  // Stable JSON with sorted keys -> djb2 hash
  const stable = JSON.stringify(
    Object.fromEntries(
      Object.entries(breakdown)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, v.raw])
    )
  );
  let h = 5381;
  for (let i = 0; i < stable.length; i++) {
    h = ((h << 5) + h) ^ stable.charCodeAt(i);
    h = h >>> 0; // keep unsigned 32-bit
  }
  return h.toString(16);
}

const CACHE_TTL_SEC = 60 * 60 * 6; // 6 hours — same score = same explanation

// ─────────────────────────────────────────────────────────────────────────────
// LLM call
// ─────────────────────────────────────────────────────────────────────────────

export async function explainReadinessScore(
  userId: string,
  result: ReadinessScoreResult,
  /** Optional free-text snippets from resume/GitHub to personalise the explanation.
   *  MUST be run through sanitize() before passing — this function sanitizes
   *  again as defence-in-depth. */
  userContext?: {
    resumeSkills?: string[];
    weakTopics?: string[];
  }
): Promise<ScoreExplanation> {
  const cacheKey = `score_explain:${userId}:${result.scoreVersion}:${hashBreakdown(result.breakdown)}`;

  // ── Check cache ──────────────────────────────────────────────────────────
  const cached = await withFallback(
    () => redis.get<ScoreExplanation>(cacheKey),
    null
  );
  if (cached) return { ...cached, cached: true };

  // ── Build sanitized context string ───────────────────────────────────────
  const skills = (userContext?.resumeSkills ?? [])
    .map((s) => sanitize(s))
    .slice(0, 8)
    .join(', ') || 'not available';

  const weakTopics = (userContext?.weakTopics ?? [])
    .map((t) => sanitize(t))
    .slice(0, 4)
    .join(', ') || 'not identified';

  // ── Build breakdown summary for prompt ───────────────────────────────────
  const breakdownLines = Object.values(result.breakdown)
    .sort((a, b) => a.raw - b.raw) // weakest first — helps LLM identify leverage
    .map((c) => `- ${c.name}: ${c.raw}/100 (weight ${Math.round(c.weight * 100)}%) — ${c.explanation}`)
    .join('\n');

  // ── LLM call ─────────────────────────────────────────────────────────────
  const systemPrompt = `You are PrioryxAI's placement advisor. A deterministic algorithm has just computed a student's Readiness Score.

YOUR CONSTRAINTS — violate any of these and the output is invalid:
1. The student's score is EXACTLY ${result.score}/100. Never state a different number. Never say "approximately" or "around".
2. Reference specific breakdown components BY NAME (e.g. "GitHub Portfolio", "Coding Practice"). Never give generic advice like "practice more LeetCode" without tying it to the score breakdown.
3. Output EXACTLY 3 next actions, ranked by leverage (highest-impact first).
4. Each next action must be ONE sentence, concrete, specific to THIS student's actual weak component — not generic. Bad: "Solve more LeetCode problems." Good: "Solve 3 Dynamic Programming mediums today using NeetCode's DP playlist to address your ${Math.round(result.breakdown['coding']?.raw ?? 0)}/100 Coding Practice score."
5. The summary must be 1–2 sentences max. No preamble, no encouragement phrases.
6. Output valid JSON matching exactly: { "summary": "...", "nextActions": ["...", "...", "..."] }`;

  const userPrompt = `Score: ${result.score}/100 (version ${result.scoreVersion})

Component breakdown (sorted weakest → strongest):
${breakdownLines}

Student context:
- Resume skills: ${skills}
- LeetCode weak topics: ${weakTopics}

Generate the explanation and next actions JSON now.`;

  let explanation: ScoreExplanation;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // cheaper/faster — explanation is low-stakes
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.3, // low variance — we want consistent, specific advice
    });

    const raw = JSON.parse(completion.choices[0]?.message?.content ?? '{}') as {
      summary?: string;
      nextActions?: string[];
    };

    const actions = (raw.nextActions ?? []).slice(0, 3) as [string, string, string];
    // Pad to 3 if LLM returned fewer (shouldn't happen given constraints)
    while (actions.length < 3) {
      actions.push('Review your weakest scoring component and take one action today.');
    }

    explanation = {
      summary: sanitize(raw.summary ?? 'Score computed. Review your breakdown for details.'),
      nextActions: actions as [string, string, string],
      cached: false,
    };
  } catch (err) {
    console.error('[explainReadinessScore] LLM error — using deterministic fallback:', err);
    // Deterministic fallback: pick the 3 weakest components and suggest addressing them
    const sorted = Object.values(result.breakdown).sort((a, b) => a.raw - b.raw);
    explanation = {
      summary: `Your Readiness Score is ${result.score}/100. Your weakest area is ${sorted[0]?.name ?? 'unknown'} (${sorted[0]?.raw ?? 0}/100).`,
      nextActions: [
        sorted[0] ? `Improve ${sorted[0].name}: ${sorted[0].explanation}` : 'Review your score breakdown.',
        sorted[1] ? `Then address ${sorted[1].name}: ${sorted[1].explanation}` : 'Connect a missing account.',
        sorted[2] ? `Finally, work on ${sorted[2].name}: ${sorted[2].explanation}` : 'Build consistency.',
      ] as [string, string, string],
      cached: false,
    };
  }

  // ── Write cache (fire-and-forget) ────────────────────────────────────────
  withFallback(
    () => redis.set(cacheKey, explanation, { ex: CACHE_TTL_SEC }),
    null
  ).catch(() => {});

  return explanation;
}
