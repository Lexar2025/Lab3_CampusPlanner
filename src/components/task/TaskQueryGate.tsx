import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import { UseQueryResult } from '@tanstack/react-query';
import EmptyState from '../ui/EmptyState';
import Screen from '../ui/Screen';
import { ApiError } from '../../api/http';
import { useTheme } from '../../hooks/useTheme';
import type { Task } from '../../types/task';

interface TaskQueryGateProps {
  id: string | undefined;
  query: UseQueryResult<Task, Error>;
  onBack: () => void;
  children: (task: Task) => ReactNode;
}

export default function TaskQueryGate({
  id,
  query,
  onBack,
  children,
}: TaskQueryGateProps) {
  const { colors } = useTheme();

  const task = query.data;
  const notFound =
    !id ||
    (query.isError &&
      query.error instanceof ApiError &&
      query.error.status === 404);

  if (notFound) {
    return (
      <Screen>
        <EmptyState
          icon="alert-circle-outline"
          title="Задача не найдена"
          description="Возможно, она была удалена."
          actionTitle="Назад к списку"
          onAction={onBack}
        />
      </Screen>
    );
  }

  if (query.isPending) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (query.isError || !task) {
    return (
      <Screen>
        <EmptyState
          icon="cloud-offline-outline"
          title="Не удалось загрузить задачу"
          description={query.error ? String(query.error.message) : 'Попробуйте ещё раз.'}
          actionTitle="Повторить"
          onAction={() => {
            void query.refetch();
          }}
        />
      </Screen>
    );
  }

  return children(task);
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
