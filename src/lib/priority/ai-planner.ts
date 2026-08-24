import { SupabaseClient } from '@supabase/supabase-js'
import { collectExamSignals } from './collectors/exam-collector'
import { collectDSASignals } from './collectors/dsa-collector'
import { collectGitHubSignals } from './collectors/github-collector'
import { collectResumeSignals } from './collectors/resume-collector'
import { collectProjectSignals } from './collectors/project-collector'
import { collectSubjectSignals } from './collectors/subject-collector'
import { signalToTask, PriorityTaskRow } from './task-generator'
import { buildUserContext } from '@/lib/context/user-context'
import { getRecentFeedbackSignals } from '@/lib/feedback/events'

export interface DailyPlan {
  todaysFocus: string
  urgentAlerts: string[]
  insights: string[]
  tasks: PriorityTaskRow[]
  totalMinutesToday: number
  generatedAt: string
}

export async function generateDailyPlan(
  db: SupabaseClient,
  userId: string
): Promise<DailyPlan> {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  console.log(`[AI Planner] Generating plan for ${userId} on ${todayStr}`)

  // ── Read user context ─────────────────────────────────────
  const [profileRes, resumeRes, lcProfileRes] = await Promise.allSettled([
    db.from('users').select('stream, target_companies, display_name').eq('id', userId).maybeSingle(),
    db.from('user_resumes').select('skill_entities, swot').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
    db.from('leetcode_profiles').select('placement_readiness_score, ai_analysis')
      .eq('user_id', userId).maybeSingle()
  ])

  const profile = profileRes.status === 'fulfilled' ? profileRes.value.data : null
  const resume = resumeRes.status === 'fulfilled' ? resumeRes.value.data : null
  const lcProfile = lcProfileRes.status === 'fulfilled' ? lcProfileRes.value.data : null

  const companies = (profile?.target_companies ?? []) as string[]
  const skills = (resume?.skill_entities as { skills?: string[] } | null)?.skills ?? []
  const unifiedContext = await buildUserContext(db, userId, { taskLimit: 10, includeFeedback: true }).catch(() => null)
  const feedbackSignals = await getRecentFeedbackSignals(db, userId, 30).catch(() => null)

  // Extract weak topics from LeetCode AI analysis
  const lcWeakTopics = (lcProfile?.ai_analysis as {
    priority_topics?: Array<{ topic: string; priority: string }>
  } | null)?.priority_topics
    ?.filter(t => t.priority === 'CRITICAL' || t.priority === 'HIGH')
    ?.map(t => t.topic) ?? []

  const lcScore = (lcProfile as { placement_readiness_score?: number } | null)
    ?.placement_readiness_score

  console.log('[AI Planner] Context:', {
    companies: companies.length,
    skills: skills.length,
    weakTopics: lcWeakTopics.length
  })

  // ── Collect all signals in parallel ──────────────────────
  const [examRes, dsaRes, githubRes, resumeRes2, projectRes, subjectRes] =
    await Promise.allSettled([
      collectExamSignals(db, userId),
      collectDSASignals(db, userId, lcWeakTopics, companies, 3),
      collectGitHubSignals(db, userId),
      collectResumeSignals(db, userId, companies),
      collectProjectSignals(db, userId),
      collectSubjectSignals(db, userId)
    ])

  const exams = examRes.status === 'fulfilled' ? examRes.value : []
  const dsa = dsaRes.status === 'fulfilled' ? dsaRes.value : []
  const github = githubRes.status === 'fulfilled' ? githubRes.value : []
  const resumeGaps = resumeRes2.status === 'fulfilled' ? resumeRes2.value : []
  const projects = projectRes.status === 'fulfilled' ? projectRes.value : []
  const subjects = subjectRes.status === 'fulfilled' ? subjectRes.value : []

  console.log('[AI Planner] Signals:', {
    exams: exams.length, dsa: dsa.length,
    github: github.length, gaps: resumeGaps.length, projects: projects.length, subjects: subjects.length
  })

  // ── Convert signals to task rows ─────────────────────────
  const allTasks: PriorityTaskRow[] = [
    ...exams.map(s => signalToTask(s, userId, todayStr)),
    ...dsa.map(s => signalToTask(s, userId, todayStr)),
    ...github.slice(0, 2).map(s => signalToTask(s, userId, todayStr)),
    ...resumeGaps.slice(0, 1).map(s => signalToTask(s, userId, todayStr)),
    ...projects.slice(0, 1).map(s => signalToTask(s, userId, todayStr)),
    ...subjects.slice(0, 1).map(s => signalToTask(s, userId, todayStr)),
  ]

  // Sort by urgency score descending
  allTasks.sort((a, b) => b.urgency_score - a.urgency_score)

  // Limit to top 8
  const todaysTasks = allTasks.slice(0, 8)
  const totalMinutesToday = todaysTasks.reduce(
    (sum, t) => sum + t.estimated_minutes, 0
  )
  const availableMinutesToday = unifiedContext?.workCapacity.availableHoursPerWeek
    ? Math.round((unifiedContext.workCapacity.availableHoursPerWeek * 60) / 7)
    : null

  // ── Build urgent alerts ───────────────────────────────────
  const urgentAlerts: string[] = []
  exams
    .filter(e => e.daysUntil <= 3)
    .forEach(e => {
      urgentAlerts.push(
        `URGENT: ${e.subjectName} ${e.examType ?? 'exam'} in ` +
        `${e.daysUntil} day${e.daysUntil === 1 ? '' : 's'} ` +
        `(${new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`
      )
    })

  // ── Build insights (deterministic — no GPT cost) ──────────
  const insights: string[] = []
  if (exams.length > 0) {
    insights.push(
      `${exams[0].subjectName} exam in ${exams[0].daysUntil} days — revision is your top priority today`
    )
  }
  if (lcScore !== undefined && lcScore !== null) {
    const scoreMsg =
      lcScore < 40 ? 'needs immediate improvement to pass OA rounds' :
      lcScore < 65 ? 'on track — aim for 75+ to qualify for top companies' :
      'great score — focus on hard problems and consistency'
    insights.push(`Your LeetCode placement score is ${lcScore}/100 — ${scoreMsg}`)
  } else {
    insights.push('LeetCode not connected — link your account to get AI problem recommendations')
  }
  if (github.length > 0) {
    insights.push(`${github.length} GitHub ${github.length === 1 ? 'repo needs' : 'repos need'} attention — fixing them improves recruiter visibility`)
  }
  if (dsa.length > 0 && lcWeakTopics.length > 0) {
    insights.push(`Weak topics detected: ${lcWeakTopics.slice(0, 3).join(', ')} — today's DSA picks target these`)
  }
  if (availableMinutesToday && totalMinutesToday > availableMinutesToday) {
    insights.push(`Today's plan is ${totalMinutesToday} min against an estimated ${availableMinutesToday} min/day capacity — defer lower-priority work if needed`)
  }
  if (feedbackSignals && feedbackSignals.postponed > feedbackSignals.completed) {
    insights.push('Recent postponements suggest reducing scope and finishing the highest-impact task first')
  }

  // ── Build today's focus headline ──────────────────────────
  let todaysFocus: string
  if (exams.some(e => e.daysUntil <= 1)) {
    todaysFocus = `Exam day — focus 100% on ${exams[0].subjectName} revision`
  } else if (exams.some(e => e.daysUntil <= 3)) {
    todaysFocus = `Exam in ${exams[0].daysUntil} days — prioritise ${exams[0].subjectName} revision + 1 DSA problem`
  } else if (exams.length > 0) {
    todaysFocus = `Balanced day — exam prep + ${dsa.length} DSA problems + profile improvements`
  } else if (dsa.length > 0 && lcWeakTopics.length > 0) {
    todaysFocus = `Target your weak areas: ${lcWeakTopics.slice(0, 2).join(' & ')} with today's curated problems`
  } else if (dsa.length > 0) {
    todaysFocus = `Daily coding practice — ${dsa.length} curated problems from your skill path`
  } else if (github.length > 0) {
    todaysFocus = `Portfolio day — improve GitHub health and project visibility`
  } else {
    todaysFocus = `Profile building day — set up your LeetCode, GitHub, and resume connections`
  }

  return {
    todaysFocus,
    urgentAlerts,
    insights: insights.slice(0, 4),
    tasks: todaysTasks,
    totalMinutesToday,
    generatedAt: new Date().toISOString()
  }
}
