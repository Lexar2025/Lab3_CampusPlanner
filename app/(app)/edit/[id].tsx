import { useRouter, useLocalSearchParams } from 'expo-router';
import TaskForm from '../../../src/components/task/TaskForm';
import { useTaskQuery } from '../../../src/features/tasks/useTasksQuery';
import { useUpdateTask } from '../../../src/features/tasks/useTaskMutations';
import type { CreateTaskInput } from '../../../src/types/task';
import TaskQueryGate from '../../../src/components/task/TaskQueryGate';

export default function EditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const taskQuery = useTaskQuery(id);
  const updateMutation = useUpdateTask();

  return (
    <TaskQueryGate
      id={id}
      query={taskQuery}
      onBack={() => router.back()}
    >
      {(task) => {
        const handleSubmit = (input: CreateTaskInput) => {
          updateMutation.mutate(
            { id: task.id, input },
            {
              onSuccess: () => router.back(),
              onError: (error) => {
                void error;
              },
            },
          );
        };

        return (
          <TaskForm
            initial={task}
            submitLabel="Сохранить изменения"
            onSubmit={handleSubmit}
            submitting={updateMutation.isPending}
          />
        );
      }}
    </TaskQueryGate>
  );
}
