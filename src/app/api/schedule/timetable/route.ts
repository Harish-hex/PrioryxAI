export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { extractSchedule, TimetableEntry } from '@/lib/schedule/extractor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 10 MB.' }, { status: 413 });
    }

    const mimeType = file.type || 'image/jpeg';
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await extractSchedule(buffer, mimeType, 'timetable');

    if (process.env.NODE_ENV === 'development') {
      console.log('[Schedule Extract] Timetable result:', result);
    }

    if (!result.success || result.entries.length === 0) {
      return NextResponse.json({ 
        error: result.error || 'No class timetable slots found. Try a clearer photo or different format.',
        raw: result.rawResponse
      }, { status: 400 });
    }

    const entries = result.entries as TimetableEntry[];
    
    // Format inserts for schedule_timetable
    const inserts = entries.map(entry => ({
      user_id: user.id,
      subject: entry.subject,
      day: entry.day,
      start_time: entry.startTime,
      end_time: entry.endTime,
      location: entry.location,
      type: entry.type || 'lecture',
    }));

    const db = createServiceRoleClient();

    // Replace user's old timetable records
    try {
      await db.from('schedule_timetable').delete().eq('user_id', user.id);
    } catch {}

    const { error: dbError } = await db
      .from('schedule_timetable')
      .insert(inserts);

    if (dbError) {
      console.error('[Schedule Extract] DB Insert Error:', dbError.message);
    }

    // Keep user_timetables synced
    try {
      await db.from('user_timetables').upsert({
        user_id: user.id,
        entries,
        extracted_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch {}

    return NextResponse.json({
      success: true,
      entries,
      confidence: result.confidence,
      entryCount: entries.length,
      message: `Extracted ${entries.length} weekly class slot${entries.length === 1 ? '' : 's'}`
    });
  } catch (error: any) {
    console.error('[Schedule Extract] API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = createServiceRoleClient();
    const { data, error } = await db
      .from('schedule_timetable')
      .select('*')
      .eq('user_id', user.id);

    if (error || !data || data.length === 0) {
      // Fallback to user_timetables table
      const { data: fallbackData } = await db
        .from('user_timetables')
        .select('entries')
        .eq('user_id', user.id)
        .single();

      if (fallbackData?.entries) {
        return NextResponse.json({ entries: fallbackData.entries });
      }
      return NextResponse.json({ entries: [] });
    }

    // Map DB rows back to TimetableEntry format
    const entries = data.map(row => ({
      subject: row.subject,
      day: row.day,
      startTime: row.start_time,
      endTime: row.end_time,
      location: row.location,
      type: row.type || 'lecture',
    }));

    return NextResponse.json({ entries });
  } catch (error: any) {
    console.error('[Schedule Extract] GET API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
