import { createContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../types/task';

export interface TasksContextValue {
  tasks: Task[];
  lastCreatedId: string | null;
  clearLastCreatedId: () => void;
  getTaskById: (id: string) => Task | undefined;
  createTask: (input: CreateTaskInput) => void;
  updateTask: (id: string, input: UpdateTaskInput) => void;
  removeTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
}

export const TasksContext = createContext<TasksContextValue | undefined>(undefined);

const INITIAL_TASKS: Task[] = [
  {
    id: 'seed-1',
    title: 'Лабораторная 4: анимации Reanimated',
    subject: 'Мобильная разработка',
    priority: 'high',
    status: 'active',
    createdAt: '2026-11-02T09:00:00.000Z',
    dueDate: '2026-11-20',
    description: 'Четыре анимированных сценария: статус, раскрытие, список, прогресс.',
  },
  {
    id: 'seed-2',
    title: 'Конспект: useSharedValue и useAnimatedStyle',
    subject: 'Мобильная разработка',
    priority: 'medium',
    status: 'completed',
    createdAt: '2026-10-28T18:30:00.000Z',
    description: 'SharedValue хранит прогресс анимации, а не бизнес-данные.',
  },
  {
    id: 'seed-3',
    title: 'Отчёт по лабораторной 3',
    subject: 'Мобильная разработка',
    priority: 'low',
    status: 'active',
    createdAt: '2026-10-30T12:00:00.000Z',
    dueDate: '2026-11-01',
  },
  {
    id: 'seed-4',
    title: 'Повторить архитектуру контекстов',
    subject: 'Мобильная разработка',
    priority: 'medium',
    status: 'active',
    createdAt: '2026-11-04T08:15:00.000Z',
  },
];

const generateId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);

  const value = useMemo<TasksContextValue>(() => ({
    tasks,
    lastCreatedId,
    clearLastCreatedId: () => setLastCreatedId(null),
    getTaskById: (id) => tasks.find((t) => t.id === id),
    createTask: (input) => {
      const task: Task = {
        ...input,
        id: generateId(),
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [task, ...prev]);
      setLastCreatedId(task.id);
    },
    updateTask: (id, input) =>
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...input } : t))),
    removeTask: (id) => setTasks((prev) => prev.filter((t) => t.id !== id)),
    toggleTaskStatus: (id) =>
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, status: t.status === 'active' ? 'completed' : 'active' }
            : t,
        ),
      ),
  }), [tasks, lastCreatedId]);

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}