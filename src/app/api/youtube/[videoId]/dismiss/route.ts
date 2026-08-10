import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  req: Request,
  { params }: { params: { videoId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoId } = params;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || null;

    await supabase
      .from('youtube_recommendations')
      .update({ dismissed: true, dismissed_reason: reason })
      .eq('user_id', user.id)
      .eq('video_id', videoId);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error dismissing video:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
