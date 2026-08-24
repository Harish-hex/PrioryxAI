import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { apiCall } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants/api';
import { AppHaptics } from '@/lib/haptics';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  type?: string | null;
  status: 'pending' | 'done';
  completed?: boolean;
  deadline?: string | null;
  due_at?: string | null;
  estimated_hours?: number | null;
  category?: string | null;
  source?: 'manual' | 'ai' | 'timetable' | 'exam' | string | null;
  created_at?: string;
}

interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  loadTasks: (userId?: string) => Promise<void>;
  addTask: (taskData: Partial<Task>) => Promise<void>;
  markDone: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  snoozeTask: (id: string, hours: number) => Promise<void>;
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  isLoading: false,
  
  loadTasks: async (userId) => {
    set({ isLoading: true });
    try {
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        targetUserId = session?.user?.id;
      }
      if (!targetUserId) {
        set({ tasks: [], isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        set({ tasks: data, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
  
  addTask: async (taskData) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    
    const newTask: Partial<Task> = {
      ...taskData,
      priority: taskData.priority || 'medium',
      status: 'pending',
      source: taskData.source || 'manual',
    };

    try {
      const { task } = await apiCall<{ task: Task }>(API_ENDPOINTS.tasks, {
        method: 'POST',
        body: JSON.stringify(newTask),
      });
      AppHaptics.success();
      set(state => ({ tasks: [task, ...state.tasks] }));
    } catch {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...newTask,
          user_id: session.user.id,
        })
        .select()
        .single();

      if (!error && data) {
        AppHaptics.success();
        set(state => ({ tasks: [data, ...state.tasks] }));
      }
    }
  },
  
  markDone: async (id) => {
    AppHaptics.success();
    // Optimistic update
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
    try {
      await apiCall(`${API_ENDPOINTS.tasks}/${id}/complete`, { method: 'PATCH' });
    } catch {
      await supabase.from('tasks').update({ status: 'done', completed: true }).eq('id', id);
    }
  },
  
  deleteTask: async (id) => {
    AppHaptics.warning();
    // Optimistic update
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
    await supabase.from('tasks').delete().eq('id', id);
  },

  snoozeTask: async (id, hours) => {
    AppHaptics.medium();
    const newDue = new Date(Date.now() + hours * 3600 * 1000).toISOString();
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, due_at: newDue, deadline: newDue } : t),
    }));
    try {
      await apiCall(`${API_ENDPOINTS.tasks}/${id}/snooze`, {
        method: 'POST',
        body: JSON.stringify({ hours }),
      });
    } catch {
      await supabase.from('tasks').update({ due_at: newDue, deadline: newDue }).eq('id', id);
    }
  },
}));
