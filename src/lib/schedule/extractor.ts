import mammoth from 'mammoth';
import { readFile, extractWithAI, parseAIJson } from '../file-processor';

export type UploadType = 'timetable' | 'exam_schedule';
export type FileType = 'pdf' | 'image' | 'docx';

export interface TimetableEntry {
  subject: string;
  day: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  type: string;
}

export interface ExamEntry {
  title: string;
  subject: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  type: string;
  priority: string;
}

export interface ExtractionResult {
  success: boolean;
  type: UploadType;
  entries: TimetableEntry[] | ExamEntry[];
  confidence: 'high' | 'medium' | 'low';
  rawResponse?: string;
  error?: string;
}

const TIMETABLE_PROMPT = `You are extracting a weekly class timetable from a student's schedule image or
document. Extract every class session you can find.

Return ONLY valid JSON with this exact structure — no markdown, no explanation:
{
  "type": "timetable",
  "extracted": true,
  "entries": [
    {
      "subject": "Data Structures",
      "day": "Monday",
      "startTime": "09:00",
      "endTime": "10:00",
      "location": "Room 301",
      "type": "lecture"
    }
  ],
  "confidence": "high|medium|low",
  "notes": "any issues or assumptions made"
}

Rules:
- day must be: Monday/Tuesday/Wednesday/Thursday/Friday/Saturday/Sunday
- startTime and endTime in 24hr format HH:MM
- type: "lecture" | "lab" | "tutorial" | "practical"
- location: extract if visible, else null
- If no timetable data found, return { "type": "timetable", "extracted": false, "entries": [], "reason": "explain why" }
- Do NOT return markdown. Return raw JSON only.`;

const EXAM_PROMPT = `You are extracting exam dates, assignment deadlines, and lab submission dates
from a student's academic schedule document or image. The document may be a complex Indian university schedule layout with merged cells, multiple columns (e.g. branch codes, paper codes, semester numbers), and erratic formatting.

Return ONLY valid JSON with this exact structure — no markdown, no explanation:
{
  "type": "exam_schedule",
  "extracted": true,
  "entries": [
    {
      "title": "Data Structures Mid-Term Exam",
      "subject": "Data Structures",
      "date": "2026-08-15",
      "startTime": "10:00",
      "endTime": "13:00",
      "location": "Hall A",
      "type": "exam",
      "priority": "high"
    }
  ],
  "confidence": "high|medium|low",
  "notes": "any issues or assumptions made"
}

Rules:
- date in ISO format YYYY-MM-DD (infer year from context; if unclear use 2026)
- startTime/endTime in 24hr HH:MM format, or null if not shown
- type: "exam" | "assignment" | "lab" | "quiz" | "viva" | "project"
- priority: "high" for exams/finals, "medium" for assignments, "low" for labs
- Extract ALL deadlines and dates visible — even if partially legible. Carefully read row by row and map subjects to dates.
- If no exam/assignment data found, return { "type": "exam_schedule", "extracted": false, "entries": [], "reason": "explain why" }
- Do NOT return markdown. Return raw JSON only.`;

export async function extractSchedule(
  file: Buffer,
  mimeType: string,
  uploadType: UploadType
): Promise<ExtractionResult> {
  const prompt = uploadType === 'timetable' ? TIMETABLE_PROMPT : EXAM_PROMPT;
  
  // Use the new file-processor which handles text, docx, image, and pdf
  const readResult = await readFile(file, mimeType, 'schedule-file');
  
  if (!readResult.success) {
    return { success: false, type: uploadType, entries: [], confidence: 'low', error: readResult.error };
  }

  const aiResult = await extractWithAI(readResult, prompt, 'Extract schedule from this content:', 2000);
  
  if (!aiResult.success) {
    return { success: false, type: uploadType, entries: [], confidence: 'low', error: aiResult.error || 'AI extraction failed' };
  }
  
  const parseResult = parseAIJson<any>(aiResult.content);
  
  if (!parseResult.success || !parseResult.data) {
    return { success: false, type: uploadType, entries: [], confidence: 'low', error: 'Could not parse schedule data' };
  }
  
  const scheduleData = parseResult.data;
  
  if (scheduleData.extracted === false) {
    return { success: false, type: uploadType, entries: [], confidence: 'low', error: scheduleData.reason || 'No entries found' };
  }
  
  if (!scheduleData.entries || !Array.isArray(scheduleData.entries)) {
    return { success: false, type: uploadType, entries: [], confidence: 'low', error: 'Invalid JSON structure: missing entries array' };
  }
  
  return {
    success: true,
    type: uploadType,
    entries: scheduleData.entries,
    confidence: scheduleData.confidence || 'medium',
    rawResponse: process.env.NODE_ENV === 'development' ? aiResult.content : undefined
  };
}
