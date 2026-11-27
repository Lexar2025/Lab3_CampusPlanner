import type { TaskPriority } from '../types/task';

export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#16A34A',
  medium: '#D97706',
  high: '#DC2626',
};
