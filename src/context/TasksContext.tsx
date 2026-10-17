import { createContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { CreateTaskInput, Task, UpdateTaskInput } from '../types/task';
import { INITIAL_TASKS } from '../constants/initialTasks';

export interface TasksContextValue {
  tasks: Task[];
  createTask: (input: CreateTaskInput) => void;
  updateTask: (id: string, input: UpdateTaskInput) => void;
  removeTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
  getTaskById: (id: string) => Task | undefined;
}

export const TasksContext = createContext<TasksContextValue | undefined>(undefined);

const generateId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  const value = useMemo<TasksContextValue>(
    () => ({
      tasks,
      createTask: (input) =>
        setTasks((prev) => [
          {
            ...input,
            id: generateId(),
            status: 'active',
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]),
      updateTask: (id, input) =>
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...input } : t)),
        ),
      removeTask: (id) => setTasks((prev) => prev.filter((t) => t.id !== id)),
      toggleTaskStatus: (id) =>
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id
              ? { ...t, status: t.status === 'active' ? 'completed' : 'active' }
              : t,
          ),
        ),
      getTaskById: (id) => tasks.find((t) => t.id === id),
    }),
    [tasks],
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}
