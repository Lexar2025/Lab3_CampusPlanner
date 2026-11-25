import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage, isUnauthorizedError } from '../../api/client';
import { ApiError } from '../../api/http';
import { deleteTask } from '../../api/tasks';
import { useAuth } from '../../hooks/useAuth';
import type { Task, TaskStatusFilter } from '../../types/task';
import { taskKeys } from './queryKeys';

const DELETE_DELAY_MS = 5000;
const NO_SESSION = 'Сессия не найдена.';

export interface TasksUiContextValue {
  lastCreatedId: string | null;
  markCreated: (id: string) => void;
  clearLastCreated: () => void;
  statusFilter: TaskStatusFilter;
  searchQuery: string;
  setStatusFilter: (filter: TaskStatusFilter) => void;
  setSearchQuery: (query: string) => void;
  resetListView: () => void;
  pendingIds: ReadonlySet<string>;
  latestPending: Task | null;
  scheduleDelete: (task: Task) => void;
  undoDelete: (id: string) => void;
  isPending: (id: string) => boolean;
}

export const TasksUiContext = createContext<TasksUiContextValue | undefined>(
  undefined,
);

interface PendingEntry {
  task: Task;
  timer: ReturnType<typeof setTimeout>;
  token: string | null;
  deleting: boolean;
}

export function TasksUiProvider({ children }: { children: ReactNode }) {
  const { user, accessToken, signOut } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? '';

  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [latestPending, setLatestPending] = useState<Task | null>(null);

  const pendingRef = useRef<Map<string, PendingEntry>>(new Map());

  /** Переносит текущую Map в состояние; вызывается только вне рендера. */
  const syncPendingState = useCallback(() => {
    const entries = Array.from(pendingRef.current.values());
    setPendingIds(new Set(entries.map((entry) => entry.task.id)));
    const waiting = entries.filter((entry) => !entry.deleting);
    setLatestPending(waiting.length > 0 ? waiting[waiting.length - 1].task : null);
  }, []);

  const removePending = useCallback(
    (id: string) => {
      const entry = pendingRef.current.get(id);
      if (!entry) return;
      clearTimeout(entry.timer);
      pendingRef.current.delete(id);
      syncPendingState();
    },
    [syncPendingState],
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      const entry = pendingRef.current.get(id);
      const token = entry?.token ?? null;
      if (!token) {
        throw new ApiError(NO_SESSION, 401);
      }
      return deleteTask(id, token, signOut);
    },
    onSuccess: (_data, id) => {
      removePending(id);
      if (!userId) return;
      queryClient.setQueriesData<Task[]>(
        { queryKey: taskKeys.lists(userId) },
        (old) => (old ? old.filter((task) => task.id !== id) : old),
      );
      queryClient.removeQueries({
        queryKey: taskKeys.detail(userId, id),
        exact: true,
      });
      void queryClient.invalidateQueries({ queryKey: taskKeys.all(userId) });
    },
    onError: (error, id) => {
      removePending(id);
      if (!isUnauthorizedError(error)) {
        Alert.alert('Не удалось удалить задачу', getErrorMessage(error));
      }
    },
  });

  const { mutate: deleteMutate } = deleteMutation;

  const scheduleDelete = useCallback(
    (task: Task) => {
      if (pendingRef.current.has(task.id)) return;
      const token = accessToken;
      const timer = setTimeout(() => {
        const entry = pendingRef.current.get(task.id);
        if (!entry) return;
        entry.deleting = true;
        syncPendingState();
        deleteMutate(task.id);
      }, DELETE_DELAY_MS);

      pendingRef.current.set(task.id, {
        task,
        timer,
        token,
        deleting: false,
      });
      syncPendingState();
    },
    [accessToken, deleteMutate, syncPendingState],
  );

  const undoDelete = useCallback(
    (id: string) => {
      const entry = pendingRef.current.get(id);
      // После отправки DELETE отмена уже ничего не вернёт на сервере.
      if (!entry || entry.deleting) return;
      removePending(id);
    },
    [removePending],
  );

  // Выход из аккаунта: таймеры не доживают, а ожидающие удаления уходят сразу.
  useEffect(() => {
    const entries = pendingRef.current;
    return () => {
      for (const entry of Array.from(entries.values())) {
        clearTimeout(entry.timer);
        if (!entry.deleting && entry.token) {
          void deleteTask(entry.task.id, entry.token, signOut).catch(
            () => undefined,
          );
        }
      }
      entries.clear();
    };
  }, [signOut]);

  const isPending = useCallback((id: string) => pendingIds.has(id), [pendingIds]);

  const markCreated = useCallback((id: string) => setLastCreatedId(id), []);
  const clearLastCreated = useCallback(() => setLastCreatedId(null), []);

  const resetListView = useCallback(() => {
    setStatusFilter('all');
    setSearchQuery('');
  }, []);

  const value = useMemo<TasksUiContextValue>(
    () => ({
      lastCreatedId,
      markCreated,
      clearLastCreated,
      statusFilter,
      searchQuery,
      setStatusFilter,
      setSearchQuery,
      resetListView,
      pendingIds,
      latestPending,
      scheduleDelete,
      undoDelete,
      isPending,
    }),
    [
      lastCreatedId,
      markCreated,
      clearLastCreated,
      statusFilter,
      searchQuery,
      resetListView,
      pendingIds,
      latestPending,
      scheduleDelete,
      undoDelete,
      isPending,
    ],
  );

  return (
    <TasksUiContext.Provider value={value}>{children}</TasksUiContext.Provider>
  );
}

export function useTasksUi(): TasksUiContextValue {
  const ctx = useContext(TasksUiContext);
  if (!ctx) {
    throw new Error('useTasksUi() должен вызываться внутри <TasksUiProvider>');
  }
  return ctx;
}
