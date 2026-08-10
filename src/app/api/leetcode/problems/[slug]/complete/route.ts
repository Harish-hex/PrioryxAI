import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { data, error } = await supabase
      .from('problem_recommendations')
      .update({
        completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('problem_slug', params.slug)
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[problem complete] error:', error);
    return NextResponse.json({ error: 'Failed to complete problem' }, { status: 500 });
  }
}
