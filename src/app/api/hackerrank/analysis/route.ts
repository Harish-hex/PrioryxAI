export const maxDuration = 60;
export const dynamic = 'force-dynamic';
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

    const { data, error } = await supabase
      .from('multi_platform_profiles')
      .select('ai_analysis, hr_practice_recommendations, hackerrank_analysis')
      .eq('user_id', user.id)
      .single();

    let profileData = data;
    if (error || !data) {
      const mock = getMockProfile('hackerrank', user.id);
      if (mock) {
        profileData = mock;
      } else {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
    }

    if (!profileData || !profileData.ai_analysis) {
      return NextResponse.json({ status: 'analyzing' }, { status: 202 });
    }

    return NextResponse.json({
      ai_analysis: profileData.ai_analysis,
      hr_practice_recommendations: profileData.hr_practice_recommendations,
      hackerrank_analysis: profileData.hackerrank_analysis,
    });
  } catch (err: any) {
    console.error('Analysis API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
