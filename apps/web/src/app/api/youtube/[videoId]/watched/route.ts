import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 20

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
    const watchDurationSeconds = body.watchDurationSeconds || 0;

    // Update recommendation watched status
    await supabase
      .from('youtube_recommendations')
      .update({ watched: true, watched_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('video_id', videoId);

    // Insert into watch history
    await supabase
      .from('youtube_watch_history')
      .upsert(
        { user_id: user.id, video_id: videoId, watched_at: new Date().toISOString(), watch_duration_seconds: watchDurationSeconds },
        { onConflict: 'user_id, video_id' }
      );

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error marking video as watched:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
