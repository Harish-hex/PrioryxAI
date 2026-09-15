import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COMPANIES = [
  'Accenture', 'Capgemini', 'Deloitte', 'Facebook', 'Google', 'Infosys',
  'LTIMindtree', 'Microsoft', 'PayPal', 'TCS', 'Uber',
];

export async function GET(req: NextRequest) {
  const company = req.nextUrl.searchParams.get('company');
  const db = createServiceRoleClient();

  if (company) {
    const { data, error } = await db
      .from('dsa_questions')
      .select('id, title, topic, difficulty, platform, problem_url, notes')
      .contains('companies', [company])
      .order('topic', { ascending: true })
      .limit(200);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ company, questions: data ?? [] });
  }

  const counts: Record<string, number> = {};
  for (const c of COMPANIES) {
    const { count, error } = await db
      .from('dsa_questions')
      .select('id', { count: 'exact', head: true })
      .contains('companies', [c]);
    if (!error) counts[c] = count ?? 0;
  }

  return NextResponse.json({ counts });
}
