import { useRouter } from 'expo-router';
import TaskForm from '../src/components/task/TaskForm';
import { useTasks } from '../src/hooks/useTasks';
import type { CreateTaskInput } from '../src/types/task';

export default function CreateScreen() {
  const router = useRouter();
  const { createTask } = useTasks();

  const handleSubmit = (input: CreateTaskInput) => {
    createTask(input);
    router.back();
  };

  return <TaskForm submitLabel="Добавить задачу" onSubmit={handleSubmit} />;
}
