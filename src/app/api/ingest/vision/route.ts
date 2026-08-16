import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';
import { ensureSchemaMigrations, errorMentionsColumn } from '@/lib/schema-migrations';
// pdf-parse and mammoth are loaded dynamically to avoid webpack bundling issues in Next.js

export const runtime = 'nodejs';

const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

const YEAR = new Date().getFullYear();

const EXTRACT_PROMPT = `You are parsing a student's academic schedule document. It may be any of:
- A FULL-YEAR academic/exam calendar (dozens of entries across all 12 months)
- A SEMESTER exam timetable (one term, multiple subjects)
- A WEEKLY class schedule (recurring Mon–Fri slots)
- An assignment/lab submission schedule
- A single exam notice, circular, or handout

CRITICAL RULES:
1. Extract EVERY exam, test, quiz, viva, practical, lab submission, assignment deadline, project milestone, and report due date you can find.
2. If the document has months listed (Jan–Dec), extract events from ALL months — never stop at the first few.
3. If it is a weekly recurring timetable (Mon/Tue/Wed slots), produce one entry per unique subject/session using its next upcoming date from today.
4. Read every section, table row, and footnote before responding. Miss nothing.
5. If there are 50 events, return all 50. Do NOT summarise, group, truncate, or skip entries.
6. Use the current year (${YEAR}) when the year is not printed in the document. Prefer the next upcoming date if month/day is ambiguous.
7. Academic calendars often list events like "Internal Assessment I – 14 to 20 Sep". Create one entry for the START date.

Return ONLY a valid JSON array — no explanation, no markdown fences, no comments. Each object:
{
  "type": "exam" | "assignment" | "manual",
  "title": "Full descriptive name e.g. 'Database Management Systems — End Semester Exam'",
  "subject": "Subject code or short name e.g. 'DBMS' or 'CS6302', or null",
  "due_at": "ISO 8601 datetime string. Use T09:00:00 for morning exams, T23:59:00 when time unknown. null ONLY if date is completely absent.",
  "weightage": number or null,
  "notes": "Room, hall, duration, venue, instructions, or any other detail. null if none."
}

Type rules:
- "exam"       → end-semester exam, mid-semester exam, internal assessment/test, quiz, viva, practical exam, lab exam
- "assignment" → submission deadlines, lab records, project milestones, reports, presentations
- "manual"     → holidays with exams, study holidays, result dates, or any other trackable academic event

If absolutely nothing extractable is found, return [].`;

