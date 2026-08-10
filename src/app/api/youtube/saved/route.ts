import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: savedRecs } = await supabase
      .from('youtube_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .eq('saved_for_later', true)
      .order('created_at', { ascending: false });

    const formatted = (savedRecs || []).map(rec => ({
      id: rec.id,
      userId: rec.user_id,
      video: {
        videoId: rec.video_id,
        title: rec.title,
        channelName: rec.channel_name,
        channelId: rec.channel_id,
        thumbnail: rec.thumbnail,
        duration: rec.duration,
        viewCount: rec.view_count,
        publishedAt: rec.published_at,
        description: '',
        tags: []
      },
      category: rec.category,
      source: rec.source,
      relevanceTopic: rec.relevance_topic,
      whyRecommended: rec.why_recommended,
      priority: rec.priority,
      estimatedLearningMinutes: rec.estimated_learning_minutes,
      watched: rec.watched,
      watchedAt: rec.watched_at,
      savedForLater: rec.saved_for_later,
      dismissed: rec.dismissed,
      createdAt: rec.created_at
    }));

    return NextResponse.json({ saved: formatted });

  } catch (error: any) {
    console.error('Error fetching saved videos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
