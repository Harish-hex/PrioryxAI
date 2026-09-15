/**
 * One-off script: parse "Companies wise DSA" PDFs into apps/web/scripts/company-dsa.json
 * so it can be reviewed before being upserted into Supabase `dsa_questions`.
 *
 * Usage: npx tsx apps/web/scripts/import-company-dsa.ts
 */
import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";

const SOURCE_DIR = path.resolve(__dirname, "../../../Companies wise DSA");
const OUTPUT_FILE = path.resolve(__dirname, "company-dsa.json");

const FILE_TO_COMPANY: Record<string, string> = {
  "Accenture previous DSA Year Questions .pdf": "Accenture",
  "Capgemini Previous Year DSA Questions .pdf": "Capgemini",
  "Deloitte Previous Year DSA Questions .pdf": "Deloitte",
  "Facebook Previous DSA Year Questions .pdf": "Facebook",
  "Google Previous Year DSA Questions .pdf": "Google",
  "Infosys Previous Year DSA Questions .pdf": "Infosys",
  "LMTmindtree Previous DSA Year Questions .pdf": "LTIMindtree",
  "Microsoft Previous Year DSA Questions .pdf": "Microsoft",
  "PayPal Previous Year DSA Questions .pdf": "PayPal",
  "TCS Previous Year DSA Questions .pdf": "TCS",
  "Uber Previous Year DSA Questions .pdf": "Uber",
};

// Base topic names recognized across all 11 PDFs' varying header styles
// ("Arrays", "ARRAYS (10 Questions)", "Arrays - Important Questions", "Arrays & Strings", ...).
const BASE_TOPICS = [
  "Arrays & Strings", "Arrays and Strings", "Arrays", "Strings", "Linked List", "Stack", "Queue",
  "Binary Search Tree", "Trees", "BST", "Dynamic Programming", "Backtracking & Trie",
  "Advanced Backtracking & Trie", "Advanced Backtracking", "Backtracking", "Trie",
  "Graphs", "Graph", "Heap", "Hashing", "Hash Table", "Two Pointers", "Sliding Window",
  "Greedy", "Bit Manipulation", "Recursion", "Sorting", "Searching", "Math", "Matrix",
  "Binary Tree", "Binary Search", "Design",
];

function normalizeTopicHeader(line: string): string | null {
  let t = line.trim();
  t = t.replace(/\s*\(\d+\s*Questions?\)\s*$/i, "");
  t = t.replace(/\s*[-–—]\s*Important Questions\s*$/i, "");
  t = t.trim();
  const found = BASE_TOPICS.find((base) => base.toLowerCase() === t.toLowerCase());
  return found ?? null;
}

interface Row {
  title: string;
  topic: string;
  difficulty: string;
  platform: string;
  problem_url: string;
  companies: string[];
  notes: string;
  is_important: boolean;
  _lineIndex?: number;
}

