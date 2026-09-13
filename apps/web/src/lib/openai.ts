import OpenAI from 'openai';

export const openaiConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Sanitize user-controlled strings before LLM context injection
export const sanitize = (s: string | null | undefined): string =>
  (s ?? '').replace(/[<>{}[\]]/g, '').slice(0, 200);
