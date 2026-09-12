import { ExamSignal } from './collectors/exam-collector'
import { DSASignal } from './collectors/dsa-collector'
import { GitHubSignal } from './collectors/github-collector'
import { ResumeSignal } from './collectors/resume-collector'
import { ProjectSignal } from './collectors/project-collector'
import { SubjectSignal } from './collectors/subject-collector'
import { JobSignal } from './collectors/job-collector'
import { RoadmapSignal } from './collectors/roadmap-collector'

type AnySignal = ExamSignal | DSASignal | GitHubSignal | ResumeSignal | ProjectSignal | SubjectSignal | JobSignal | RoadmapSignal

export interface PriorityTaskRow {
  user_id: string
  title: string
  description: string
  category: string
  priority: string
  urgency_score: number
  scheduled_for: string
  due_date?: string
  action_url: string
  action_label: string
  secondary_url?: string
  why_now: string
  estimated_minutes: number
  effort_level: string
  source_type: string
  source_id: string
  task_data: Record<string, unknown>
  expires_at: string
}

export function signalToTask(
  signal: AnySignal,
  userId: string,
  scheduledFor: string
): PriorityTaskRow {
  const expires_at = new Date(
    new Date(scheduledFor).getTime() + 48 * 3600000
  ).toISOString()

  const base = { user_id: userId, scheduled_for: scheduledFor, expires_at }

  switch (signal.type) {
    case 'exam': {
      const s = signal as ExamSignal
      const sessionLabel =
        s.session === 'FN' ? 'Morning (10AM–1PM)' :
        s.session === 'AN' ? 'Afternoon (2PM–5PM)' :
        s.startTime ?? ''

      return {
        ...base,
        title: `Revise: ${s.subjectName}`,
        description:
          `${s.examType ?? 'Exam'} in ${s.daysUntil} day${s.daysUntil === 1 ? '' : 's'}` +
          (s.venue ? ` · ${s.venue}` : '') +
          (sessionLabel ? ` · ${sessionLabel}` : ''),
        category: 'exam',
        priority: s.priority,
        urgency_score: s.urgencyScore,
        due_date: s.date,
        action_url: '/settings#exam-schedule',
        action_label: 'View Schedule',
        why_now: s.daysUntil <= 2
          ? `URGENT: ${s.subjectName} exam in ${s.daysUntil} day${s.daysUntil === 1 ? '' : 's'} — start revision now`
          : `Exam in ${s.daysUntil} days — build daily revision blocks`,
        estimated_minutes:
          s.daysUntil <= 1 ? 240 :
          s.daysUntil <= 3 ? 180 :
          s.daysUntil <= 7 ? 120 : 60,
        effort_level: s.daysUntil <= 3 ? 'deep' : 'medium',
        source_type: 'exam_schedule',
        source_id: s.id,
        task_data: {
          subjectCode: s.subjectCode,
          venue: s.venue,
          session: s.session,
          examType: s.examType,
          date: s.date,
          daysUntil: s.daysUntil
        }
      }
    }

    case 'leetcode': {
      const s = signal as DSASignal
      return {
        ...base,
        title: `Solve: ${s.title}`,
        description:
          `${s.difficulty} · ${s.topic} · ${s.platform}` +
          (s.companies.length > 0
            ? ` · Asked by: ${s.companies.slice(0, 3).join(', ')}`
            : ''),
        category: 'leetcode',
        priority: s.priority,
        urgency_score: s.urgencyScore,
        action_url: s.problemUrl,
        action_label: `Solve on ${s.platform}`,
        secondary_url: '/career/coding/study-plan',
        why_now: s.whyNow,
        estimated_minutes:
          s.difficulty === 'Easy' ? 20 :
          s.difficulty === 'Medium' ? 45 : 90,
        effort_level:
          s.difficulty === 'Easy' ? 'quick' :
          s.difficulty === 'Medium' ? 'medium' : 'deep',
        source_type: 'dsa_excel',
        source_id: s.questionId,
        task_data: {
          topic: s.topic,
          difficulty: s.difficulty,
          platform: s.platform,
          problemUrl: s.problemUrl,
          companies: s.companies,
          isImportant: s.isImportant
        }
      }
    }

    case 'github': {
      const s = signal as GitHubSignal
      return {
        ...base,
        title: s.actionTitle,
        description: `${s.repoName} — ${s.actionDescription.slice(0, 140)}`,
        category: 'github',
        priority: s.priority,
        urgency_score: s.urgencyScore,
        action_url: s.repoUrl,
        action_label: `Open ${s.repoName}`,
        secondary_url: '/github',
        why_now: `Fixing this improves your recruiter visibility, portfolio score, and GitHub health`,
        estimated_minutes: s.estimatedMinutes,
        effort_level: s.effort,
        source_type: 'github_repo',
        source_id: s.repoName,
        task_data: {
          repoName: s.repoName,
          repoUrl: s.repoUrl,
          weaknessCategory: s.weaknessCategory,
          fixDescription: s.fixDescription,
          suggestedCommands: s.suggestedCommands,
          impactArea: s.impactArea
        }
      }
    }

    case 'learning': {
      const s = signal as ResumeSignal
      return {
        ...base,
        title: `Learn: ${s.gapSkill}`,
        description: s.description,
        category: 'learning',
        priority: s.priority,
        urgency_score: s.urgencyScore,
        action_url: s.actionUrl,
        action_label: 'View Skill Plan',
        why_now: s.whyNow,
        estimated_minutes: s.estimatedMinutes,
        effort_level: 'medium',
        source_type: 'resume_gap',
        source_id: s.gapSkill,
        task_data: { gapSkill: s.gapSkill }
      }
    }

    case 'roadmap': {
      const s = signal as RoadmapSignal
      return {
        ...base,
        title: `Roadmap: ${s.topicTitle}`,
        description: `${s.sectionTitle} · ${s.roadmapLabel} — ${s.topicDescription}`,
        category: 'learning',
        priority: s.priority,
        urgency_score: s.urgencyScore,
        action_url: `/career/roadmap/${s.roadmapId}`,
        action_label: 'Open Roadmap',
        why_now: `Next step on your ${s.roadmapLabel} roadmap journey`,
        estimated_minutes: 45,
        effort_level: 'medium',
        source_type: 'roadmap_topic',
        source_id: s.topicId,
        task_data: { roadmapId: s.roadmapId, topicId: s.topicId }
      }
    }

    case 'subject_study': {
      const s = signal as SubjectSignal
      return {
        ...base,
        title: s.actionTitle,
        description: s.actionDescription,
        category: 'learning',
        priority: s.priority,
        urgency_score: s.urgencyScore,
        action_url: '/career/skills', // Generic URL or specific if we have one
        action_label: 'View Syllabus',
        why_now: `Regular study blocks for ${s.subject} will keep your academics on track.`,
        estimated_minutes: s.estimatedMinutes,
        effort_level: 'medium',
        source_type: 'subject',
        source_id: s.subject,
        task_data: { subject: s.subject, topic: s.topic }
      }
    }

    case 'job_opportunity': {
      const s = signal as JobSignal
      const deadlineLabel = s.deadline
        ? new Date(s.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        : null
      return {
        ...base,
        title: `Apply: ${s.title}${s.company ? ` at ${s.company}` : ''}`,
        description:
          `${s.matchScore}% match` +
          (deadlineLabel ? ` · Deadline ${deadlineLabel}` : '') +
          (s.reasons.length > 0 ? ` · ${s.reasons[0]}` : ''),
        category: 'job',
        priority: s.priority,
        urgency_score: s.urgencyScore,
        due_date: s.deadline ?? undefined,
        action_url: s.applicationUrl,
        action_label: 'Apply Now',
        secondary_url: '/career/market/jobs',
        why_now: `${s.matchScore}% skill match — ${s.reasons.slice(0, 2).join('; ') || 'strong fit based on your profile'}`,
        estimated_minutes: 30,
        effort_level: 'medium',
        source_type: 'opportunity',
        source_id: s.opportunityId,
        task_data: {
          company: s.company,
          matchScore: s.matchScore,
          deadline: s.deadline,
          reasons: s.reasons
        }
      }
    }

    case 'project': {
      const s = signal as ProjectSignal
      return {
        ...base,
        title: `${s.phaseName}: ${s.projectTitle}`,
        description:
          s.phaseDescription +
          (s.deliverable ? ` · Deliver: ${s.deliverable}` : ''),
        category: 'project',
        priority: s.priority,
        urgency_score: s.urgencyScore,
        action_url: `/career/foundry/project/${s.projectId}`,
        action_label: 'Open Project',
        why_now: `Phase ${s.currentPhase}/6 — consistent progress builds your portfolio and impresses recruiters`,
        estimated_minutes: s.estimatedDays * 60,
        effort_level: 'deep',
        source_type: 'project_phase',
        source_id: s.projectId,
        task_data: {
          projectId: s.projectId,
          projectTitle: s.projectTitle,
          currentPhase: s.currentPhase,
          phaseName: s.phaseName,
          deliverable: s.deliverable,
          techStack: s.techStack
        }
      }
    }
  }
}