// Variants observed across the 11 PDFs, tried in order:
const PATTERNS: Array<{ re: RegExp; extract: (m: RegExpMatchArray) => { title: string; num?: string; qNum: number } }> = [
  // Infosys style: "1. LeetCode: 493 (Reverse Pairs) — related to count inversions" /
  // "1. LeetCode: 189 (Rotate Array)" — real title is the parenthesized name.
  {
    re: /^(\d+)\.\s+LeetCode:\s*\S*\s*\((.+?)\)/i,
    extract: (m) => ({ title: m[2].trim(), qNum: parseInt(m[1], 10) }),
  },
  // "1. Two Sum — LeetCode #1" / "1. Two Sum – LeetCode 1" / "1. Two Sum (LeetCode #1)"
  {
    re: /^(\d+)\.\s+(.+?)\s*(?:[-–—]\s*LeetCode\s*#?\s*(\d+)|\(LeetCode\s*#?\s*(\d+)\))\s*$/i,
    extract: (m) => ({ title: m[2].trim(), num: m[3] || m[4], qNum: parseInt(m[1], 10) }),
  },
  // "1. LeetCode #1 Two Sum"
  {
    re: /^(\d+)\.\s+LeetCode\s*#?\s*(\d+)\s+(.+)$/i,
    extract: (m) => ({ title: m[3].trim(), num: m[2], qNum: parseInt(m[1], 10) }),
  },
  // "Q1. Two Sum - Find pair with given sum" / "Q1. Find Maximum and Minimum Element"
  {
    re: /^Q(\d+)\.\s+(.+)$/i,
    extract: (m) => ({ title: m[2].trim(), qNum: parseInt(m[1], 10) }),
  },
  // Generic fallback: "1. <anything>"
  {
    re: /^(\d+)\.\s+(.+)$/,
    extract: (m) => ({ title: m[2].trim(), qNum: parseInt(m[1], 10) }),
  },
];

const STANDALONE_LEETCODE_LINE = /^LeetCode(?:\s*Problem)?\s*#?:?\s*(\d+)$/i;

function isValidTitle(title: string): boolean {
  if (title.length < 3 || title.length > 140) return false;
  if (/^leetcode\b/i.test(title)) return false;
  if (/no (exact|direct) match/i.test(title)) return false;
  if (/^--\s*\d+\s*of\s*\d+\s*--$/i.test(title)) return false;
  return true;
}

// A real question title is followed shortly by a problem-body marker; a numbered
// step inside an "Explanation:" list is not — this is what separates the two.
const PROBLEM_BODY_MARKER = /^(Problem Statement|Description|Question)\s*:?\s*$|^(Given|You are given|Find |Write a function|Implement)/i;

function looksLikeQuestion(lines: string[], idx: number): boolean {
  for (let i = idx + 1; i <= idx + 3 && i < lines.length; i++) {
    if (PROBLEM_BODY_MARKER.test(lines[i])) return true;
  }
  return false;
}

function parseQuestions(text: string, company: string): Row[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const rows: Row[] = [];
  let currentTopic = "General";
  let pendingLeetCodeNum: string | undefined;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const topic = normalizeTopicHeader(line);
    if (topic) {
      currentTopic = topic;
      continue;
    }

    const standalone = line.match(STANDALONE_LEETCODE_LINE);
    if (standalone) {
      const lastRow = rows[rows.length - 1];
      if (lastRow && lastRow._lineIndex !== undefined && idx - lastRow._lineIndex <= 2 && !lastRow.notes.includes("LeetCode #")) {
        lastRow.notes += ` (LeetCode #${standalone[1]})`;
      } else {
        pendingLeetCodeNum = standalone[1];
      }
      continue;
    }

    // "26. LeetCode #206" on its own line, with the real title on the next line
    // (e.g. "Reverse Linked List" below it) — seen in several of the company PDFs.
    const numberedLeetCodeOnly = line.match(/^(\d+)\.\s+LeetCode\s*#?\s*(\d+)\s*$/i);
    if (numberedLeetCodeOnly) {
      const titleLine = lines[idx + 1];
      if (titleLine && isValidTitle(titleLine) && looksLikeQuestion(lines, idx + 1)) {
        rows.push({
          title: titleLine,
          topic: currentTopic,
          difficulty: "Medium",
          platform: "LeetCode",
          problem_url: "",
          companies: [company],
          notes: `From ${company} DSA prep sheet (LeetCode #${numberedLeetCodeOnly[2]})`,
          is_important: true,
          _lineIndex: idx + 1,
        });
        idx += 1;
      }
      continue;
    }

    for (const { re, extract } of PATTERNS) {
      const match = line.match(re);
      if (!match) continue;
      const { title, num } = extract(match);
      if (!isValidTitle(title)) break;
      if (!looksLikeQuestion(lines, idx)) break;
      const leetNum = num || pendingLeetCodeNum;
      pendingLeetCodeNum = undefined;
      rows.push({
        title,
        topic: currentTopic,
        difficulty: "Medium",
        platform: "LeetCode",
        problem_url: "",
        companies: [company],
        notes: `From ${company} DSA prep sheet${leetNum ? ` (LeetCode #${leetNum})` : ""}`,
        is_important: true,
        _lineIndex: idx,
      });
      break;
    }
  }

  return rows;
}

async function main() {
  const files = fs.readdirSync(SOURCE_DIR).filter((f) => f.toLowerCase().endsWith(".pdf"));
  const allRows: Row[] = [];

  for (const file of files) {
    const company = FILE_TO_COMPANY[file];
    if (!company) {
      console.warn(`Skipping unmapped file: ${file}`);
      continue;
    }
    const buf = fs.readFileSync(path.join(SOURCE_DIR, file));
    const parser = new PDFParse({ data: buf });
    const result = await parser.getText();
    const rows = parseQuestions(result.text, company);
    console.log(`${company}: extracted ${rows.length} questions`);
    allRows.push(...rows);
  }

  // Merge duplicate titles (case-insensitive) across companies into one row with combined companies[].
  const merged = new Map<string, Row>();
  for (const row of allRows) {
    const key = `${row.title.toLowerCase()}::${row.platform.toLowerCase()}`;
    const existing = merged.get(key);
    if (existing) {
      for (const c of row.companies) {
        if (!existing.companies.includes(c)) existing.companies.push(c);
      }
    } else {
      merged.set(key, { ...row, companies: [...row.companies] });
    }
  }

  const finalRows = Array.from(merged.values()).map(({ _lineIndex, ...row }) => row);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalRows, null, 2));
  console.log(`\nWrote ${finalRows.length} unique questions (from ${allRows.length} raw extracted) to ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
