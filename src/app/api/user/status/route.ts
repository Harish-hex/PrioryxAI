import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserStatusData } from '@/lib/data/user-status';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await getUserStatusData(supabase, user.id);
  return NextResponse.json(result);
}
