import type { Task, TaskStatusFilter } from '../types/task';
import { parseDateOnly, sortTasksByPriority } from './task';
import { PRIORITY_ORDER } from '../theme/priority';

export type TaskSectionKey =
  | 'overdue'
  | 'today'
  | 'tomorrow'
  | 'thisWeek'
  | 'later'
  | 'noDueDate'
  | 'completed';

export interface TaskSection {
  key: TaskSectionKey;
  title: string;
  tasks: Task[];
}

export type TaskListRow =
  | {
      kind: 'section';
      key: string;
      title: string;
      count: number;
      overdue: boolean;
    }
  | { kind: 'task'; key: string; task: Task };

const SECTION_TITLES: Record<TaskSectionKey, string> = {
  overdue: 'Просрочено',
  today: 'Сегодня',
  tomorrow: 'Завтра',
  thisWeek: 'На этой неделе',
  later: 'Позже',
  noDueDate: 'Без срока',
  completed: 'Выполненные',
};

function dayStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function dayDiff(due: Date): number {
  const start = dayStart();
  return Math.round((due.getTime() - start.getTime()) / 86_400_000);
}

function priorityCompare(a: Task, b: Task): number {
  return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
}

function dateCompare(a: Task, b: Task): number {
  const da = parseDateOnly(a.dueDate ?? '');
  const db = parseDateOnly(b.dueDate ?? '');
  if (!da || !db) return priorityCompare(a, b);
  const diff = da.getTime() - db.getTime();
  if (diff !== 0) return diff;
  return priorityCompare(a, b);
}

export function groupTasksByDueDate(
  tasks: Task[],
  filter: TaskStatusFilter,
): TaskSection[] {
  const active = tasks.filter((t) => t.status === 'active');
  const completed = tasks.filter((t) => t.status === 'completed');

  if (filter === 'completed') {
    const sortedCompleted = sortTasksByPriority(completed);
    if (sortedCompleted.length === 0) return [];
    return [
      {
        key: 'completed',
        title: SECTION_TITLES.completed,
        tasks: sortedCompleted,
      },
    ];
  }

  const overdue: Task[] = [];
  const today: Task[] = [];
  const tomorrow: Task[] = [];
  const thisWeek: Task[] = [];
  const later: Task[] = [];
  const noDueDate: Task[] = [];

  for (const task of active) {
    const due = task.dueDate ? parseDateOnly(task.dueDate) : null;
    if (!due) {
      noDueDate.push(task);
      continue;
    }
    const diff = dayDiff(due);
    if (diff < 0) overdue.push(task);
    else if (diff === 0) today.push(task);
    else if (diff === 1) tomorrow.push(task);
    else if (diff <= 7) thisWeek.push(task);
    else later.push(task);
  }

  overdue.sort(dateCompare);
  today.sort(dateCompare);
  tomorrow.sort(dateCompare);
  thisWeek.sort(dateCompare);
  later.sort(dateCompare);
  const sortedNoDueDate = sortTasksByPriority(noDueDate);

  const sections: TaskSection[] = [];

  if (overdue.length > 0) {
    sections.push({ key: 'overdue', title: SECTION_TITLES.overdue, tasks: overdue });
  }
  if (today.length > 0) {
    sections.push({ key: 'today', title: SECTION_TITLES.today, tasks: today });
  }
  if (tomorrow.length > 0) {
    sections.push({ key: 'tomorrow', title: SECTION_TITLES.tomorrow, tasks: tomorrow });
  }
  if (thisWeek.length > 0) {
    sections.push({ key: 'thisWeek', title: SECTION_TITLES.thisWeek, tasks: thisWeek });
  }
  if (later.length > 0) {
    sections.push({ key: 'later', title: SECTION_TITLES.later, tasks: later });
  }
  if (sortedNoDueDate.length > 0) {
    sections.push({ key: 'noDueDate', title: SECTION_TITLES.noDueDate, tasks: sortedNoDueDate });
  }
  if (filter === 'all') {
    const sortedCompleted = sortTasksByPriority(completed);
    if (sortedCompleted.length > 0) {
      sections.push({
        key: 'completed',
        title: SECTION_TITLES.completed,
        tasks: sortedCompleted,
      });
    }
  }

  return sections;
}

export function buildTaskRows(sections: TaskSection[]): TaskListRow[] {
  const rows: TaskListRow[] = [];
  for (const section of sections) {
    rows.push({
      kind: 'section',
      key: `section:${section.key}`,
      title: section.title,
      count: section.tasks.length,
      overdue: section.key === 'overdue',
    });
    for (const task of section.tasks) {
      rows.push({ kind: 'task', key: `task:${task.id}`, task });
    }
  }
  return rows;
}
