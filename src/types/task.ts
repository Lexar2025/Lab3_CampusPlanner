export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'active' | 'completed';

export interface Task {
  id: string;
  title: string;
  subject: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string; // ISO 8601
  dueDate?: string; // ISO 8601
}

/** Ввод пользователя при создании (без служебных полей) */
export type CreateTaskInput = Omit<Task, 'id' | 'createdAt' | 'status'>;

/** Ввод пользователя при обновлении — всё опционально + статус отдельно */
export type UpdateTaskInput = Partial<CreateTaskInput> & { status?: TaskStatus };

/** Фильтр по статусу в списке: все / активные / выполненные */
export type TaskStatusFilter = 'all' | TaskStatus;
