export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'active' | 'completed';

export interface Task {
  id: string;
  title: string;
  subject: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null; // YYYY-MM-DD
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/** Ввод пользователя при создании (без служебных полей) */
export interface CreateTaskInput {
  title: string;
  subject: string;
  priority: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
}

/** Ввод пользователя при обновлении — всё опционально */
export type UpdateTaskInput = Partial<CreateTaskInput>;

/** Параметры серверной фильтрации списка */
export interface TaskListParams {
  status?: TaskStatus;
}

export interface TaskListResponse {
  items: Task[];
}

export interface TaskResponse {
  item: Task;
}

/** Фильтр по статусу в списке: все / активные / выполненные */
export type TaskStatusFilter = 'all' | TaskStatus;
