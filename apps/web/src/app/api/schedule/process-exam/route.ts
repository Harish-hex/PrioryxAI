export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const EXAM_PROMPT = `Extract all exams, tests, and assignment deadlines as JSON.
Return ONLY valid JSON, no markdown, no code fences.

Schema:
{
  "events": [
    {
      "date": "YYYY-MM-DD",
      "subject": "string",
      "type": "string (Exam/Test/Assignment)",
      "time": "string (optional)",
      "venue": "string (optional)"
    }
  ]
}

Format dates explicitly as YYYY-MM-DD.`;

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

  console.log('[schedule/process-exam] Downloading from storage:', storagePath);

  const serviceClient = createServiceClient();
  const { data: fileBlob, error: downloadError } = await serviceClient.storage
    .from('schedules')
    .download(storagePath);

  if (downloadError || !fileBlob) {
    console.error('[schedule/process-exam] Storage download error:', downloadError);
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

  console.log('[schedule/process-exam] File type:', mimeType, '| size:', buffer.length);

  let extractedText = '';
  if (isPdf) {
    try {
      const pdfParseModule = await import('pdf-parse');
      const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;
      const parsed = await pdfParse(buffer);
      extractedText = parsed.text ?? '';
    } catch (e) {
      console.error('[schedule/process-exam] pdf-parse failed:', e);
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

  const needsVision = isImage || (isPdf && extractedText.trim().length < 100);

  console.log('[schedule/process-exam] Sending to GPT-4o, size:', buffer.length, '| vision:', needsVision);

  let parsedData: any = null;
  try {
    let rawContent = '';

    if (needsVision && isPdf) {
      // OpenAI's image_url content type only accepts png/jpeg/webp/gif, not PDF —
      // scanned PDFs must go through the Responses API's input_file type instead.
      const result = await (openai as any).responses.create({
        model: 'gpt-4o',
        max_output_tokens: 2000,
        input: [{ role: 'user', content: [
          { type: 'input_text', text: EXAM_PROMPT + '\n\nRespond with valid JSON only.' },
          { type: 'input_file', filename: 'exam-schedule.pdf', file_data: `data:application/pdf;base64,${buffer.toString('base64')}` },
        ] }],
      });
      rawContent = result.output_text ?? '';
    } else {
      const messages: any[] = needsVision
        ? [{ role: 'user', content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${buffer.toString('base64')}`, detail: 'high' } },
            { type: 'text', text: EXAM_PROMPT },
          ] }]
        : [{ role: 'user', content: `${EXAM_PROMPT}\n\nSchedule document:\n\n${extractedText.slice(0, 60000)}` }];

      const result = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        max_tokens: 2000,
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
        console.error('[schedule/process-exam] Parse failed:', rawContent.slice(0, 300));
        return NextResponse.json({ error: 'Could not extract exams. Try a clearer image.' }, { status: 422 });
      }
    }
  } catch (aiErr: any) {
    console.error('[schedule/process-exam] OpenAI error:', aiErr);
    return NextResponse.json({ error: 'AI extraction failed: ' + (aiErr.message ?? 'unknown') }, { status: 500 });
  }

  const entries = parsedData?.events ?? [];
  console.log('[schedule/process-exam] Entries found:', entries.length);

  // Upsert to user_exam_schedules table
  const { error: upsertError } = await serviceClient
    .from('user_exam_schedules')
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
    console.error('[schedule/process-exam] DB upsert failed:', upsertError.message);
    return NextResponse.json(
      { success: false, error: 'Extracted the exam schedule but failed to save it. Please try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    entries,
    entryCount: entries.length,
    events: entries,
  });
}
