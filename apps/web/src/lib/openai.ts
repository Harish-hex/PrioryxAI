import OpenAI from 'openai';

export const openaiConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());

// Falls back to a placeholder key so the OpenAI SDK's constructor doesn't
// throw when OPENAI_API_KEY is unset — this module is imported by ~20
// routes, and Next's build-time page-data collection evaluates them all,
// so an eager throw here fails the entire production build. Callers must
// still check `openaiConfigured` before making any real request.
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.trim() || 'sk-build-placeholder',
});

// Sanitize user-controlled strings before LLM context injection
export const sanitize = (s: string | null | undefined): string =>
  (s ?? '').replace(/[<>{}[\]]/g, '').slice(0, 200);
