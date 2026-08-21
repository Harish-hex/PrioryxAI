/**
 * User Memory — Phase 5
 *
 * Extracts and persists structured facts from assistant conversations.
 * Used to inject persistent context into future sessions.
 *
 * DB dependency: user_memory table (see migration in AI_IMPLEMENTATION.md)
 * LLM model: gpt-4o-mini (cheap — only 3 facts per session)
 *
 * Privacy: Only the user's own memories are ever read/written.
 * Cross-user data is explicitly never used here (see cohort-intelligence.ts).
 */

import { openai } from '@/lib/openai';
import { createClient } from '@/lib/supabase/server';

export interface UserMemoryFact {
  factType: 'goal' | 'preference' | 'struggle' | 'advice_given' | 'context';
  factText: string;
  sessionContext?: string;
}

/**
 * Extract up to 3 memorable facts from a conversation snippet.
 * Non-blocking — errors are swallowed so the session is never disrupted.
 */
export async function extractAndUpsertMemory(
  userId: string,
  sessionText: string
): Promise<void> {
  if (!sessionText || sessionText.trim().length < 50) return;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      max_tokens: 400,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: `Extract at most 3 memorable facts about the student from this conversation. Only extract facts that would be useful in future sessions (goals, preferences, struggles, skills, plans).
Return JSON: { "facts": [{ "factType": "goal"|"preference"|"struggle"|"advice_given"|"context", "factText": "string (max 150 chars, first person)" }] }
If no meaningful facts exist, return { "facts": [] }.`,
        },
        {
          role: 'user',
          content: sessionText.slice(0, 3000),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '{"facts":[]}';
    const parsed = JSON.parse(raw) as { facts?: Array<{ factType: string; factText: string }> };
    const facts = parsed.facts ?? [];

    if (facts.length === 0) return;

    const supabase = createClient();

    // Upsert facts — deduplicate by (user_id, fact_text) on write
    // We check for semantic duplicates cheaply: skip if identical text already exists
    const { data: existing } = await supabase
      .from('user_memory')
      .select('fact_text')
      .eq('user_id', userId)
      .limit(200);

    const existingTexts = new Set((existing ?? []).map((r) => r.fact_text.toLowerCase()));

    const newFacts = facts.filter(
      (f) =>
        f.factText &&
        f.factText.length > 10 &&
        !existingTexts.has(f.factText.toLowerCase())
    );

    if (newFacts.length === 0) return;

    await supabase.from('user_memory').insert(
      newFacts.map((f) => ({
        user_id: userId,
        fact_type: f.factType ?? 'context',
        fact_text: f.factText.slice(0, 200),
        session_context: sessionText.slice(0, 200),
      }))
    );

    console.log(`[UserMemory] Persisted ${newFacts.length} fact(s) for ${userId}`);
  } catch (err) {
    // Non-blocking — log and continue
    console.error('[UserMemory] extractAndUpsertMemory error (non-fatal):', err);
  }
}

/**
 * Fetch the user's most recent memory facts for context injection.
 * Returns a formatted string ready for system prompt injection.
 */
export async function getUserMemoryContext(userId: string, limit = 10): Promise<string> {
  try {
    const supabase = createClient();
    const { data: facts } = await supabase
      .from('user_memory')
      .select('fact_type, fact_text')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!facts?.length) return '';

    const formatted = facts
      .map((f) => `[${f.fact_type}] ${f.fact_text}`)
      .join('\n');

    return `\nPersisted memory about this student:\n${formatted}`;
  } catch {
    return '';
  }
}
