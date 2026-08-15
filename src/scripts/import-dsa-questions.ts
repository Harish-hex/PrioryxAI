import * as XLSX from 'xlsx'
import * as fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Run with: npx ts-node src/scripts/import-dsa-questions.ts

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function importDSAQuestions(filePath: string) {
  console.log('Reading Excel file:', filePath)
  const buffer = fs.readFileSync(filePath)
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[]

  console.log(`Found ${rows.length} rows`)
  console.log('Columns:', Object.keys(rows[0] ?? {}))

  // Map Excel columns to DB schema
  // Adjust column names based on your actual Excel headers:
  const questions = rows.map((row, i) => ({
    id: crypto.randomUUID(),
    title: String(row['Problem Name'] ?? row['Title'] ?? row['Question'] ?? `Question ${i + 1}`),
    topic: String(row['Topic'] ?? row['Category'] ?? row['Tag'] ?? 'General'),
    difficulty: normaliseDifficulty(
      String(row['Difficulty'] ?? row['Level'] ?? 'Medium')
    ),
    platform: String(row['Platform'] ?? row['Source'] ?? 'LeetCode'),
    problem_url: String(row['URL'] ?? row['Link'] ?? row['LeetCode Link'] ?? ''),
    companies: parseCompanies(row['Companies'] ?? row['Asked By'] ?? ''),
    frequency: Number(row['Frequency'] ?? row['Times Asked'] ?? 0),
    acceptance_rate: Number(row['Acceptance Rate'] ?? row['Acceptance'] ?? 0),
    notes: String(row['Notes'] ?? row['Hint'] ?? ''),
    is_important: String(row['Important'] ?? '').toLowerCase() === 'yes'
      || String(row['Priority'] ?? '').toLowerCase() === 'high',
    created_at: new Date().toISOString()
  }))

  console.log('Sample question:', questions[0])

  // Batch insert (100 at a time)
  const BATCH = 100
  let inserted = 0
  for (let i = 0; i < questions.length; i += BATCH) {
    const batch = questions.slice(i, i + BATCH)
    const { error } = await supabase
      .from('dsa_questions')
      .upsert(batch, { onConflict: 'title,platform' })

    if (error) {
      console.error(`Batch ${i}-${i + BATCH} error:`, error)
    } else {
      inserted += batch.length
      console.log(`Inserted ${inserted}/${questions.length}`)
    }
  }

  console.log('Import complete!')
}

function normaliseDifficulty(raw: string): 'Easy' | 'Medium' | 'Hard' {
  const lower = raw.toLowerCase().trim()
  if (lower.includes('easy') || lower === 'e' || lower === '1') return 'Easy'
  if (lower.includes('hard') || lower === 'h' || lower === '3') return 'Hard'
  return 'Medium'
}

function parseCompanies(raw: unknown): string[] {
  if (!raw) return []
  const str = String(raw)
  return str.split(/[,;|]/).map(s => s.trim()).filter(Boolean)
}

import path from 'path';
const defaultFilePath = path.join(process.cwd(), 'assets', 'Curious Freaks Coding Sheet.xlsx');
const targetFilePath = process.env.FILE_PATH || defaultFilePath;

importDSAQuestions(targetFilePath);
