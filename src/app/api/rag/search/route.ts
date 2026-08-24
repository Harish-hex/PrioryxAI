import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { retrieveContextDocuments } from '@/lib/rag/retrieval';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') ?? '';
  const limit = Number(searchParams.get('limit') ?? 6);
  const sourceType = searchParams.get('source_type');

  const result = await retrieveContextDocuments(supabase, user.id, query, {
    limit: Number.isFinite(limit) ? limit : 6,
    sourceType,
  });

  return NextResponse.json(result);
}
