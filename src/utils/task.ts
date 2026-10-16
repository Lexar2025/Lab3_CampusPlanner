import type { Task, TaskStatus } from '../types/task';
import { PRIORITY_ORDER } from '../theme/priority';

export interface TaskStats {
  total: number;
  active: number;
  completed: number;
}

export function getTaskStats(tasks: Task[]): TaskStats {
  const completed = tasks.filter((t) => t.status === 'completed').length;
  return {
    total: tasks.length,
    active: tasks.length - completed,
    completed,
  };
}

/** Чистая функция — возвращает новый массив, отсортированный high → medium → low */
export function sortTasksByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );
}

export function filterTasksByStatus(tasks: Task[], status: TaskStatus): Task[] {
  return tasks.filter((t) => t.status === status);
}

/** Задача просрочена, если dueDate в прошлом и задача ещё не выполнена */
export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate) return false;
  if (task.status === 'completed') return false;
  return new Date(task.dueDate).getTime() < Date.now();
}

/** Бонус: поиск по title и subject (регистронезависимый) */
export function filterTasks(tasks: Task[], query: string): Task[] {
  const q = query.trim().toLowerCase();
  if (!q) return tasks;
  return tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q),
  );
}
