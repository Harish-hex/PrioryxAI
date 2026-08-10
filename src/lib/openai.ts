import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key_for_build',
});

// Sanitize user-controlled strings before LLM context injection
export const sanitize = (s: string | null | undefined): string =>
  (s ?? '').replace(/[<>{}[\]]/g, '').slice(0, 200);
