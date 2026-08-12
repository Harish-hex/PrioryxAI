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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > 4.5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 4.5MB.' }, { status: 413 });
    }

    const mimeType = file.type;
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/heic',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(mimeType) && !mimeType.startsWith('image/')) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await extractSchedule(buffer, mimeType, 'timetable');

    if (process.env.NODE_ENV === 'development') {
      console.log('[Schedule Extract] Timetable result:', result);
    }

    if (!result.success || result.entries.length === 0) {
      return NextResponse.json({ 
        error: result.error || 'No dates found. Try a clearer photo or different format.',
        raw: result.rawResponse
      }, { status: 400 });
    }

    const entries = result.entries as TimetableEntry[];
    
    // Upsert into schedule_timetable
    const inserts = entries.map(entry => ({
      user_id: user.id,
      subject: entry.subject,
      day: entry.day,
      start_time: entry.startTime,
      end_time: entry.endTime,
      location: entry.location,
      type: entry.type || 'lecture',
    }));

    // Service role: RLS on the anon cookie client was silently rejecting these
    // writes in production.
    const db = createServiceRoleClient();

    // Full replace — re-uploading a timetable previously appended, leaving the
    // user with every old class duplicated alongside the new ones.
    await db.from('schedule_timetable').delete().eq('user_id', user.id);

    const { error: dbError } = await db
      .from('schedule_timetable')
      .insert(inserts);

    if (dbError) {
      console.error('[Schedule Extract] DB Insert Error:', dbError.message, dbError.code, dbError.details);
      return NextResponse.json({ error: 'Failed to save timetable to database' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      entries,
      confidence: result.confidence,
      entryCount: entries.length,
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

    const { data, error } = await createServiceRoleClient()
      .from('schedule_timetable')
      .select('*')
      .eq('user_id', user!.id);

    if (error) {
      console.error('[Schedule Extract] DB Fetch Error:', error);
      return NextResponse.json({ error: 'Failed to fetch timetable' }, { status: 500 });
    }

    // Map DB rows back to TimetableEntry format for the frontend preview
    const entries = data.map(row => ({
      subject: row.subject,
      day: row.day,
      startTime: row.start_time,
      endTime: row.end_time,
      location: row.location,
      type: row.type
    }));

    return NextResponse.json({ entries });
  } catch (error: any) {
    console.error('[Schedule Extract] GET API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

