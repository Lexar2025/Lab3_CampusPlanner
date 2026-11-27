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

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Разбирает YYYY-MM-DD как локальную дату без сдвига часового пояса */
export function parseDateOnly(value: string): Date | null {
  const match = DATE_ONLY_PATTERN.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/** Форматирует YYYY-MM-DD; невалидную строку возвращает как есть */
export function formatDateOnly(
  value: string,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  },
): string {
  const date = parseDateOnly(value);
  if (!date) return value;
  return date.toLocaleDateString('ru-RU', options);
}

export function formatIsoDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatIsoDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Задача просрочена, если срок закончился и задача ещё не выполнена */
export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate) return false;
  if (task.status === 'completed') return false;

  const due = parseDateOnly(task.dueDate);
  if (!due) return false;

  const endOfDay = new Date(
    due.getFullYear(),
    due.getMonth(),
    due.getDate(),
    23,
    59,
    59,
    999,
  );
  return endOfDay.getTime() < Date.now();
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
