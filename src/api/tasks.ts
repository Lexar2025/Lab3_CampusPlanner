import type {
  CreateTaskInput,
  Task,
  TaskListParams,
  TaskListResponse,
  TaskResponse,
  UpdateTaskInput,
} from '../types/task';
import { apiRequest } from './client';

/** Список задач; статус фильтруется на сервере */
export async function getTasks(
  token: string,
  params?: TaskListParams,
  onUnauthorized?: () => void | Promise<void>,
): Promise<Task[]> {
  const query = new URLSearchParams();
  if (params?.status) {
    query.set('status', params.status);
  }
  const suffix = query.toString() ? `?${query.toString()}` : '';

  const data = await apiRequest<TaskListResponse>(
    `/tasks${suffix}`,
    token,
    undefined,
    onUnauthorized,
  );
  return data.items;
}

/** Одна задача по идентификатору */
export async function getTaskById(
  id: string,
  token: string,
  onUnauthorized?: () => void | Promise<void>,
): Promise<Task> {
  const data = await apiRequest<TaskResponse>(
    `/tasks/${encodeURIComponent(id)}`,
    token,
    undefined,
    onUnauthorized,
  );
  return data.item;
}

/** Создание задачи */
export async function createTask(
  input: CreateTaskInput,
  token: string,
  onUnauthorized?: () => void | Promise<void>,
): Promise<Task> {
  const data = await apiRequest<TaskResponse>(
    '/tasks',
    token,
    { method: 'POST', body: JSON.stringify(input) },
    onUnauthorized,
  );
  return data.item;
}

/** Частичное обновление задачи, включая статус */
export async function updateTask(
  id: string,
  input: UpdateTaskInput,
  token: string,
  onUnauthorized?: () => void | Promise<void>,
): Promise<Task> {
  const data = await apiRequest<TaskResponse>(
    `/tasks/${encodeURIComponent(id)}`,
    token,
    { method: 'PATCH', body: JSON.stringify(input) },
    onUnauthorized,
  );
  return data.item;
}

/** Удаление задачи; сервер отвечает 204 без тела */
export async function deleteTask(
  id: string,
  token: string,
  onUnauthorized?: () => void | Promise<void>,
): Promise<void> {
  await apiRequest<void>(
    `/tasks/${encodeURIComponent(id)}`,
    token,
    { method: 'DELETE' },
    onUnauthorized,
  );
}
