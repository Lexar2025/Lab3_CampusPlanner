import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import TaskForm from '../../../src/components/task/TaskForm';
import EmptyState from '../../../src/components/ui/EmptyState';
import Screen from '../../../src/components/ui/Screen';
import { getErrorMessage, isUnauthorizedError } from '../../../src/api/client';
import { ApiError } from '../../../src/api/http';
import { useTaskQuery } from '../../../src/features/tasks/useTasksQuery';
import { useUpdateTask } from '../../../src/features/tasks/useTaskMutations';
import { useTheme } from '../../../src/hooks/useTheme';
import { useState } from 'react';
import type { CreateTaskInput } from '../../../src/types/task';

export default function EditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const taskQuery = useTaskQuery(id);
  const updateMutation = useUpdateTask();
  const [formError, setFormError] = useState<string | undefined>(undefined);

  const task = taskQuery.data;
  const notFound =
    !id ||
    (taskQuery.isError &&
      taskQuery.error instanceof ApiError &&
      taskQuery.error.status === 404);

  if (notFound) {
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

  if (taskQuery.isPending) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (taskQuery.isError || !task) {
    return (
      <Screen>
        <EmptyState
          icon="cloud-offline-outline"
          title="Не удалось загрузить задачу"
          description={getErrorMessage(taskQuery.error)}
          actionTitle="Повторить"
          onAction={() => {
            void taskQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  const handleSubmit = (input: CreateTaskInput) => {
    setFormError(undefined);
    updateMutation.mutate(
      { id: task.id, input },
      {
        onSuccess: () => router.back(),
        onError: (error) => {
          if (!isUnauthorizedError(error)) {
            setFormError(getErrorMessage(error));
          }
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
      errorMessage={formError}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