// ── Text path (PDFs, DOCXs, TXTs extracted to plain text) ─────────────────────
async function extractFromText(text: string): Promise<any[]> {
  // Chunk large documents: GPT-4o context window is ~128k tokens, but we cap at ~60k chars for reliability
  const CHUNK = 60_000;
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK) {
    chunks.push(text.slice(i, i + CHUNK));
  }

  const allTasks: any[] = [];
  for (const chunk of chunks) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: EXTRACT_PROMPT },
        {
          role: 'user',
          content: `Academic calendar / schedule text (read ALL of it before responding):\n\n${chunk}`,
        },
      ],
      max_tokens: 8000,
      temperature: 0,
    });
    const tasks = parseTasksFromRaw(response.choices[0].message.content ?? '[]');
    allTasks.push(...tasks);
  }

  // Deduplicate by title + due_at
  const seen = new Set<string>();
  return allTasks.filter((t) => {
    const key = `${String(t.title).toLowerCase()}|${t.due_at ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Vision path (images only) ─────────────────────────────────────────────────
async function extractFromImage(base64: string, mimeType: string): Promise<any[]> {
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
          { type: 'text', text: EXTRACT_PROMPT },
        ],
      },
    ],
    max_tokens: 8000,
    temperature: 0,
  });
  return parseTasksFromRaw(response.choices[0].message.content ?? '[]');
}

function parseTasksFromRaw(raw: string): any[] {
  const cleaned = raw.replace(/```json\s*|```/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Try to extract the first JSON array from a mixed response
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      try { return JSON.parse(match[0]); } catch {}
    }
    return [];
  }
}

function getNormalizedMimeType(file: File) {
  const rawMime = file.type?.toLowerCase();
  if (rawMime === 'image/jpg') return 'image/jpeg';
  if (rawMime) return rawMime;

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'image/jpeg';
  if (lowerName.endsWith('.png')) return 'image/png';
  if (lowerName.endsWith('.webp')) return 'image/webp';
  if (lowerName.endsWith('.pdf')) return 'application/pdf';
  if (lowerName.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (lowerName.endsWith('.doc')) return 'application/msword';
  if (lowerName.endsWith('.txt')) return 'text/plain';

  return '';
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData: any = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const mimeType = getNormalizedMimeType(file);
  const lowerName = file.name.toLowerCase();
  const isHeic = mimeType === 'image/heic' || lowerName.endsWith('.heic') || lowerName.endsWith('.heif');
  const isImage = ALLOWED_IMAGE_MIME.includes(mimeType);
  const isPdf = mimeType === 'application/pdf';
  const isDocx = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const isDoc = mimeType === 'application/msword';
  const isText = mimeType === 'text/plain';

  if (isHeic) {
    return NextResponse.json(
      { error: 'HEIC images are not supported yet. Please convert the file to JPG or PNG and upload it again.' },
      { status: 400 }
    );
  }

  if (!isImage && !isPdf && !isDocx && !isDoc && !isText) {
    return NextResponse.json(
      { error: 'Invalid file type. Use JPG, PNG, WebP, PDF, DOCX, DOC, or TXT.' },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large. Max 20 MB.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    let tasks: any[] = [];

    if (isImage) {
      // Pure images → GPT-4o vision
      tasks = await extractFromImage(buffer.toString('base64'), mimeType);

    } else if (isPdf) {
      // PDF → extract text with pdf-parse (dynamic import avoids webpack crash)
      let extractedText = '';
      try {
        const pdfParseModule = await import('pdf-parse');
        const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;
        const parsed = await pdfParse(buffer);
        extractedText = parsed.text ?? '';
      } catch (pdfErr) {
        console.error('[vision] pdf-parse failed:', pdfErr);
      }

      if (extractedText.trim().length > 50) {
        tasks = await extractFromText(extractedText);
      } else {
        return NextResponse.json(
          { error: 'This PDF looks like a scanned image. Please upload a clear photo of it or export it as a text-based PDF.' },
          { status: 400 }
        );
      }

    } else if (isDocx) {
      // DOCX → mammoth text extraction (dynamic import)
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value ?? '';
      if (text.trim().length <= 20) {
        return NextResponse.json(
          { error: 'This Word document has no readable text. Export it as PDF or upload a screenshot/photo instead.' },
          { status: 400 }
        );
      }
      tasks = await extractFromText(text);

    } else if (isDoc) {
      // Legacy .doc — try mammoth, fallback to vision
      try {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        const text = result.value ?? '';
        if (text.trim().length <= 20) {
          return NextResponse.json(
            { error: 'This DOC file could not be read cleanly. Please upload a photo, PDF, or DOCX version instead.' },
            { status: 400 }
          );
        }
        tasks = await extractFromText(text);
      } catch {
        return NextResponse.json(
          { error: 'This DOC file could not be parsed. Please convert it to PDF or upload a screenshot/photo instead.' },
          { status: 400 }
        );
      }

    } else if (isText) {
      tasks = await extractFromText(buffer.toString('utf-8'));
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

    let { data: inserted, error: dbError } = await supabase
      .from('tasks')
      .insert(rows)
      .select();

    // If notes column doesn't exist yet, retry without it
    if (errorMentionsColumn(dbError, 'notes')) {
      console.warn('[ingest/vision] notes column missing — retrying without it');
      const rowsWithoutNotes = rows.map(({ notes: _notes, ...rest }) => rest);
      ({ data: inserted, error: dbError } = await supabase
        .from('tasks')
        .insert(rowsWithoutNotes)
        .select());
    }

    if (dbError) {
      console.error('[ingest/vision] DB error:', dbError);
      return NextResponse.json({ error: 'Failed to save tasks.' }, { status: 500 });
    }

    return NextResponse.json({ tasks: inserted });
  } catch (err: any) {
    console.error('[ingest/vision]', err);
    return NextResponse.json(
      { error: 'Failed to process file. Try a clearer image or different format.' },
      { status: 500 }
    );
  }
}
