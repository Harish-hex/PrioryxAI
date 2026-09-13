import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function getDbClient(supabaseAuthClient: any) {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return supabaseAuthClient;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Allow empty or invalid JSON body to default
    }

    const activityType = typeof body.activity_type === 'string' ? body.activity_type : 'daily_visit';
    const metadata = (typeof body.metadata === 'object' && body.metadata !== null) ? body.metadata : {};
    const now = new Date().toISOString();

    const db = getDbClient(supabase);

    // 1. Insert activity into user_activities table
    try {
      await db.from('user_activities').insert({
        user_id: user.id,
        activity_type: activityType,
        metadata,
        created_at: now,
      });
    } catch (dbErr) {
      console.warn('[api/user/activity] user_activities insert warning:', dbErr);
    }

    // 2. Update user last_active_at
    try {
      await db
        .from('users')
        .update({ last_active_at: now })
        .eq('id', user.id);
    } catch (userErr) {
      console.warn('[api/user/activity] last_active_at update warning:', userErr);
    }

    // 3. If YouTube watch, ensure youtube_watch_history is updated
    if (activityType === 'youtube_watch' && metadata.videoId) {
      try {
        await db.from('youtube_watch_history').upsert({
          user_id: user.id,
          video_id: metadata.videoId,
          watched_at: now,
          watch_duration_seconds: metadata.durationSeconds || 60,
        }, { onConflict: 'user_id, video_id' });
      } catch {}
    }

    return NextResponse.json({ success: true, timestamp: now });
  } catch (error: any) {
    console.error('[api/user/activity] Error:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDbClient(supabase);

    const { data: activities, error } = await db
      .from('user_activities')
      .select('id, activity_type, metadata, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ activities: [] });
    }

    return NextResponse.json({ activities: activities || [] });
  } catch (error: any) {
    return NextResponse.json({ activities: [] });
  }
}
