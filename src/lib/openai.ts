import OpenAI from 'openai';

let _openai: OpenAI | null = null;

export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    if (!_openai) {
      _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    }
    const value = (_openai as any)[prop];
    return typeof value === 'function' ? value.bind(_openai) : value;
  },
});

// Sanitize user-controlled strings before LLM context injection
export const sanitize = (s: string | null | undefined): string =>
  (s ?? '').replace(/[<>{}[\]]/g, '').slice(0, 200);
