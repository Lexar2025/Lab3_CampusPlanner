import { useContext } from 'react';
import { TasksContext, type TasksContextValue } from '../context/TasksContext';

export function useTasks(): TasksContextValue {
  const ctx = useContext(TasksContext);
  if (!ctx) {
    throw new Error('useTasks() должен вызываться внутри <TasksProvider>');
  }
  return ctx;
}
