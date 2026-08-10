import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMockProfile } from '@/lib/mock-db';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let { data, error } = await supabase
    .from('leetcode_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    const mock = getMockProfile('leetcode', user.id);
    if (mock) {
      data = {
        profile_data: mock.profile,
        placement_readiness_score: mock.quickScore,
        leetcode_username: mock.username,
        ...mock
      } as any;
    } else {
      return NextResponse.json({ data: null });
    }
  }

  return NextResponse.json({ data });
}
