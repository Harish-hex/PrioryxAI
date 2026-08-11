import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getMockProfile } from '@/lib/mock-db';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch LeetCode
    let { data: lcData } = await supabase
      .from('leetcode_profiles')
      .select('ai_analysis, placement_readiness_score, leetcode_username, solved_data, contest_info')
      .eq('user_id', user.id)
      .single();

    if (!lcData) {
      const mockLc = getMockProfile('leetcode', user.id);
      if (mockLc) {
        lcData = {
          ai_analysis: mockLc.ai_analysis ?? null,
          placement_readiness_score: mockLc.placement_readiness_score ?? mockLc.quickScore ?? 45, // Provide a fallback score so hasLC becomes true
          leetcode_username: mockLc.profile?.username ?? mockLc.username,
          solved_data: mockLc.solved ?? null,
          contest_info: mockLc.contestInfo ?? mockLc.contest_info ?? null
        } as any;
      }
    }

    // Fetch HackerRank / Multi-platform
    let { data: hrData } = await supabase
      .from('multi_platform_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!hrData) {
      const mockHr = getMockProfile('hackerrank', user.id);
      if (mockHr) hrData = mockHr;
    }

    let combinedScore = 0;
    let maxScore = 0;

    let lcScore = 0;
    if (lcData?.placement_readiness_score) {
      lcScore = lcData.placement_readiness_score;
      maxScore += 100;
      combinedScore += lcScore;
    }

    let hrScore = 0;
    let bonusScore = 0;
    let bonusCount = 0;

    if (hrData) {
      hrScore = hrData.hackerrank_score || 0;
      if (hrScore > 0) {
        maxScore += 100;
        combinedScore += hrScore;
      }

      // Very simple bonus score averaging from rating logic
      if (hrData.codechef_data?.rating) {
        bonusScore += Math.min((hrData.codechef_data.rating / 2500) * 100, 100);
        bonusCount++;
      }
      if (hrData.gfg_data?.totalSolved) {
        bonusScore += Math.min((hrData.gfg_data.totalSolved / 500) * 100, 100);
        bonusCount++;
      }
      if (hrData.codeforces_data?.rating) {
        bonusScore += Math.min((hrData.codeforces_data.rating / 2500) * 100, 100);
        bonusCount++;
      }
    }

    let overallScore = 0;
    const avgBonus = bonusCount > 0 ? bonusScore / bonusCount : 0;

    if (lcScore > 0 && hrScore > 0) {
      overallScore = (lcScore * 0.55) + (hrScore * 0.30) + (avgBonus * 0.15);
    } else if (hrScore > 0) {
      overallScore = (hrScore * 0.60) + (avgBonus * 0.40);
    } else if (lcScore > 0) {
      overallScore = lcScore;
    }

    return NextResponse.json({
      overallScore: Math.round(overallScore),
      leetcode: lcData || null,
      multiPlatform: hrData || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
