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
    .from('multi_platform_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    const mock = getMockProfile('hackerrank', user.id);
    if (mock) {
      data = mock;
    } else {
      return NextResponse.json({ data: null });
    }
  }

  return NextResponse.json({ data });
}
