import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  // Auth check
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

  // Download from Supabase Storage using service role
  const serviceClient = createServiceClient();
  const { data: fileBlob, error: downloadError } = await serviceClient.storage
    .from('schedules')
    .download(storagePath);

  if (downloadError || !fileBlob) {
    console.error('[schedule/process-exam] Storage download error:', downloadError);
    return NextResponse.json({ error: 'Failed to download file from storage' }, { status: 500 });
  }

  // Convert to base64
  const arrayBuffer = await fileBlob.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  console.log('[schedule/process-exam] Sending to GPT-4o, size:', arrayBuffer.byteLength);

  // Send to OpenAI GPT-4o vision for exam extraction
  let parsedData: any = null;
  try {
    const result = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64}`,
                detail: 'high',
              },
            },
            {
              type: 'text',
              text: `Extract all exams, tests, and assignment deadlines from this image as JSON.
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

Format dates explicitly as YYYY-MM-DD.`,
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    const rawContent = result.choices[0]?.message?.content ?? '';
    const cleaned = rawContent
      .replace(/^```json\s*/m, '')
      .replace(/^```\s*/m, '')
      .replace(/```\s*$/m, '')
      .trim();

    try {
      parsedData = JSON.parse(cleaned);
    } catch {
      const jsonMatch = rawContent.match(/(\{[\s\S]*\})/)?.[0];
      if (jsonMatch) parsedData = JSON.parse(jsonMatch);
      else {
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
  await serviceClient
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
    )
    .then(res => res, (e: any) => console.warn('[schedule/process-exam] DB upsert warning:', e?.message));

  return NextResponse.json({
    success: true,
    entries,
    entryCount: entries.length,
    events: entries,
  });
}
