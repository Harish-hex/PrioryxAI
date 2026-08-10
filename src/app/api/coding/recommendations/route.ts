// Coding Recommendations API Route
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeTool } from '@/lib/mcp/registry';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('coding_profiles')
    .select('weak_topics')
    .eq('user_id', user.id)
    .single();

  const { data: userProfile } = await supabase
    .from('users')
    .select('target_companies')
    .eq('id', user.id)
    .single();

  const weakTopics = (profile?.weak_topics as string[]) ?? ['Arrays', 'Dynamic Programming', 'Graphs'];
  const targetCompanies = (userProfile?.target_companies as string[]) ?? [];

  const result = await executeTool('research.recommendProblems', {
    weakTopics,
    targetCompanies,
  }, user.id);

  return NextResponse.json(result.result.data ?? { recommendations: [] });
}
