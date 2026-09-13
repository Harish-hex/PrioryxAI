import { useTasksStore } from '@/stores/tasks.store';

export function useTasks() {
  const { tasks, isLoading, loadTasks, addTask, markDone, deleteTask, snoozeTask } = useTasksStore();
  return {
    tasks,
    isLoading,
    loadTasks,
    addTask,
    markDone,
    deleteTask,
    snoozeTask,
  };
}
