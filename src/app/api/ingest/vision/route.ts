import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';
import { checkRateLimit, visionRatelimit, visionRatelimitPro } from '@/lib/redis';

export const runtime = 'nodejs';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check pro status for rate limit tier
  const { data: userData } = await supabase
    .from('users')
    .select('pro_status')
    .eq('id', user.id)
    .single();
  const isPro = userData?.pro_status ?? false;

  // Rate limit — 3/day free, 10/day pro — fail closed
  const limiter = isPro ? visionRatelimitPro : visionRatelimit;
  const rl = await checkRateLimit(limiter, user.id);
  if (rl.blocked) {
    if (rl.reason === 'redis_error') {
      return NextResponse.json({ error: 'Service temporarily unavailable. Try again shortly.' }, { status: 503 });
    }
    return NextResponse.json(
      { error: isPro ? 'Vision limit reached (10/day)' : 'Vision limit reached (3/day for free users)' },
      { status: 429 }
    );
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // MIME type check
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, WebP, or HEIC.' }, { status: 400 });
  }

  // Size check
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString('base64');
  const mimeType = file.type === 'image/heic' ? 'image/jpeg' : file.type;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' },
            },
            {
              type: 'text',
              text: `You are parsing a student's timetable or schedule image.
Extract ALL exams and assignments visible. Return ONLY a JSON array, no explanation.
Each item must have:
{
  "type": "exam" | "assignment",
  "title": "subject or task name",
  "subject": "subject code or name",
  "due_at": "ISO 8601 datetime (assume current year, use 23:59 if time unknown, null if unclear)",
  "weightage": number or null (percentage if visible)
}
If nothing is found, return [].`,
            },
          ],
        },
      ],
      max_tokens: 1500,
    });

    const raw = response.choices[0].message.content ?? '[]';
    let tasks: any[] = [];
    try {
      // Strip markdown code fences if present
      const cleaned = raw.replace(/```json|```/g, '').trim();
      tasks = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'Failed to parse LLM response' }, { status: 422 });
    }

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ message: 'No tasks found in image', tasks: [] });
    }

    const rows = tasks.map((t: any) => ({
      user_id: user.id,
      type: ['exam', 'assignment'].includes(t.type) ? t.type : 'manual',
      title: String(t.title ?? 'Untitled').slice(0, 300),
      subject: t.subject ? String(t.subject).slice(0, 100) : null,
      due_at: t.due_at ?? null,
      weightage: typeof t.weightage === 'number' ? t.weightage : null,
      source: 'vision',
      completed: false,
    }));

    const { data: inserted, error: dbError } = await supabase
      .from('tasks')
      .insert(rows)
      .select();

    if (dbError) {
      console.error('[ingest/vision] DB error:', dbError);
      return NextResponse.json({ error: 'Failed to save tasks' }, { status: 500 });
    }

    return NextResponse.json({ tasks: inserted });
  } catch (err: any) {
    console.error('[ingest/vision]', err);
    return NextResponse.json({ error: 'Vision processing failed' }, { status: 500 });
  }
}
