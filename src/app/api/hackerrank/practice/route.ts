import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

    const { data: recsData, error: recsError } = await supabase
      .from('multi_platform_profiles')
      .select('hr_practice_recommendations')
      .eq('user_id', user.id)
      .single();

    if (recsError || !recsData) {
      return NextResponse.json({ error: 'No recommendations found' }, { status: 404 });
    }

    const { data: progressData, error: progressError } = await supabase
      .from('hr_practice_progress')
      .select('*')
      .eq('user_id', user.id);

    return NextResponse.json({
      recommendations: recsData.hr_practice_recommendations || [],
      progress: progressData || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
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

    const { domain, subdomain, problems_solved, target_problems } = await req.json();

    if (!domain || typeof problems_solved !== 'number') {
      return NextResponse.json({ error: 'Missing domain or problems_solved' }, { status: 400 });
    }

    const completed = problems_solved >= (target_problems || 0);

    const { data, error } = await supabase.from('hr_practice_progress').upsert({
      user_id: user.id,
      domain,
      subdomain,
      problems_solved,
      target_problems,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    }, { onConflict: 'user_id,domain,subdomain' }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, progress: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
