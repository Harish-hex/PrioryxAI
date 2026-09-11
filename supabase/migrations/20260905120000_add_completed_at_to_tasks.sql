-- Add completed_at column to track when tasks were actually completed
-- This enables accurate "Done this week" calculation instead of relying on due dates

ALTER TABLE tasks ADD COLUMN completed_at timestamptz;

-- Update get_task_stats function to use completed_at instead of due_at for weekly completion count
CREATE OR REPLACE FUNCTION public.get_task_stats(p_user_id uuid, p_week_start timestamp with time zone)
 RETURNS TABLE(total_tasks integer, pending_tasks integer, completed_tasks integer, completed_this_week integer, overdue integer, by_type jsonb)
 LANGUAGE sql
 STABLE
AS $function$
  with base as (
    select
      count(*)::int as total_tasks,
      count(*) filter (where not completed)::int as pending_tasks,
      count(*) filter (where completed)::int as completed_tasks,
      count(*) filter (where completed and completed_at >= p_week_start)::int as completed_this_week,
      count(*) filter (where not completed and due_at < now())::int as overdue
    from tasks
    where user_id = p_user_id
  ),
  by_type_agg as (
    select coalesce(
      jsonb_object_agg(type, jsonb_build_object('total', total, 'pending', pending, 'completed', completed)),
      '{}'::jsonb
    ) as by_type
    from (
      select
        type,
        count(*)::int as total,
        count(*) filter (where not completed)::int as pending,
        count(*) filter (where completed)::int as completed
      from tasks
      where user_id = p_user_id
      group by type
    ) g
  )
  select base.total_tasks, base.pending_tasks, base.completed_tasks, base.completed_this_week, base.overdue, by_type_agg.by_type
  from base, by_type_agg;
$function$
