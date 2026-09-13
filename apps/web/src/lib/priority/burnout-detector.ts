/**
 * Burnout Detector — Phase 3 (folded into Phase 1 LLM call)
 *
 * Derives workload signals from existing tasks table data.
 * NO LLM call here — pure arithmetic on completion velocity.
 * The signals are fed as context to the Phase 1 GPT-4o call
 * so that model can emit burnoutRisk + burnoutNote.
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface WorkloadState {
  completedToday: number
  completedThisWeek: number
  pendingToday: number
  totalPending: number
  examPressure: 'high' | 'medium' | 'low' | 'none'
  velocityTrend: 'rising' | 'stable' | 'falling'
  /** Derived 0-100 score; >70 = likely overloaded */
  riskScore: number
  /** Human-readable summary for LLM context */
  summary: string
}

export async function getBurnoutState(
  db: SupabaseClient,
  userId: string,
  examDaysUntilNearest: number | null
): Promise<WorkloadState> {
  const now = new Date()
  const todayISO = now.toISOString().split('T')[0]

  // Start of current week (Monday)
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - (dayOfWeek - 1))
  const weekStartISO = weekStart.toISOString().split('T')[0]

  // Start of prior week (for velocity comparison)
  const priorWeekStart = new Date(weekStart)
  priorWeekStart.setDate(weekStart.getDate() - 7)
  const priorWeekStartISO = priorWeekStart.toISOString().split('T')[0]

  try {
    const [
      todayCompletedRes,
      thisWeekCompletedRes,
      priorWeekCompletedRes,
      pendingRes,
    ] = await Promise.allSettled([
      db
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('updated_at', `${todayISO}T00:00:00`),
      db
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('updated_at', `${weekStartISO}T00:00:00`),
      db
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('updated_at', `${priorWeekStartISO}T00:00:00`)
        .lt('updated_at', `${weekStartISO}T00:00:00`),
      db
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('completed', false),
    ])

    const completedToday =
      todayCompletedRes.status === 'fulfilled'
        ? (todayCompletedRes.value.count ?? 0)
        : 0

    const completedThisWeek =
      thisWeekCompletedRes.status === 'fulfilled'
        ? (thisWeekCompletedRes.value.count ?? 0)
        : 0

    const completedPriorWeek =
      priorWeekCompletedRes.status === 'fulfilled'
        ? (priorWeekCompletedRes.value.count ?? 0)
        : completedThisWeek // fallback: assume stable

    const totalPending =
      pendingRes.status === 'fulfilled' ? (pendingRes.value.count ?? 0) : 0

    // Velocity trend: compare this week vs prior week
    let velocityTrend: WorkloadState['velocityTrend'] = 'stable'
    if (completedPriorWeek > 0) {
      const ratio = completedThisWeek / completedPriorWeek
      if (ratio < 0.6) velocityTrend = 'falling'
      else if (ratio > 1.4) velocityTrend = 'rising'
    }

    // Exam pressure
    let examPressure: WorkloadState['examPressure'] = 'none'
    if (examDaysUntilNearest !== null) {
      if (examDaysUntilNearest <= 2) examPressure = 'high'
      else if (examDaysUntilNearest <= 5) examPressure = 'medium'
      else examPressure = 'low'
    }

    // Risk score (0-100):
    // - Falling velocity + rising pending = overload
    // - Exam pressure amplifies risk
    let riskScore = 0
    if (velocityTrend === 'falling') riskScore += 30
    if (velocityTrend === 'stable') riskScore += 10
    if (totalPending > 15) riskScore += 25
    else if (totalPending > 8) riskScore += 15
    if (completedToday === 0 && completedThisWeek < 3) riskScore += 20
    if (examPressure === 'high') riskScore += 25
    else if (examPressure === 'medium') riskScore += 10

    riskScore = Math.min(100, riskScore)

    const summary = [
      `Completed today: ${completedToday}, this week: ${completedThisWeek} (prior week: ${completedPriorWeek})`,
      `Pending tasks: ${totalPending}`,
      `Velocity trend: ${velocityTrend}`,
      `Exam pressure: ${examPressure}`,
      `Derived risk score: ${riskScore}/100`,
    ].join('. ')

    return {
      completedToday,
      completedThisWeek,
      pendingToday: completedToday, // approximation — today's completed is the activity signal
      totalPending,
      examPressure,
      velocityTrend,
      riskScore,
      summary,
    }
  } catch (err) {
    console.error('[BurnoutDetector] Error computing workload state:', err)
    // Fail safe — return neutral state so LLM still runs
    return {
      completedToday: 0,
      completedThisWeek: 0,
      pendingToday: 0,
      totalPending: 0,
      examPressure: 'none',
      velocityTrend: 'stable',
      riskScore: 0,
      summary: 'Workload data unavailable — assuming normal load.',
    }
  }
}
