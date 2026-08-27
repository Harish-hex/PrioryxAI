export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { readFile, extractWithAI, parseAIJson, parseUploadedFile } from '@/lib/file-processor'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ── PROMPTS ────────────────────────────────────────────────────

const EXAM_SYSTEM_PROMPT = `You are an expert at reading Indian university exam 
schedules, timetables, and academic calendars.
Return ONLY raw JSON with no markdown, no code fences, no explanation.`

const EXAM_USER_PROMPT = `Extract ALL exam dates, assignment deadlines, test dates,
and lab submission dates from this document.

This is likely an Indian university schedule (like Amrita, VIT, Anna University,
SRM, Manipal, etc.). Look for:
- Subject names and/or codes (e.g. "19CSE301", "DBMS", "Operating Systems")
- Dates in ANY format (DD/MM/YYYY, Month DD YYYY, 15th August, etc.)
- Time slots (FN = Forenoon 10AM-1PM, AN = Afternoon 2PM-5PM, or actual times)
- Exam type (Internal, External, CAT, FAT, Mid-term, End-sem, Quiz, Lab)
- Venue/Hall/Room if shown
- Assignment/project deadlines

Return JSON with EXACTLY this structure:
{
  "extracted": true,
  "document_type": "exam_schedule | timetable | academic_calendar | mixed",
  "institution": "university name if visible",
  "semester": "semester/year if visible",
  "entries": [
    {
      "title": "Database Management Systems - Internal Assessment",
      "subject_code": "19CSE301",
      "subject_name": "Database Management Systems",
      "date": "2026-08-15",
      "day": "Saturday",
      "start_time": "10:00",
      "end_time": "13:00",
      "session": "FN",
      "venue": "Hall A Block",
      "type": "exam",
      "exam_type": "internal | external | mid_term | end_sem | quiz | lab | assignment",
      "priority": "high",
      "marks": "50",
      "notes": "any additional info"
    }
  ],
  "confidence": "high | medium | low",
  "notes": "what you found / any parsing issues"
}

IMPORTANT RULES:
- If a date format is ambiguous, assume DD/MM/YYYY for Indian universities
- Convert all dates to ISO format YYYY-MM-DD
- If year is missing, assume 2026
- FN sessions: start_time "10:00", end_time "13:00"
- AN sessions: start_time "14:00", end_time "17:00"
- Set priority: "high" for exams/end-sem/external, "medium" for internal/quiz,
  "low" for assignments/labs
- Extract EVERY entry you can find, even if partial
- If you can see ANY dates or subjects, set extracted: true
- Only set extracted: false if the document has NO academic schedule content at all

Document content:`

