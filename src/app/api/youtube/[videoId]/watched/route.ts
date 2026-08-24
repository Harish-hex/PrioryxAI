import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recordFeedbackEvent } from '@/lib/feedback/events';

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
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const watchDurationSeconds = typeof body.watchDurationSeconds === 'number' ? body.watchDurationSeconds : 0;

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

    await recordFeedbackEvent(supabase, user.id, {
      eventType: 'learning_resource_completed',
      source: 'youtube',
      entityType: 'youtube_video',
      entityId: videoId,
      context: { watchDurationSeconds },
    });

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('Error marking video as watched:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
