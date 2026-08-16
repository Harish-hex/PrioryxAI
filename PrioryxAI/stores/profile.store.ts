import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface ProfileState {
  stats: {
    pending_tasks: number;
    completed_this_week: number;
    overdue: number;
    github_streak: number;
    health_score: number;
  } | null;
  contributions: Array<{ date: string; count: number }>;
  isLoadingStats: boolean;
  loadStats: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  stats: null,
  contributions: [],
  isLoadingStats: false,

  loadStats: async () => {
    set({ isLoadingStats: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        set({ isLoadingStats: false });
        return;
      }

      // Fetch tasks statistics
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session.user.id);

      const allTasks = tasks || [];
      const pending = allTasks.filter(t => t.status === 'pending' || !t.completed).length;
      const doneThisWeek = allTasks.filter(t => t.status === 'done' || t.completed).length;
      const overdue = allTasks.filter(t => (t.status === 'pending' || !t.completed) && t.due_at && new Date(t.due_at) < new Date()).length;

      // Fetch profile for github data
      const { data: profile } = await supabase
        .from('profiles')
        .select('github_streak_days, github_health_score, contribution_days')
        .eq('id', session.user.id)
        .maybeSingle();

      set({
        stats: {
          pending_tasks: pending,
          completed_this_week: doneThisWeek,
          overdue,
          github_streak: profile?.github_streak_days || 0,
          health_score: profile?.github_health_score || 85,
        },
        contributions: (profile?.contribution_days as any) || [],
        isLoadingStats: false,
      });
    } catch {
      set({ isLoadingStats: false });
    }
  },
}));
