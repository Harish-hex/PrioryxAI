export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // The "Curious Freaks" sheet has 14 rows of intro text before the actual header.
    // range: 14 skips the first 14 rows (0-indexed)
    const rows = XLSX.utils.sheet_to_json(sheet, { range: 14 }) as Record<string, unknown>[];

    const questions = rows.map((row, i) => ({
      id: crypto.randomUUID(),
      title: String(row['Problem'] ?? row['Problem Name'] ?? row['Title'] ?? row['Question'] ?? `Question ${i + 1}`),
      topic: String(row['TOPIC'] ?? row['Topic'] ?? row['Category'] ?? row['Tag'] ?? 'General'),
      difficulty: normaliseDifficulty(
        String(row['Difficulty'] ?? row['Level'] ?? 'Medium')
      ),
      platform: String(row['Platform'] ?? row['Source'] ?? 'LeetCode'),
      problem_url: String(row['Problem link'] ?? row['URL'] ?? row['Link'] ?? row['LeetCode Link'] ?? ''),
      companies: parseCompanies(row['Companies'] ?? row['Asked By'] ?? ''),
      frequency: Number(row['Frequency'] ?? row['Times Asked'] ?? 0),
      acceptance_rate: Number(row['Acceptance Rate'] ?? row['Acceptance'] ?? 0),
      notes: String(row['Notes'] ?? row['Hint'] ?? ''),
      is_important: String(row['Important'] ?? '').toLowerCase() === 'yes'
        || String(row['Priority'] ?? '').toLowerCase() === 'high',
      created_at: new Date().toISOString()
    }));

    const supabase = createClient();
    const BATCH = 100;
    let inserted = 0;
    
    for (let i = 0; i < questions.length; i += BATCH) {
      const batch = questions.slice(i, i + BATCH);
      const { error } = await supabase
        .from('dsa_questions')
        .upsert(batch, { onConflict: 'title,platform' });

      if (error) {
        console.error(`Batch ${i}-${i + BATCH} error:`, error);
        return NextResponse.json({ error: `Batch error: ${error.message}` }, { status: 500 });
      } else {
        inserted += batch.length;
      }
    }

    return NextResponse.json({ message: `Successfully imported ${inserted} questions.` });
  } catch (err: any) {
    console.error('Import error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

function normaliseDifficulty(raw: string): 'Easy' | 'Medium' | 'Hard' {
  const lower = raw.toLowerCase().trim();
  if (lower.includes('easy') || lower === 'e' || lower === '1') return 'Easy';
  if (lower.includes('hard') || lower === 'h' || lower === '3') return 'Hard';
  return 'Medium';
}

function parseCompanies(raw: unknown): string[] {
  if (!raw) return [];
  const str = String(raw);
  return str.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
}
