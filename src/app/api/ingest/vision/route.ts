import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';
// redis imports removed — no upload limits on vision

export const runtime = 'nodejs';

const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const ALLOWED_DOC_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];
const ALLOWED_MIME = [...ALLOWED_IMAGE_MIME, ...ALLOWED_DOC_MIME];
const MAX_BYTES = 10 * 1024 * 1024; // 10MB (docs can be larger)

const YEAR = new Date().getFullYear();
const EXTRACT_PROMPT = `You are parsing a student's academic schedule document. It may be any of:
- A FULL-YEAR exam timetable (dozens of entries spread across Jan-Dec)
- A SEMESTER timetable (one term, multiple subjects)
- A WEEKLY class schedule (recurring Mon-Fri slots)
- An assignment/lab submission schedule
- A single exam notice, handout, or circular

CRITICAL RULES:
1. Extract EVERY exam, test, quiz, viva, practical, lab submission, assignment deadline, project deadline, and report due date.
2. If you see months listed (Jan through Dec), extract entries from ALL months, not just the first few.
3. If it is a weekly recurring timetable (Mon/Tue/Wed/Thu/Fri slots), list each unique session as a separate item using its next upcoming date.
4. For PDFs and Word documents, read ALL pages and sections before responding.
5. If there are 40 items, return all 40. Do NOT summarise, group, or skip entries.
6. Use the current year (${YEAR}) when the year is not shown in the document.

Return ONLY a valid JSON array (no explanation, no markdown fences). Each object:
{
  "type": "exam" | "assignment" | "manual",
  "title": "Full descriptive name e.g. 'Database Management Systems End Semester Exam'",
  "subject": "Subject code or short name e.g. 'DBMS' or 'CS6302', or null",
  "due_at": "ISO 8601 datetime. Use T09:00:00 for morning exams, T23:59:00 when time unknown. null ONLY if date is completely absent.",
  "weightage": number or null,
  "notes": "Room number, hall, duration, instructions, or any other relevant detail. null if none."
}

Type rules:
- "exam" -> end-semester, mid-semester, internal test, quiz, viva, practical exam, lab exam
- "assignment" -> submission deadlines, lab records, project milestones, reports, presentations
- "manual" -> any other schedule entry worth tracking

If nothing extractable is found, return [].`;

async function extractFromText(text: string): Promise<any[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: EXTRACT_PROMPT },
      { role: 'user', content: `Document text (read ALL of it before responding):\n\n${text.slice(0, 16000)}` },
    ],
    max_tokens: 6000,
  });
  return parseTasksFromRaw(response.choices[0].message.content ?? '[]');
}

async function extractFromImage(base64: string, mimeType: string): Promise<any[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' } },
          { type: 'text', text: EXTRACT_PROMPT },
        ],
      },
    ],
    max_tokens: 6000,
  });
  return parseTasksFromRaw(response.choices[0].message.content ?? '[]');
}

function parseTasksFromRaw(raw: string): any[] {
  const cleaned = raw.replace(/```json|```/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Use pdf-parse if available, otherwise extract raw text via OpenAI file API
  // Fallback: convert to base64 and treat as image (GPT-4o can read PDFs via vision)
  // We pass as image using the PDF base64 trick — GPT-4o handles PDFs natively
  return ''; // signals caller to use vision path instead
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // No upload limits — schedule extraction is available to all users

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const isImage = ALLOWED_IMAGE_MIME.includes(file.type);
  const isDoc = ALLOWED_DOC_MIME.includes(file.type);

  if (!isImage && !isDoc) {
    return NextResponse.json(
      { error: 'Invalid file type. Use JPG, PNG, WebP, HEIC, PDF, DOC, DOCX, or TXT.' },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    let tasks: any[] = [];

    if (isImage || file.type === 'application/pdf') {
      // Images + PDFs → vision path (GPT-4o reads PDFs natively as images)
      const mimeType = file.type === 'image/heic' ? 'image/jpeg' : file.type;
      const base64 = buffer.toString('base64');
      tasks = await extractFromImage(base64, mimeType);
    } else if (file.type === 'text/plain') {
      // Plain text → text extraction path
      const text = buffer.toString('utf-8');
      tasks = await extractFromText(text);
    } else {
      // DOC/DOCX — extract text content as base64 and use vision
      // GPT-4o can process DOCX as raw content; treat as binary → base64
      const base64 = buffer.toString('base64');
      tasks = await extractFromImage(base64, file.type);
    }

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ message: 'No tasks found in the document', tasks: [] });
    }

    const rows = tasks.map((t: any) => ({
      user_id: user.id,
      type: ['exam', 'assignment', 'manual'].includes(t.type) ? t.type : 'manual',
      title: String(t.title ?? 'Untitled').slice(0, 300),
      subject: t.subject ? String(t.subject).slice(0, 100) : null,
      due_at: t.due_at ?? null,
      weightage: typeof t.weightage === 'number' ? t.weightage : null,
      notes: t.notes ? String(t.notes).slice(0, 500) : null,
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
    return NextResponse.json({ error: 'Failed to process file. Try a clearer image or a different format.' }, { status: 500 });
  }
}
