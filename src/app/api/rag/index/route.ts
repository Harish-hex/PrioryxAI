import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding, hashContent, shouldEmbedDocument, toPgVector } from '@/lib/rag/embeddings';

export const runtime = 'nodejs';
export const maxDuration = 30;

function chunkContent(content: string, maxChars = 3500, overlapChars = 250): string[] {
  const cleaned = content.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxChars) return [cleaned];

  const chunks: string[] = [];
  let start = 0;
  while (start < cleaned.length && chunks.length < 20) {
    const hardEnd = Math.min(start + maxChars, cleaned.length);
    const slice = cleaned.slice(start, hardEnd);
    const sentenceBreak = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('\n'));
    const end = hardEnd < cleaned.length && sentenceBreak > maxChars * 0.55
      ? start + sentenceBreak + 1
      : hardEnd;
    const chunk = cleaned.slice(start, end).trim();
    if (chunk.length >= 20) chunks.push(chunk);
    if (end >= cleaned.length) break;
    start = Math.max(end - overlapChars, start + 1);
  }
  return chunks;
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const sourceType = typeof body.source_type === 'string' ? body.source_type.slice(0, 80) : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!sourceType || content.length < 20) {
    return NextResponse.json({ error: 'source_type and content are required' }, { status: 400 });
  }

  const doc = {
    sourceType,
    sourceId: typeof body.source_id === 'string'
      ? body.source_id.slice(0, 200)
      : `content:${hashContent(`${sourceType}:${content}`).slice(0, 32)}`,
    title: typeof body.title === 'string' ? body.title.slice(0, 200) : null,
    content,
    metadata: typeof body.metadata === 'object' && body.metadata !== null && !Array.isArray(body.metadata)
      ? body.metadata as Record<string, unknown>
      : {},
  };

  const chunks = chunkContent(doc.content);
  const now = new Date().toISOString();

  if (!shouldEmbedDocument(doc)) {
    const rows = chunks.map((chunk, index) => ({
      user_id: user.id,
      source_type: doc.sourceType,
      source_id: chunks.length > 1 ? `${doc.sourceId}:chunk:${index + 1}` : doc.sourceId,
      title: chunks.length > 1 && doc.title ? `${doc.title} (${index + 1}/${chunks.length})` : doc.title,
      content_preview: chunk.slice(0, 4000),
      metadata: { ...doc.metadata, chunk_index: index, chunk_count: chunks.length },
      content_hash: hashContent(chunk),
      updated_at: now,
    }));
    const { error } = await supabase
      .from('ai_context_documents')
      .upsert(rows, { onConflict: 'user_id,source_type,source_id' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({
      indexed: true,
      embedded: false,
      chunksIndexed: rows.length,
      reason: 'embedding_not_required_or_not_configured',
    });
  }

  const rows = await Promise.all(chunks.map(async (chunk, index) => {
    const embedding = await generateEmbedding(chunk);
    return {
      user_id: user.id,
      source_type: doc.sourceType,
      source_id: chunks.length > 1 ? `${doc.sourceId}:chunk:${index + 1}` : doc.sourceId,
      title: chunks.length > 1 && doc.title ? `${doc.title} (${index + 1}/${chunks.length})` : doc.title,
      content_preview: chunk.slice(0, 4000),
      metadata: { ...doc.metadata, chunk_index: index, chunk_count: chunks.length },
      embedding_model: embedding.model,
      embedding: toPgVector(embedding.embedding),
      embedded_at: now,
      content_hash: embedding.contentHash,
      updated_at: now,
    };
  }));
  const { error } = await supabase
    .from('ai_context_documents')
    .upsert(rows, { onConflict: 'user_id,source_type,source_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    indexed: true,
    embedded: rows.some((row) => Boolean(row.embedding)),
    chunksIndexed: rows.length,
    model: rows[0]?.embedding_model ?? null,
  });
}
