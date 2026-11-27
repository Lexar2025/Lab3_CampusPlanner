import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../../api/http';
import { createTask, updateTask } from '../../api/tasks';
import { useAuth } from '../../hooks/useAuth';
import type {
  CreateTaskInput,
  Task,
  TaskStatus,
  UpdateTaskInput,
} from '../../types/task';
import { taskKeys } from './queryKeys';

const NO_SESSION = 'Сессия не найдена.';

export function useCreateTask() {
  const { user, accessToken, signOut } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => {
      if (!accessToken) {
        throw new ApiError(NO_SESSION, 401);
      }
      return createTask(input, accessToken, signOut);
    },
    onSuccess: () => {
      if (user) {
        void queryClient.invalidateQueries({ queryKey: taskKeys.all(user.id) });
      }
    },
  });
}

export function useUpdateTask() {
  const { user, accessToken, signOut } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) => {
      if (!accessToken) {
        throw new ApiError(NO_SESSION, 401);
      }
      return updateTask(id, input, accessToken, signOut);
    },
    onSuccess: () => {
      if (user) {
        void queryClient.invalidateQueries({ queryKey: taskKeys.all(user.id) });
      }
    },
  });
}

interface ToggleVariables {
  id: string;
  status: TaskStatus;
}

interface ToggleContext {
  listSnapshots: [readonly unknown[], Task[] | undefined][];
  detailSnapshot: Task | undefined;
}

export function useToggleTaskStatus() {
  const { user, accessToken, signOut } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: ToggleVariables) => {
      if (!accessToken) {
        throw new ApiError(NO_SESSION, 401);
      }
      return updateTask(id, { status }, accessToken, signOut);
    },
    onMutate: async ({ id, status }) => {
      if (!user) return undefined;

      await queryClient.cancelQueries({ queryKey: taskKeys.all(user.id) });

      const context: ToggleContext = {
        listSnapshots: queryClient.getQueriesData<Task[]>({
          queryKey: taskKeys.lists(user.id),
        }),
        detailSnapshot: queryClient.getQueryData<Task>(
          taskKeys.detail(user.id, id),
        ),
      };

      queryClient.setQueriesData<Task[]>(
        { queryKey: taskKeys.lists(user.id) },
        (old) =>
          old
            ? old.map((task) => (task.id === id ? { ...task, status } : task))
            : old,
      );
      queryClient.setQueryData<Task>(taskKeys.detail(user.id, id), (old) =>
        old ? { ...old, status } : old,
      );

      return context;
    },
    onError: (_error, variables, context) => {
      if (!context || !user) return;

      for (const [key, data] of context.listSnapshots) {
        queryClient.setQueryData(key, data);
      }
      queryClient.setQueryData(
        taskKeys.detail(user.id, variables.id),
        context.detailSnapshot,
      );
    },
    onSettled: () => {
      if (user) {
        void queryClient.invalidateQueries({ queryKey: taskKeys.all(user.id) });
      }
    },
  });
}
