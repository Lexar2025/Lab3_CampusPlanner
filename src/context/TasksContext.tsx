import { createContext, useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { CreateTaskInput, Task, UpdateTaskInput } from '../types/task';
import { INITIAL_TASKS } from '../constants/initialTasks';

export interface TasksContextValue {
  tasks: Task[];
  lastCreatedId: string | null;
  createTask: (input: CreateTaskInput) => void;
  updateTask: (id: string, input: UpdateTaskInput) => void;
  removeTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
  restoreTask: (task: Task, index: number) => void;
  clearLastCreated: () => void;
  getTaskById: (id: string) => Task | undefined;
}

export const TasksContext = createContext<TasksContextValue | undefined>(undefined);

const generateId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);

  const clearLastCreated = useCallback(() => setLastCreatedId(null), []);

  const value = useMemo<TasksContextValue>(
    () => ({
      tasks,
      lastCreatedId,
      createTask: (input) => {
        const id = generateId();
        setTasks((prev) => [
          {
            ...input,
            id,
            status: 'active',
            dueDate: input.dueDate ?? null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setLastCreatedId(id);
      },
      updateTask: (id, input) =>
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...input } : t)),
        ),
      removeTask: (id) => setTasks((prev) => prev.filter((t) => t.id !== id)),
      restoreTask: (task, index) =>
        setTasks((prev) => {
          const next = [...prev];
          const at = Math.max(0, Math.min(index, next.length));
          next.splice(at, 0, task);
          return next;
        }),
      toggleTaskStatus: (id) =>
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id
              ? { ...t, status: t.status === 'active' ? 'completed' : 'active' }
              : t,
          ),
        ),
      clearLastCreated,
      getTaskById: (id) => tasks.find((t) => t.id === id),
    }),
    [tasks, lastCreatedId, clearLastCreated],
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}
