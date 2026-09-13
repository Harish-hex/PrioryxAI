import { SupabaseClient } from '@supabase/supabase-js';
import { generateEmbedding } from './embeddings';

export interface RetrievedContextDocument {
  id: string;
  source_type: string;
  source_id: string | null;
  title: string | null;
  content_preview: string | null;
  metadata: Record<string, unknown>;
  similarity: number | null;
  created_at: string;
}

export async function retrieveContextDocuments(
  db: SupabaseClient,
  userId: string,
  query: string,
  options: { limit?: number; sourceType?: string | null; minSimilarity?: number } = {}
): Promise<{ documents: RetrievedContextDocument[]; semantic: boolean; reason?: string }> {
  const limit = Math.min(Math.max(options.limit ?? 6, 1), 20);
  const minSimilarity = Math.max(0, Math.min(options.minSimilarity ?? 0.12, 1));
  const cleaned = query.replace(/\s+/g, ' ').trim();
  if (!cleaned) return { documents: [], semantic: false, reason: 'empty_query' };

  if (!process.env.OPENAI_API_KEY) {
    const fallback = await lexicalFallback(db, userId, cleaned, limit, options.sourceType);
    return { documents: fallback, semantic: false, reason: 'openai_not_configured' };
  }

  try {
    const embedding = await generateEmbedding(cleaned);
    const { data, error } = await db.rpc('match_ai_context_documents', {
      query_embedding: `[${embedding.embedding.join(',')}]`,
      match_count: limit,
      source_filter: options.sourceType ?? null,
    });

    if (error) throw error;
    return {
      documents: ((data ?? []) as RetrievedContextDocument[])
        .filter((doc) => (doc.similarity ?? 0) >= minSimilarity),
      semantic: true,
    };
  } catch (error) {
    console.warn('[rag] semantic retrieval failed, using lexical fallback:', error instanceof Error ? error.message : String(error));
    const fallback = await lexicalFallback(db, userId, cleaned, limit, options.sourceType);
    return { documents: fallback, semantic: false, reason: 'semantic_retrieval_failed' };
  }
}

async function lexicalFallback(
  db: SupabaseClient,
  userId: string,
  query: string,
  limit: number,
  sourceType?: string | null
): Promise<RetrievedContextDocument[]> {
  let req = db
    .from('ai_context_documents')
    .select('id, source_type, source_id, title, content_preview, metadata, created_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (sourceType) req = req.eq('source_type', sourceType);
  const { data } = await req;
  const terms = query.toLowerCase().split(/\s+/).filter((term) => term.length > 2).slice(0, 12);

  return ((data ?? []) as Array<Omit<RetrievedContextDocument, 'similarity'>>)
    .map((doc) => {
      const text = `${doc.title ?? ''} ${doc.content_preview ?? ''}`.toLowerCase();
      const hits = terms.filter((term) => text.includes(term)).length;
      return { ...doc, similarity: terms.length > 0 ? hits / terms.length : null };
    })
    .filter((doc) => (doc.similarity ?? 0) > 0 || terms.length === 0)
    .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
    .slice(0, limit);
}
