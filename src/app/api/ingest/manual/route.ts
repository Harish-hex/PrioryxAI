import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { openai, sanitize } from '@/lib/openai';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const input = sanitize(body.text);

  if (!input) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 });
  }

  const today = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Today is ${today}. You are parsing a student's plain-English task description.
Return ONLY a JSON object with:
{
  "type": "exam" | "assignment" | "job" | "manual",
  "title": "concise task title",
  "subject": "subject name or null",
  "due_at": "ISO 8601 datetime or null (infer from text, assume IST timezone, use 23:59 if time unknown)",
  "weightage": number or null
}
No explanation, just JSON.`,
        },
        { role: 'user', content: input },
      ],
      max_tokens: 300,
    });

    const raw = response.choices[0].message.content ?? '{}';
    let task: any = {};
    try {
      task = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      // Fallback: save as manual task with original text as title
      task = { type: 'manual', title: input.slice(0, 200), subject: null, due_at: null, weightage: null };
    }

    const row = {
      user_id: user.id,
      type: ['exam', 'assignment', 'job', 'manual'].includes(task.type) ? task.type : 'manual',
      title: String(task.title ?? input).slice(0, 300),
      subject: task.subject ? String(task.subject).slice(0, 100) : null,
      due_at: task.due_at ?? null,
      weightage: typeof task.weightage === 'number' ? task.weightage : null,
      source: 'manual',
      completed: false,
    };

    const { data: inserted, error: dbError } = await supabase
      .from('tasks')
      .insert(row)
      .select()
      .single();

    if (dbError) {
      console.error('[ingest/manual] DB error:', dbError);
      return NextResponse.json({ error: 'Failed to save task' }, { status: 500 });
    }

    return NextResponse.json({ task: inserted });
  } catch (err: any) {
    console.error('[ingest/manual]', err);
    return NextResponse.json({ error: 'Failed to process task' }, { status: 500 });
  }
}
