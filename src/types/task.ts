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

export interface CreateTaskInput {
  title: string;
  subject: string;
  priority: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
}

export type UpdateTaskInput = Partial<CreateTaskInput>;

export interface TaskListParams {
  status?: TaskStatus;
}

export interface TaskListResponse {
  items: Task[];
}

export interface TaskResponse {
  item: Task;
}

export type TaskStatusFilter = 'all' | TaskStatus;
