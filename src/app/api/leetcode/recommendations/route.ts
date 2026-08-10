import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateProblemRecommendations } from '@/lib/leetcode/ai-analyzer';
import { PriorityTopic, UserStream } from '@/lib/leetcode/types';

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('problem_recommendations')
    .select('*')
    .eq('user_id', user.id)
    .order('priority', { ascending: true }) // Not true sort, just grouping
    .order('topic', { ascending: true });

  if (error) {
    console.error('[recommendations GET]', error);
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { regenerate } = await req.json().catch(() => ({ regenerate: false }));

    if (regenerate) {
      await supabase.from('problem_recommendations').delete().eq('user_id', user.id);
    }

    // Check if they already exist
    const { count } = await supabase.from('problem_recommendations').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
    if (count && count > 0) {
       return NextResponse.json({ message: 'Recommendations already exist' });
    }

    // Get the ai_analysis from profile
    const { data: profile } = await supabase
      .from('leetcode_profiles')
      .select('ai_analysis')
      .eq('user_id', user.id)
      .single();

    if (!profile || !profile.ai_analysis) {
      return NextResponse.json({ error: 'AI Analysis required first' }, { status: 400 });
    }

    // We assume stream is SDE for now if we can't find it, or we fetch it from users table
    const { data: userRow } = await supabase.from('users').select('target_roles, target_companies').eq('id', user.id).single();
    const stream = (userRow?.target_roles?.[0] as UserStream) || 'SDE';
    const targetCompanies = userRow?.target_companies || [];
    
    const analysis = profile.ai_analysis;
    const topics: PriorityTopic[] = analysis.priority_topics || [];

    const recommendations = await generateProblemRecommendations(stream, topics, targetCompanies);

    if (recommendations.length > 0) {
      const inserts = recommendations.map(r => ({
        user_id: user.id,
        ...r
      }));
      await supabase.from('problem_recommendations').insert(inserts);
    }

    return NextResponse.json({ success: true, count: recommendations.length });

  } catch (error) {
    console.error('[recommendations POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
