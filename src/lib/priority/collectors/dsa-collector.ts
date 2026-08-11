import { SupabaseClient } from '@supabase/supabase-js'

export interface DSASignal {
  type: 'leetcode'
  questionId: string
  title: string
  topic: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  platform: string
  problemUrl: string
  companies: string[]
  isImportant: boolean
  whyNow: string
  urgencyScore: number
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
}

export async function collectDSASignals(
  db: SupabaseClient,
  userId: string,
  weakTopics: string[],
  targetCompanies: string[],
  limit = 5
): Promise<DSASignal[]> {
  // Fetch a pool of unsolved important questions — no topic filter so we
  // always get results even if topics don't match exactly.
  const { data: questions } = await db
    .from('dsa_questions')
    .select(`*, dsa_progress!left(status, user_id)`)
    .eq('is_important', true)
    .limit(limit * 8)

  if (!questions?.length) {
    // Fallback: any questions regardless of importance
    const { data: fallback } = await db
      .from('dsa_questions')
      .select(`*, dsa_progress!left(status, user_id)`)
      .limit(limit * 4)

    if (!fallback?.length) return []
    return buildDSASignals(fallback, userId, weakTopics, targetCompanies, limit)
  }

  return buildDSASignals(questions, userId, weakTopics, targetCompanies, limit)
}

function buildDSASignals(
  questions: Record<string, unknown>[],
  userId: string,
  weakTopics: string[],
  targetCompanies: string[],
  limit: number
): DSASignal[] {
  // Filter unsolved by this user
  const unsolved = questions.filter(q => {
    const progress = q.dsa_progress as Array<{ status: string; user_id: string }> | null
    const userProgress = progress?.find(p => p.user_id === userId)
    return !userProgress || userProgress.status === 'todo'
  })

  // Prefer weak-topic matches, then shuffle the rest for randomness
  const weakMatches = unsolved.filter(q =>
    weakTopics.some(t => String(q.topic ?? '').toLowerCase().includes(t.toLowerCase()))
  )
  const others = unsolved.filter(q =>
    !weakTopics.some(t => String(q.topic ?? '').toLowerCase().includes(t.toLowerCase()))
  )

  // Shuffle others
  const shuffledOthers = others.sort(() => 0.5 - Math.random())
  const pool = [...weakMatches, ...shuffledOthers].slice(0, limit)

  return pool.map(q => {
    const companies = (q.companies as string[]) ?? []
    const targetMatch = companies.filter(c =>
      targetCompanies.some(tc =>
        tc.toLowerCase().includes(c.toLowerCase()) ||
        c.toLowerCase().includes(tc.toLowerCase())
      )
    )
    const difficulty = String(q.difficulty ?? 'Medium') as 'Easy' | 'Medium' | 'Hard'
    const isImportant = Boolean(q.is_important)
    const topic = String(q.topic ?? 'General')
    const platform = String(q.platform ?? 'LeetCode')

    const urgencyScore =
      isImportant && targetMatch.length > 0 ? 80 :
      isImportant ? 75 :
      targetMatch.length > 0 ? 70 :
      difficulty === 'Hard' ? 65 :
      difficulty === 'Medium' ? 60 : 50

    const priority: DSASignal['priority'] =
      isImportant && targetMatch.length > 0 ? 'HIGH' :
      isImportant ? 'HIGH' : 'MEDIUM'

    // Build direct URL
    let problemUrl = String(q.problem_url ?? '')
    if (!problemUrl && platform === 'LeetCode') {
      const slug = String(q.title ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '-')
      problemUrl = `https://leetcode.com/problems/${slug}/`
    } else if (!problemUrl) {
      problemUrl = platform === 'HackerRank'
        ? 'https://hackerrank.com/domains/algorithms'
        : platform === 'GeeksforGeeks'
        ? 'https://practice.geeksforgeeks.org/'
        : 'https://leetcode.com/problemset/'
    }

    const whyNow =
      targetMatch.length > 0
        ? `Asked by ${targetMatch.slice(0, 2).join(', ')} — matches your target companies`
        : isImportant
        ? `High-frequency ${topic} problem — core interview pattern`
        : weakTopics.some(t => topic.toLowerCase().includes(t.toLowerCase()))
        ? `${topic} is a weak area — build the pattern today`
        : `Daily coding challenge on ${topic} — keep your skills sharp`

    return {
      type: 'leetcode' as const,
      questionId: String(q.id),
      title: String(q.title ?? ''),
      topic,
      difficulty,
      platform,
      problemUrl,
      companies,
      isImportant,
      whyNow,
      urgencyScore,
      priority
    }
  })
}
