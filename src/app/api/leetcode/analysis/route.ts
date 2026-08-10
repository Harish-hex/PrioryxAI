import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMockProfile } from '@/lib/mock-db';

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || user.id;
  
  if (userId !== user.id) {
     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { data: profile } = await supabase
      .from('leetcode_profiles')
      .select('ai_analysis')
      .eq('user_id', user.id)
      .single();

    let profileData = profile;
    if (!profile) {
      const mock = getMockProfile('leetcode', user.id);
      if (mock) {
        profileData = { ai_analysis: mock.ai_analysis || null };
      } else {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
    }

    if (!profileData || !profileData.ai_analysis) {
      return NextResponse.json({
        status: 'analyzing',
        message: 'Analysis in progress, check back in 30s'
      }, { status: 202 });
    }

    return NextResponse.json({ data: profileData.ai_analysis });
  } catch (error) {
    console.error('[leetcode analysis] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
