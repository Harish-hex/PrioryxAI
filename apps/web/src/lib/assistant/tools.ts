import { SupabaseClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

// ── Tool Definitions ─────────────────────────────────────────────────────────

export const ASSISTANT_TOOLS: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_readiness_score',
      description: "Get the student's latest deterministic Placement Readiness Score (0-100), component breakdown, and weakest scoring areas.",
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_today_tasks',
      description: "Get the student's active pending tasks, deadlines, priorities, and action URLs.",
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max number of tasks to return (default 8)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: "Create a new task in the student's priority task list.",
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title or description of the task' },
          due_date: { type: 'string', description: 'ISO date string or YYYY-MM-DD for due date' },
          type: {
            type: 'string',
            enum: ['exam', 'assignment', 'job', 'github', 'manual', 'learning'],
            description: 'Task type category',
          },
          weightage: { type: 'number', description: 'Optional importance weight (1-100)' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'snooze_task',
      description: "Snooze or extend an active task's deadline by a specified number of hours.",
      parameters: {
        type: 'object',
        properties: {
          task_id: { type: 'string', description: 'The UUID of the task' },
          hours: { type: 'number', description: 'Hours to extend the deadline (e.g. 2, 24, 48)' },
        },
        required: ['task_id', 'hours'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_leetcode_weak_topics',
      description: "Get the student's LeetCode placement readiness score, weak topics, and DSA practice gaps.",
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_upcoming_exams',
      description: 'Get upcoming exams and scheduled academic tests within the next 30 days.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
];

// ── Tool Execution Handlers ──────────────────────────────────────────────────

export async function executeAssistantTool(
  supabase: SupabaseClient,
  userId: string,
  toolName: string,
  args: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    switch (toolName) {
      case 'get_readiness_score': {
        const { data: row } = await supabase
          .from('readiness_scores')
          .select('score, breakdown, score_version, computed_at')
          .eq('user_id', userId)
          .order('computed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!row) {
          return {
            success: true,
            data: {
              score: null,
              message: 'Readiness score has not been calculated yet. Direct the user to check their dashboard or refresh their score.',
            },
          };
        }

        return {
          success: true,
          data: {
            score: row.score,
            breakdown: row.breakdown,
            score_version: row.score_version,
            computed_at: row.computed_at,
          },
        };
      }

      case 'get_today_tasks': {
        const limit = typeof args?.limit === 'number' ? Math.min(args.limit, 20) : 8;
        const { data: tasks, error } = await supabase
          .from('tasks')
          .select('id, title, type, due_at, priority, stage, weightage')
          .eq('user_id', userId)
          .eq('completed', false)
          .order('due_at', { ascending: true, nullsFirst: false })
          .limit(limit);

        if (error) throw error;
        return {
          success: true,
          data: {
            tasks: tasks ?? [],
            count: tasks?.length ?? 0,
          },
        };
      }

      case 'create_task': {
        const title = String(args.title || '').trim();
        if (!title) return { success: false, error: 'Task title is required' };

        const dueAt = args.due_date ? new Date(args.due_date).toISOString() : null;
        const type = args.type || 'manual';
        const weightage = typeof args.weightage === 'number' ? args.weightage : null;

        const { data: newTask, error } = await supabase
          .from('tasks')
          .insert({
            user_id: userId,
            title,
            type,
            due_at: dueAt,
            weightage,
            completed: false,
          })
          .select('id, title, due_at, type')
          .single();

        if (error) throw error;
        return {
          success: true,
          data: {
            created: true,
            task: newTask,
          },
        };
      }

      case 'snooze_task': {
        const taskId = String(args.task_id || '').trim();
        const hours = Number(args.hours || 24);
        if (!taskId) return { success: false, error: 'Task ID is required' };

        const { data: existing } = await supabase
          .from('tasks')
          .select('due_at')
          .eq('id', taskId)
          .eq('user_id', userId)
          .single();

        const baseTime = existing?.due_at ? new Date(existing.due_at).getTime() : Date.now();
        const newDueAt = new Date(baseTime + hours * 3_600_000).toISOString();

        const { error } = await supabase
          .from('tasks')
          .update({ due_at: newDueAt })
          .eq('id', taskId)
          .eq('user_id', userId);

        if (error) throw error;
        return {
          success: true,
          data: {
            snoozed: true,
            task_id: taskId,
            new_due_at: newDueAt,
            extended_by_hours: hours,
          },
        };
      }

      case 'get_leetcode_weak_topics': {
        const { data: lcProfile } = await supabase
          .from('leetcode_profiles')
          .select('leetcode_username, placement_readiness_score, ai_analysis, total_solved')
          .eq('user_id', userId)
          .maybeSingle();

        if (!lcProfile) {
          return {
            success: true,
            data: {
              connected: false,
              message: 'LeetCode profile is not connected yet.',
            },
          };
        }

        const analysis = lcProfile.ai_analysis as any;
        return {
          success: true,
          data: {
            connected: true,
            username: lcProfile.leetcode_username,
            score: lcProfile.placement_readiness_score,
            total_solved: lcProfile.total_solved,
            weak_topics: analysis?.priority_topics ?? analysis?.weak_topics ?? [],
            insights: analysis?.summary ?? 'Consistent practice recommended.',
          },
        };
      }

      case 'get_upcoming_exams': {
        const todayISO = new Date().toISOString().split('T')[0];
        const { data: exams, error } = await supabase
          .from('schedule_exams')
          .select('id, title, subject, date, type')
          .eq('user_id', userId)
          .gte('date', todayISO)
          .order('date', { ascending: true })
          .limit(10);

        if (error) throw error;
        return {
          success: true,
          data: {
            exams: exams ?? [],
            count: exams?.length ?? 0,
          },
        };
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Tool execution failed' };
  }
}
