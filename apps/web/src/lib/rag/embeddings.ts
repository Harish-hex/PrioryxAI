import crypto from 'crypto';
import { openai } from '@/lib/openai';

export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';
export const DEFAULT_EMBEDDING_DIMENSIONS = 1536;

export interface ContextDocumentInput {
  sourceType: string;
  sourceId?: string | null;
  title?: string | null;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface EmbeddingResult {
  model: string;
  embedding: number[];
  contentHash: string;
}

const DEFAULT_EMBEDDING_TIMEOUT_MS = 15_000;

export function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function shouldEmbedDocument(doc: ContextDocumentInput): boolean {
  if (!process.env.OPENAI_API_KEY) return false;
  if (doc.content.length < 40) return false;
  if (doc.sourceType === 'assistant_message') return false;
  return true;
}

export async function generateEmbedding(
  content: string,
  model = DEFAULT_EMBEDDING_MODEL,
  timeoutMs = DEFAULT_EMBEDDING_TIMEOUT_MS
): Promise<EmbeddingResult> {
  const cleaned = content.replace(/\s+/g, ' ').trim().slice(0, 8000);
  const response = await Promise.race([
    openai.embeddings.create({
      model,
      input: cleaned,
    }),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Embedding request timed out')), timeoutMs);
    }),
  ]);
  return {
    model,
    embedding: response.data[0]?.embedding ?? [],
    contentHash: hashContent(cleaned),
  };
}

export function toPgVector(values: number[]): string {
  return `[${values.map((v) => Number(v).toFixed(8)).join(',')}]`;
}
