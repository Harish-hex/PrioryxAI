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

    // Get current status to toggle
    const { data: current } = await supabase
      .from('youtube_recommendations')
      .select('saved_for_later')
      .eq('user_id', user.id)
      .eq('video_id', videoId)
      .single();

    const newStatus = current ? !current.saved_for_later : true;

    await supabase
      .from('youtube_recommendations')
      .update({ saved_for_later: newStatus })
      .eq('user_id', user.id)
      .eq('video_id', videoId);

    return NextResponse.json({ saved: newStatus });

  } catch (error: any) {
    console.error('Error toggling video save status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
