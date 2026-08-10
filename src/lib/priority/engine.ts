/**
 * Priority Engine — Bug 8
 * Reads ALL user data from Supabase and returns a prioritised daily action plan.
 */

import { createClient } from '@/lib/supabase/server'

export interface PriorityTask {
  id: string
  category:
    | 'leetcode'
    | 'hackerrank'
    | 'project'
    | 'resume'
    | 'github'
    | 'exam'
    | 'job_application'
    | 'learning'
  title: string
  description: string
  why: string
  estimatedMinutes: number
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  dueDate?: string
  actionUrl?: string
  actionLabel?: string
  tags: string[]
  completed: boolean
  scheduledFor: 'today' | 'tomorrow' | 'this_week' | 'next_week'
}

export interface PriorityPlan {
  todaysTasks: PriorityTask[]
  urgentAlerts: string[]
  insights: string[]
  generatedAt: string
}

let _cached: { plan: PriorityPlan; userId: string; ts: number } | null = null
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function generatePriorityPlan(userId: string): Promise<PriorityPlan> {
  // Return cached result if fresh
  if (_cached && _cached.userId === userId && Date.now() - _cached.ts < CACHE_TTL_MS) {
    return _cached.plan
  }

  const supabase = createClient()
  const today = new Date()
  const todayISO = today.toISOString().split('T')[0]

  // Read all user data in parallel
  const [
    profileResult,
    resumeResult,
    lcProfileResult,
    projectsResult,
    examsResult,
    githubActionsResult,
  ] = await Promise.allSettled([
    supabase.from('users').select('*').eq('id', userId).maybeSingle(),
    supabase.from('user_resumes').select('skill_entities, swot, parsed_data, extraction_method').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('leetcode_profiles').select('placement_readiness_score, ai_analysis, leetcode_username').eq('user_id', userId).maybeSingle(),
    supabase.from('user_projects').select('*').eq('user_id', userId).eq('verified', false).order('created_at'),
    supabase.from('schedule_exams').select('*').eq('user_id', userId).gte('date', todayISO).order('date').limit(10),
    supabase.from('github_priority_actions').select('*').eq('user_id', userId).eq('completed', false).order('impact_score', { ascending: false }).limit(5),
  ])

  const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null
  const resume = resumeResult.status === 'fulfilled' ? resumeResult.value.data : null
  const lcProfile = lcProfileResult.status === 'fulfilled' ? lcProfileResult.value.data : null
  const projects = projectsResult.status === 'fulfilled' ? (projectsResult.value.data ?? []) : []
  const exams = examsResult.status === 'fulfilled' ? (examsResult.value.data ?? []) : []
  const githubActions = githubActionsResult.status === 'fulfilled' ? (githubActionsResult.value.data ?? []) : []

  const tasks: PriorityTask[] = []
  const urgentAlerts: string[] = []
  const insights: string[] = []

  // ── 1. Resume missing ──
  if (!resume) {
    tasks.push({
      id: 'resume-missing',
      category: 'resume',
      title: 'Upload Your Resume',
      description: 'Resume data is required for Project Foundry, Job Market matching, and SWOT analysis.',
      why: 'Without a resume, most AI features cannot personalise to your skills.',
      estimatedMinutes: 5,
      priority: 'CRITICAL',
      actionUrl: '/career/resume/upload',
      actionLabel: 'Upload Resume',
      tags: ['setup', 'resume'],
      completed: false,
      scheduledFor: 'today',
    })
    urgentAlerts.push('No resume found — upload one to unlock Job Market and Project Foundry.')
  } else {
    const skills: string[] = (resume.skill_entities as { skills?: string[] } | null)?.skills ?? []
    if (skills.length < 5) {
      tasks.push({
        id: 'resume-skills-low',
        category: 'resume',
        title: 'Re-upload Resume for Better Skill Extraction',
        description: `Only ${skills.length} skills detected. A clearer PDF or Word doc extracts more skills.`,
        why: 'More skills = better job matching and project suggestions.',
        estimatedMinutes: 3,
        priority: 'HIGH',
        actionUrl: '/career/resume/upload',
        actionLabel: 'Re-upload Resume',
        tags: ['resume', 'skills'],
        completed: false,
        scheduledFor: 'today',
      })
    } else {
      insights.push(`Resume has ${skills.length} skills detected — good coverage.`)
    }
  }

  // ── 2. LeetCode ──
  if (!lcProfile) {
    tasks.push({
      id: 'leetcode-not-connected',
      category: 'leetcode',
      title: 'Connect Your LeetCode Profile',
      description: 'Link LeetCode to get AI analysis, placement readiness score, and personalised study plans.',
      why: 'LeetCode is used in OA rounds at FAANG, startups, and top Indian product companies.',
      estimatedMinutes: 3,
      priority: 'HIGH',
      actionUrl: '/career/coding',
      actionLabel: 'Connect LeetCode',
      tags: ['leetcode', 'setup'],
      completed: false,
      scheduledFor: 'today',
    })
  } else {
    const score = (lcProfile as { placement_readiness_score?: number }).placement_readiness_score ?? 0
    if (score < 40) {
      const aiAnalysis = (lcProfile as { ai_analysis?: { priority_topics?: Array<{ topic: string; priority: string }> } }).ai_analysis
      const criticalTopics = aiAnalysis?.priority_topics
        ?.filter((t) => t.priority === 'CRITICAL')
        ?.map((t) => t.topic)
        ?.slice(0, 2) ?? []
      tasks.push({
        id: 'leetcode-low-score',
        category: 'leetcode',
        title: `Improve LeetCode Score (Currently ${score}/100)`,
        description: criticalTopics.length > 0
          ? `Focus on: ${criticalTopics.join(', ')}`
          : 'Solve 2-3 medium problems in your weak topics.',
        why: 'A score below 40 significantly reduces chances of passing OA rounds.',
        estimatedMinutes: 60,
        priority: score < 20 ? 'CRITICAL' : 'HIGH',
        actionUrl: '/career/coding/study-plan',
        actionLabel: 'View Study Plan',
        tags: ['leetcode', 'dsa', 'oa'],
        completed: false,
        scheduledFor: 'today',
      })
      insights.push(`LeetCode placement score: ${score}/100 — needs improvement.`)
    } else {
      insights.push(`LeetCode placement score: ${score}/100 — on track.`)
    }
  }

  // ── 3. Upcoming exams ──
  for (const exam of exams as Array<{ title: string; date: string; type?: string }>) {
    const examDate = new Date(exam.date)
    const daysUntil = Math.floor((examDate.getTime() - today.getTime()) / 86_400_000)
    if (daysUntil <= 3) {
      tasks.push({
        id: `exam-${exam.date}`,
        category: 'exam',
        title: `Prepare for: ${exam.title}`,
        description: daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`,
        why: 'Exam is approaching — prioritise revision now.',
        estimatedMinutes: 120,
        priority: daysUntil === 0 ? 'CRITICAL' : daysUntil === 1 ? 'CRITICAL' : 'HIGH',
        dueDate: exam.date,
        tags: ['exam', exam.type ?? 'academic'],
        completed: false,
        scheduledFor: 'today',
      })
      if (daysUntil <= 1) urgentAlerts.push(`URGENT: "${exam.title}" is ${daysUntil === 0 ? 'today' : 'tomorrow'}!`)
    }
  }

  // ── 4. Active project ──
  if (projects.length > 0) {
    const current = projects[0] as { title: string; current_phase: number; id: string }
    tasks.push({
      id: `project-${current.id}`,
      category: 'project',
      title: `Continue Project: ${current.title}`,
      description: `Currently at Phase ${current.current_phase}/6. Advance one phase today.`,
      why: 'Portfolio projects are the strongest signal in placement interviews.',
      estimatedMinutes: 90,
      priority: 'MEDIUM',
      actionUrl: `/career/foundry/project/${current.id}`,
      actionLabel: 'Open Project',
      tags: ['project', 'portfolio'],
      completed: false,
      scheduledFor: 'today',
    })
  } else if (resume) {
    tasks.push({
      id: 'foundry-generate',
      category: 'project',
      title: 'Generate Portfolio Projects',
      description: 'Use Project Foundry to generate 9 personalised projects based on your resume skills.',
      why: 'Projects built from skill gaps are more relevant to recruiters.',
      estimatedMinutes: 10,
      priority: 'MEDIUM',
      actionUrl: '/career/foundry/dashboard',
      actionLabel: 'Open Foundry',
      tags: ['project', 'foundry'],
      completed: false,
      scheduledFor: 'today',
    })
  }

  // ── 5. GitHub actions ──
  for (const action of (githubActions as Array<{ title?: string; description?: string; action_url?: string; id: string }>) .slice(0, 2)) {
    tasks.push({
      id: `github-${action.id}`,
      category: 'github',
      title: action.title ?? 'GitHub Action',
      description: action.description ?? '',
      why: 'GitHub activity is reviewed by recruiters and used for job matching.',
      estimatedMinutes: 30,
      priority: 'MEDIUM',
      actionUrl: action.action_url,
      actionLabel: 'View on GitHub',
      tags: ['github', 'portfolio'],
      completed: false,
      scheduledFor: 'today',
    })
  }

  // Sort: CRITICAL first, then HIGH, then MEDIUM, then LOW
  const ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
  tasks.sort((a, b) => ORDER[a.priority] - ORDER[b.priority])

  const plan: PriorityPlan = {
    todaysTasks: tasks,
    urgentAlerts,
    insights,
    generatedAt: new Date().toISOString(),
  }

  _cached = { plan, userId, ts: Date.now() }
  return plan
}
