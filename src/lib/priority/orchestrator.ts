import { SupabaseClient } from '@supabase/supabase-js'
import { generateDailyPlan } from './ai-planner'

export interface OrchestratorResult {
  tasks: Record<string, unknown>[]
  plan: Record<string, unknown>
  fromCache: boolean
}

export async function runPriorityOrchestrator(
  db: SupabaseClient,
  userId: string,
  forceRegenerate = false
): Promise<OrchestratorResult> {
  const today = new Date().toISOString().split('T')[0]

  // ── 1. Check Supabase cache ───────────────────────────────
  if (!forceRegenerate) {
    const { data: existingPlan } = await db
      .from('daily_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_date', today)
      .maybeSingle()

    if (existingPlan) {
      console.log('[Orchestrator] Serving cached plan for', today)

      const { data: tasks } = await db
        .from('priority_tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('scheduled_for', today)
        .eq('dismissed', false)
        .eq('completed', false)
        .order('urgency_score', { ascending: false })

      return {
        tasks: (tasks ?? []) as Record<string, unknown>[],
        plan: existingPlan.plan_data as Record<string, unknown>,
        fromCache: true
      }
    }
  }

  console.log('[Orchestrator] Generating fresh plan for', userId)

  // ── 2. Generate plan ──────────────────────────────────────
  const plan = await generateDailyPlan(db, userId)

  // ── 3. Clear stale tasks for today (not completed) ────────
  await db
    .from('priority_tasks')
    .delete()
    .eq('user_id', userId)
    .eq('scheduled_for', today)
    .eq('completed', false)

  // ── 4. Insert fresh tasks ─────────────────────────────────
  let savedTasks: Record<string, unknown>[] = []
  if (plan.tasks.length > 0) {
    const { data: inserted, error: insertErr } = await db
      .from('priority_tasks')
      .insert(plan.tasks)
      .select()

    if (insertErr) {
      console.error('[Orchestrator] Task insert error:', insertErr.message)
      // Return in-memory tasks even if DB save failed
      savedTasks = plan.tasks as unknown as Record<string, unknown>[]
    } else {
      savedTasks = (inserted ?? []) as Record<string, unknown>[]
      console.log('[Orchestrator] Saved', savedTasks.length, 'tasks to DB')
    }
  }

  // ── 5. Upsert daily plan ──────────────────────────────────
  const { error: planErr } = await db
    .from('daily_plans')
    .upsert({
      user_id: userId,
      plan_date: today,
      todays_focus: plan.todaysFocus,
      urgent_alerts: plan.urgentAlerts,
      insights: plan.insights,
      total_estimated_minutes: plan.totalMinutesToday,
      plan_data: plan as unknown as Record<string, unknown>,
      generated_at: plan.generatedAt
    }, { onConflict: 'user_id,plan_date' })

  if (planErr) {
    console.error('[Orchestrator] Plan upsert error:', planErr.message)
  } else {
    console.log('[Orchestrator] Daily plan saved for', today)
  }

  return {
    tasks: savedTasks,
    plan: plan as unknown as Record<string, unknown>,
    fromCache: false
  }
}
