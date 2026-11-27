import type { TaskStatusFilter } from '../../types/task';

export const taskKeys = {
  all: (userId: string) => ['tasks', userId] as const,
  lists: (userId: string) => ['tasks', userId, 'list'] as const,
  list: (userId: string, status: TaskStatusFilter) =>
    ['tasks', userId, 'list', { status }] as const,
  detail: (userId: string, id: string) =>
    ['tasks', userId, 'detail', id] as const,
};
