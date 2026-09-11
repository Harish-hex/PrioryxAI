export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const TIMETABLE_PROMPT = `Extract the complete weekly class schedule as JSON.
Return ONLY valid JSON, no markdown, no code fences.

Schema:
{
  "schedule": [
    {
      "day": "Monday",
      "slots": [
        { "time": "9:00 AM - 10:00 AM", "subject": "Mathematics", "room": "A101", "type": "Lecture" }
      ]
    }
  ]
}

Days should be Monday through Saturday. Include ALL subjects visible.
For each slot include: time (exact), subject name, room if visible, type (Lecture/Lab/Tutorial/Break).`;

function getMimeFromPath(p: string): string {
  const ext = p.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (ext === 'doc') return 'application/msword';
  if (ext === 'txt') return 'text/plain';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

export async function POST(req: NextRequest) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 50000,
    maxRetries: 1,
  });

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { storagePath?: string; userId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { storagePath } = body;
  if (!storagePath) {
    return NextResponse.json({ error: 'storagePath is required' }, { status: 400 });
  }

  console.log('[schedule/process-timetable] Downloading from storage:', storagePath);

  const serviceClient = createServiceClient();
  const { data: fileBlob, error: downloadError } = await serviceClient.storage
    .from('schedules')
    .download(storagePath);

  if (downloadError || !fileBlob) {
    console.error('[schedule/process-timetable] Storage download error:', downloadError);
    return NextResponse.json({ error: 'Failed to download file from storage' }, { status: 500 });
  }

  const arrayBuffer = await fileBlob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = getMimeFromPath(storagePath);
  const isImage = mimeType.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';
  const isDocx = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const isDoc = mimeType === 'application/msword';
  const isText = mimeType === 'text/plain';

  console.log('[schedule/process-timetable] File type:', mimeType, '| size:', buffer.length);

  let extractedText = '';
  if (isPdf) {
    try {
      const pdfParseModule = await import('pdf-parse');
      const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;
      const parsed = await pdfParse(buffer);
      extractedText = parsed.text ?? '';
    } catch (e) {
      console.error('[schedule/process-timetable] pdf-parse failed:', e);
    }
  } else if (isDocx) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    extractedText = result.value ?? '';
  } else if (isDoc) {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value ?? '';
    } catch {
      return NextResponse.json({ error: 'Could not read this DOC file. Try PDF or a photo.' }, { status: 400 });
    }
  } else if (isText) {
    extractedText = buffer.toString('utf-8');
  }

  // Fall back to vision for images, or for PDFs where text extraction found too little
  // (scanned PDF) — matches the threshold used for resume parsing in file-processor.ts.
  const needsVision = isImage || (isPdf && extractedText.trim().length < 100);

  console.log('[schedule/process-timetable] Sending to GPT-4o, size:', buffer.length, '| vision:', needsVision);

  let parsedData: any = null;
  try {
    let rawContent = '';

    if (needsVision && isPdf) {
      // OpenAI's image_url content type only accepts png/jpeg/webp/gif, not PDF —
      // scanned PDFs must go through the Responses API's input_file type instead.
      const result = await (openai as any).responses.create({
        model: 'gpt-4o',
        max_output_tokens: 3000,
        input: [{ role: 'user', content: [
          { type: 'input_text', text: TIMETABLE_PROMPT + '\n\nRespond with valid JSON only.' },
          { type: 'input_file', filename: 'timetable.pdf', file_data: `data:application/pdf;base64,${buffer.toString('base64')}` },
        ] }],
      });
      rawContent = result.output_text ?? '';
    } else {
      const messages: any[] = needsVision
        ? [{ role: 'user', content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${buffer.toString('base64')}`, detail: 'high' } },
            { type: 'text', text: TIMETABLE_PROMPT },
          ] }]
        : [{ role: 'user', content: `${TIMETABLE_PROMPT}\n\nSchedule document:\n\n${extractedText.slice(0, 60000)}` }];

      const result = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      });
      rawContent = result.choices[0]?.message?.content ?? '';
    }

    try {
      parsedData = JSON.parse(rawContent);
    } catch {
      const stripped = rawContent.replace(/^```json\s*/i, '').replace(/^```\s*/m, '').replace(/```\s*$/m, '').trim();
      try {
        parsedData = JSON.parse(stripped);
      } catch {
        console.error('[schedule/process-timetable] Parse failed:', rawContent.slice(0, 300));
        return NextResponse.json({ error: 'Could not extract schedule. Try a clearer image.' }, { status: 422 });
      }
    }
  } catch (aiErr: any) {
    console.error('[schedule/process-timetable] OpenAI error:', aiErr);
    return NextResponse.json({ error: 'AI extraction failed: ' + (aiErr.message ?? 'unknown') }, { status: 500 });
  }

  // Flatten into entries array for compatibility with existing components
  const entries: Array<{ day: string; time: string; subject: string; room?: string; type?: string }> = [];
  if (Array.isArray(parsedData?.schedule)) {
    for (const dayObj of parsedData.schedule) {
      for (const slot of (dayObj.slots ?? [])) {
        entries.push({ day: dayObj.day, time: slot.time, subject: slot.subject, room: slot.room, type: slot.type });
      }
    }
  }

  console.log('[schedule/process-timetable] Entries found:', entries.length);

  // Upsert to user_timetables table
  const { error: upsertError } = await serviceClient
    .from('user_timetables')
    .upsert(
      {
        user_id: user.id,
        storage_path: storagePath,
        schedule_data: parsedData,
        entries,
        extracted_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (upsertError) {
    console.error('[schedule/process-timetable] DB upsert failed:', upsertError.message);
    return NextResponse.json(
      { success: false, error: 'Extracted the timetable but failed to save it. Please try again.' },
      { status: 500 }
    );
  }

  // Also replace-insert into schedule_timetable so the priority/feed engine
  // (which only reads schedule_timetable, not user_timetables) picks this up.
  if (entries.length > 0) {
    const timeParts = (time: string): { start: string | null; end: string | null } => {
      const [start, end] = time.split(/-|–|to/i).map((s) => s.trim());
      return { start: start || null, end: end || start || null };
    };

    const inserts = entries.map((entry) => {
      const { start, end } = timeParts(entry.time ?? '');
      return {
        user_id: user.id,
        subject: entry.subject,
        day: entry.day,
        start_time: start,
        end_time: end,
        location: entry.room ?? null,
        type: (entry.type ?? 'lecture').toLowerCase(),
      };
    });

    const { error: deleteError } = await serviceClient.from('schedule_timetable').delete().eq('user_id', user.id);
    if (deleteError) {
      console.warn('[schedule/process-timetable] schedule_timetable delete warning:', deleteError.message);
    }
    const { error: insertError } = await serviceClient.from('schedule_timetable').insert(inserts);
    if (insertError) {
      console.warn('[schedule/process-timetable] schedule_timetable insert warning:', insertError.message);
    }
  }

  return NextResponse.json({
    success: true,
    entries,
    entryCount: entries.length,
    schedule: parsedData?.schedule ?? [],
  });
}
