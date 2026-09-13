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
  // Roadmap-started tasks ("Learn: X", source_type = 'roadmap_topic') are
  // deliberately excluded — they're something the user explicitly chose to
  // start on a roadmap, not a regenerated AI suggestion, so a plan refresh
  // must never silently wipe them out from under the user.
  await db
    .from('priority_tasks')
    .delete()
    .eq('user_id', userId)
    .eq('scheduled_for', today)
    .eq('completed', false)
    .neq('source_type', 'roadmap_topic')

  // ── 4. Insert fresh tasks ─────────────────────────────────
  if (plan.tasks.length > 0) {
    const { error: insertErr } = await db
      .from('priority_tasks')
      .insert(plan.tasks)

    if (insertErr) {
      console.error('[Orchestrator] Task insert error:', insertErr.message)
    }
  }

  // ── 4b. Re-read the full task list for today ───────────────
  // Returning only the just-inserted rows would drop the preserved
  // roadmap-started tasks from step 3 — read everything back together.
  const { data: allTodayTasks } = await db
    .from('priority_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('scheduled_for', today)
    .eq('completed', false)
    .eq('dismissed', false)
    .order('urgency_score', { ascending: false })

  const savedTasks: Record<string, unknown>[] =
    (allTodayTasks as Record<string, unknown>[] | null) ?? (plan.tasks as unknown as Record<string, unknown>[])

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
