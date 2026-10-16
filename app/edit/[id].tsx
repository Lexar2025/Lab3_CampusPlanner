import { useRouter, useLocalSearchParams } from 'expo-router';
import TaskForm from '../../src/components/task/TaskForm';
import EmptyState from '../../src/components/ui/EmptyState';
import Screen from '../../src/components/ui/Screen';
import { useTasks } from '../../src/hooks/useTasks';
import type { CreateTaskInput } from '../../src/types/task';

export default function EditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTaskById, updateTask } = useTasks();

  const task = id ? getTaskById(id) : undefined;

  if (!task) {
    return (
      <Screen>
        <EmptyState
          icon="alert-circle-outline"
          title="Задача не найдена"
          description="Возможно, она была удалена."
          actionTitle="Назад к списку"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const handleSubmit = (input: CreateTaskInput) => {
    updateTask(task.id, input);
    router.back();
  };

  return <TaskForm initial={task} submitLabel="Сохранить изменения" onSubmit={handleSubmit} />;
}