// ── API HANDLER ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  console.log('[ExamSchedule API] === Request received ===')

  // 1. Auth check
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse uploaded file
  const fileResult = await parseUploadedFile(req)
  if ('error' in fileResult && !('buffer' in fileResult)) {
    return NextResponse.json({ error: fileResult.error }, { status: 400 })
  }
  const { buffer, mimeType, filename } = fileResult as {
    buffer: Buffer; mimeType: string; filename: string
  }

  // 3. Read file
  console.log('[ExamSchedule API] Reading file...')
  const readResult = await readFile(buffer, mimeType, filename)
  console.log('[ExamSchedule API] Read method:', readResult.method,
    '| text length:', readResult.rawText.length)

  if (!readResult.success) {
    return NextResponse.json({ error: readResult.error }, { status: 400 })
  }

  // 4. AI extraction
  console.log('[ExamSchedule API] Calling AI extraction...')
  const aiResult = await extractWithAI(
    readResult,
    EXAM_SYSTEM_PROMPT,
    EXAM_USER_PROMPT,
    2000
  )

  if (!aiResult.success) {
    return NextResponse.json(
      { error: aiResult.error ?? 'Could not extract exam data. Please try again.' },
      { status: 500 }
    )
  }

  // 5. Parse JSON
  interface ExamEntry {
    title: string
    subject_code?: string
    subject_name?: string
    date?: string
    day?: string
    start_time?: string
    end_time?: string
    session?: string
    venue?: string
    type?: string
    exam_type?: string
    priority?: string
    marks?: string
    notes?: string
  }
  interface ExamScheduleData {
    extracted: boolean
    document_type?: string
    institution?: string
    semester?: string
    entries: ExamEntry[]
    confidence?: string
    notes?: string
    reason?: string
  }

  const parseResult = parseAIJson<ExamScheduleData>(aiResult.content)
  if (!parseResult.success || !parseResult.data) {
    return NextResponse.json(
      { error: 'Could not parse schedule data. Please try a different file.' },
      { status: 500 }
    )
  }

  const scheduleData = parseResult.data
  console.log('[ExamSchedule API] Extracted:', scheduleData.extracted,
    '| Entries:', scheduleData.entries?.length ?? 0)

  if (!scheduleData.extracted || !scheduleData.entries?.length) {
    return NextResponse.json({
      success: false,
      extracted: false,
      message: scheduleData.reason
        ?? 'No exam or schedule data found in this document. '
        + 'Try a clearer photo or a different format.',
      confidence: scheduleData.confidence
    })
  }

  // 6. Store valid entries in Supabase
  const validEntries = scheduleData.entries.filter(e => e.title && e.date)
  console.log('[ExamSchedule API] Valid entries to store:', validEntries.length)

  if (validEntries.length > 0) {
    // Writes go through the service role: the anon cookie client is subject to
    // RLS, which silently rejected these inserts in production.
    const db = createServiceRoleClient()

    // Delete existing entries for this user first (full replace)
    await db
      .from('schedule_exams')
      .delete()
      .eq('user_id', user.id)

    // Insert new entries. subject_name/venue map onto the table's existing
    // subject/location columns; the rest are dedicated columns.
    const rows = validEntries.map(entry => ({
      user_id: user.id,
      title: entry.title,
      subject_code: entry.subject_code ?? null,
      subject: entry.subject_name ?? entry.subject_code ?? null,
      date: entry.date ?? null,
      day_of_week: entry.day ?? null,
      start_time: entry.start_time ?? null,
      end_time: entry.end_time ?? null,
      session: entry.session ?? null,
      location: entry.venue ?? null,
      type: entry.type ?? 'exam',
      exam_type: entry.exam_type ?? 'internal',
      priority: entry.priority ?? 'medium',
      marks: entry.marks ?? null,
      notes: entry.notes ?? null,
      institution: scheduleData.institution ?? null,
      semester: scheduleData.semester ?? null
    }))

    const { error: dbError } = await db
      .from('schedule_exams')
      .insert(rows)

    if (dbError) {
      console.error('[ExamSchedule API] DB insert error:', dbError.message, dbError.code, dbError.details)
      return NextResponse.json(
        { error: 'Extracted the schedule but failed to save it. Please try again.' },
        { status: 500 }
      )
    }

    // Also insert into tasks table so exams immediately appear on Priority Feed / Calendar
    const taskRows = validEntries.map(e => ({
      user_id: user.id,
      type: e.type && ['exam', 'assignment', 'manual'].includes(e.type) ? e.type : 'exam',
      title: e.title || (e.subject_name ? `${e.subject_name} Exam` : 'Exam'),
      subject: e.subject_name || e.subject_code || null,
      due_at: e.date ? (e.start_time ? `${e.date}T${e.start_time}:00` : `${e.date}T09:00:00`) : null,
      weightage: e.marks ? parseInt(String(e.marks), 10) || null : null,
      notes: [e.venue ? `Venue: ${e.venue}` : '', e.session ? `Session: ${e.session}` : '', e.notes || ''].filter(Boolean).join(' · ') || null,
      source: 'exam_upload',
      completed: false,
    }));

    if (taskRows.length > 0) {
      const { error: taskError } = await db.from('tasks').insert(taskRows);
      if (taskError) {
        console.error('[ExamSchedule] tasks insert error:', taskError.message, taskError.code, taskError.details);
      }
    }
  }

  console.log('[ExamSchedule API] === Success ===')
  return NextResponse.json({
    success: true,
    extracted: true,
    entryCount: validEntries.length,
    institution: scheduleData.institution,
    semester: scheduleData.semester,
    documentType: scheduleData.document_type,
    confidence: scheduleData.confidence,
    entries: validEntries,
    message: `Found ${validEntries.length} exam${validEntries.length === 1 ? '' : 's'} and deadlines`
  })
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await createServiceRoleClient()
      .from('schedule_exams')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('[ExamSchedule API] DB Fetch Error:', error);
      return NextResponse.json({ error: 'Failed to fetch exam schedule' }, { status: 500 });
    }

    // Map DB rows back to ExamEntry format
    const entries = data.map(row => ({
      title: row.title,
      subject_code: row.subject_code,
      subject_name: row.subject,
      date: row.date,
      day: row.day_of_week,
      start_time: row.start_time,
      end_time: row.end_time,
      session: row.session,
      venue: row.location,
      type: row.type,
      exam_type: row.exam_type,
      priority: row.priority,
      marks: row.marks,
      notes: row.notes,
    }));

    return NextResponse.json({ entries });
  } catch (error: any) {
    console.error('[ExamSchedule API] GET API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
