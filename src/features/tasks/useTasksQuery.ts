import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ApiError } from '../../api/http';
import { getTaskById, getTasks } from '../../api/tasks';
import { useAuth } from '../../hooks/useAuth';
import type { TaskStatusFilter } from '../../types/task';
import { taskKeys } from './queryKeys';

const NO_SESSION = 'Сессия не найдена.';

/** Список задач с серверным фильтром по статусу */
export function useTasksQuery(filter: TaskStatusFilter) {
  const { user, accessToken, signOut } = useAuth();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: taskKeys.list(userId, filter),
    enabled: Boolean(user && accessToken),
    placeholderData: keepPreviousData,
    queryFn: () => {
      if (!accessToken) {
        throw new ApiError(NO_SESSION, 401);
      }
      return getTasks(
        accessToken,
        filter === 'all' ? undefined : { status: filter },
        signOut,
      );
    },
  });
}

/** Полный список без фильтра — для статистики при активном фильтре */
export function useAllTasksQuery() {
  const { user, accessToken, signOut } = useAuth();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: taskKeys.list(userId, 'all'),
    enabled: Boolean(user && accessToken),
    queryFn: () => {
      if (!accessToken) {
        throw new ApiError(NO_SESSION, 401);
      }
      return getTasks(accessToken, undefined, signOut);
    },
  });
}

/** Одна задача по идентификатору */
export function useTaskQuery(id: string | undefined) {
  const { user, accessToken, signOut } = useAuth();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: taskKeys.detail(userId, id ?? ''),
    enabled: Boolean(user && accessToken && id),
    queryFn: () => {
      if (!accessToken || !id) {
        throw new ApiError(NO_SESSION, 401);
      }
      return getTaskById(id, accessToken, signOut);
    },
  });
}
