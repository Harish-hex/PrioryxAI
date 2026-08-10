// Coding Connect API Route
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeTool } from '@/lib/mcp/registry';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    leetcodeUsername?: string;
    hackerrankUsername?: string;
  };

  const results: Record<string, unknown> = {};

  if (body.leetcodeUsername) {
    const lcResult = await executeTool('research.fetchLeetCodeProfile', {
      username: body.leetcodeUsername,
    }, user.id);
    results.leetcode = lcResult.result;
  }

  if (body.hackerrankUsername) {
    const hrResult = await executeTool('research.fetchHackerRankProfile', {
      username: body.hackerrankUsername,
    }, user.id);
    results.hackerrank = hrResult.result;
  }

  // Compute placement readiness
  if (body.leetcodeUsername) {
    const { data: profile } = await supabase
      .from('coding_profiles')
      .select('leetcode_stats, hackerrank_stats')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      const scoreResult = await executeTool('research.computePlacementReadinessScore', {
        lcStats: profile.leetcode_stats,
        hrStats: profile.hackerrank_stats,
      }, user.id);
      results.placementScore = scoreResult.result.data;
    }
  }

  return NextResponse.json(results);
}

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('coding_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return NextResponse.json({ profile: profile ?? null });
}
