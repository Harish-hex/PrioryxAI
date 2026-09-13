import { SupabaseClient } from '@supabase/supabase-js'
import { collectExamSignals } from './collectors/exam-collector'
import { collectDSASignals } from './collectors/dsa-collector'
import { collectGitHubSignals } from './collectors/github-collector'
import { collectResumeSignals } from './collectors/resume-collector'
import { collectProjectSignals } from './collectors/project-collector'
import { collectSubjectSignals } from './collectors/subject-collector'
import { collectTimetableSignals } from './collectors/timetable-collector'
import { collectJobSignals } from './collectors/job-collector'
import { collectRoadmapSignals } from './collectors/roadmap-collector'
import { signalToTask, PriorityTaskRow } from './task-generator'

/** Deterministic day-of-year index — used to rotate which item from a larger
 * candidate pool (e.g. GitHub fixes) gets picked as "today's one", so the
 * feed shows something different tomorrow instead of the same top pick every
 * day until the user happens to finish it. */
function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0)
  const diff = d.getTime() - start.getTime()
  return Math.floor(diff / 86_400_000)
}

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
  const [examRes, dsaRes, githubRes, resumeRes2, projectRes, timetableRes, subjectRes, jobRes, roadmapRes] =
    await Promise.allSettled([
      collectExamSignals(db, userId),
      collectDSASignals(db, userId, lcWeakTopics, companies, 5),
      collectGitHubSignals(db, userId),
      collectResumeSignals(db, userId, companies),
      collectProjectSignals(db, userId),
      collectTimetableSignals(db, userId),
      collectSubjectSignals(db, userId),
      collectJobSignals(db, userId),
      collectRoadmapSignals(db, userId)
    ])

  const exams = examRes.status === 'fulfilled' ? examRes.value : []
  const dsaPool = dsaRes.status === 'fulfilled' ? dsaRes.value : []
  const githubPool = githubRes.status === 'fulfilled' ? githubRes.value : []
  const resumeGaps = resumeRes2.status === 'fulfilled' ? resumeRes2.value : []
  const projects = projectRes.status === 'fulfilled' ? projectRes.value : []
  const timetableSubjects = timetableRes.status === 'fulfilled' ? timetableRes.value : []
  const jobs = jobRes.status === 'fulfilled' ? jobRes.value : []
  const roadmap = roadmapRes.status === 'fulfilled' ? roadmapRes.value : []
  if (jobRes.status === 'rejected') {
    console.error('[AI Planner] Job matching failed:', jobRes.reason)
  }
  // Prefer a study block from the user's actual uploaded class timetable;
  // fall back to a random profile subject only if no timetable exists.
  const subjects = timetableSubjects.length > 0
    ? timetableSubjects
    : (subjectRes.status === 'fulfilled' ? subjectRes.value : [])

  // The feed shows exactly ONE coding question and ONE GitHub fix per day —
  // but which one rotates by day-of-year through the candidate pool, so it's
  // a genuinely different pick tomorrow instead of always the same #1.
  const dow = dayOfYear(today)
  const dsa = dsaPool.length > 0 ? [dsaPool[dow % dsaPool.length]] : []
  const github = githubPool.length > 0 ? [githubPool[dow % githubPool.length]] : []

  console.log('[AI Planner] Signals:', {
    exams: exams.length, dsa: dsa.length,
    github: github.length, gaps: resumeGaps.length, projects: projects.length,
    subjects: subjects.length, jobs: jobs.length, roadmap: roadmap.length
  })

  // Weekends: surface more Foundry projects to work on (collectProjectSignals
  // already returns up to 5 on Sat/Sun vs. 3 on weekdays) instead of just 1.
  const dayOfWeek = today.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const projectTaskLimit = isWeekend ? 3 : 1

  // ── Convert signals to task rows ─────────────────────────
  // Core daily set, one of each: a coding question, a GitHub fix, the next
  // roadmap topic, a timetable study block, and a skill gap to close — plus
  // exams/jobs/weekend-project tasks layered in when relevant.
  const allTasks: PriorityTaskRow[] = [
    ...exams.map(s => signalToTask(s, userId, todayStr)),
    ...jobs.map(s => signalToTask(s, userId, todayStr)),
    ...dsa.map(s => signalToTask(s, userId, todayStr)),
    ...github.map(s => signalToTask(s, userId, todayStr)),
    ...roadmap.map(s => signalToTask(s, userId, todayStr)),
    ...resumeGaps.slice(0, 1).map(s => signalToTask(s, userId, todayStr)),
    ...projects.slice(0, projectTaskLimit).map(s => signalToTask(s, userId, todayStr)),
    ...subjects.slice(0, 1).map(s => signalToTask(s, userId, todayStr)),
  ]

  // Sort by urgency score descending
  allTasks.sort((a, b) => b.urgency_score - a.urgency_score)

  // Limit to top 8
  const todaysTasks = allTasks.slice(0, 8)
  const totalMinutesToday = todaysTasks.reduce(
    (sum, t) => sum + t.estimated_minutes, 0
  )

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
  jobs
    .filter(j => j.deadline && (new Date(j.deadline).getTime() - Date.now()) / 86_400_000 <= 3)
    .forEach(j => {
      urgentAlerts.push(
        `${j.matchScore}% match: ${j.title}${j.company ? ` at ${j.company}` : ''} — apply before ` +
        `${new Date(j.deadline as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
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
  if (jobs.length > 0) {
    insights.push(
      `${jobs.length} open ${jobs.length === 1 ? 'role matches' : 'roles match'} your profile at 75%+ — ` +
      `top pick: ${jobs[0].title}${jobs[0].company ? ` at ${jobs[0].company}` : ''} (${jobs[0].matchScore}%)`
    )
  }
  if (dsa.length > 0 && lcWeakTopics.length > 0) {
    insights.push(`Weak topics detected: ${lcWeakTopics.slice(0, 3).join(', ')} — today's DSA picks target these`)
  }

  // ── Build today's focus headline ──────────────────────────
  let todaysFocus: string
  if (exams.some(e => e.daysUntil <= 1)) {
    todaysFocus = `Exam day — focus 100% on ${exams[0].subjectName} revision`
  } else if (exams.some(e => e.daysUntil <= 3)) {
    todaysFocus = `Exam in ${exams[0].daysUntil} days — prioritise ${exams[0].subjectName} revision + 1 DSA problem`
  } else if (exams.length > 0) {
    todaysFocus = `Balanced day — exam prep + today's DSA problem + profile improvements`
  } else if (dsa.length > 0 && lcWeakTopics.length > 0) {
    todaysFocus = `Target your weak areas: ${lcWeakTopics.slice(0, 2).join(' & ')} with today's curated problem`
  } else if (dsa.length > 0) {
    todaysFocus = `Daily coding practice — today's curated problem from your skill path`
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
