import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TaskForm from '../../src/components/task/TaskForm';
import { getErrorMessage, isUnauthorizedError } from '../../src/api/client';
import { useAuth } from '../../src/hooks/useAuth';
import { useTasksUi } from '../../src/features/tasks/TasksUiContext';
import { useCreateTask } from '../../src/features/tasks/useTaskMutations';
import { useTheme } from '../../src/hooks/useTheme';
import type { CreateTaskInput } from '../../src/types/task';

const LEGACY_DRAFT_KEY = '@campus_planner/create_draft';
const draftKeyFor = (userId: string): string =>
  `@campus_planner/create_draft:${userId}`;

const isDraftEmpty = (draft: CreateTaskInput): boolean =>
  !draft.title.trim() && !draft.subject.trim() && !draft.dueDate;

export default function CreateScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { markCreated, resetListView } = useTasksUi();
  const createMutation = useCreateTask();
  const { colors } = useTheme();
  const [initialDraft, setInitialDraft] = useState<CreateTaskInput | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [formError, setFormError] = useState<string | undefined>(undefined);

  const draftKey = user ? draftKeyFor(user.id) : null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!draftKey) {
        if (!cancelled) setReady(true);
        return;
      }

      try {
        await AsyncStorage.removeItem(LEGACY_DRAFT_KEY).catch(() => {});
        const raw = await AsyncStorage.getItem(draftKey);
        if (cancelled) return;
        if (raw) {
          const draft = JSON.parse(raw) as CreateTaskInput;
          if (!isDraftEmpty(draft)) {
            Alert.alert('Найден черновик', 'Восстановить несохранённую задачу?', [
              {
                text: 'Нет',
                style: 'cancel',
                onPress: () => {
                  AsyncStorage.removeItem(draftKey).catch(() => {});
                  setReady(true);
                },
              },
              {
                text: 'Да',
                onPress: () => {
                  setInitialDraft(draft);
                  setReady(true);
                },
              },
            ]);
            return;
          }
        }
      } catch (e) {
        console.warn('Не удалось прочитать черновик:', e);
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [draftKey]);

  const handleChange = useCallback(
    (input: CreateTaskInput) => {
      if (!draftKey) return;
      AsyncStorage.setItem(draftKey, JSON.stringify(input)).catch(() => {});
    },
    [draftKey],
  );

  const handleSubmit = (input: CreateTaskInput) => {
    setFormError(undefined);
    createMutation.mutate(input, {
      onSuccess: (task) => {
        if (draftKey) {
          AsyncStorage.removeItem(draftKey).catch(() => {});
        }
        resetListView();
        markCreated(task.id);
        router.back();
      },
      onError: (error) => {
        if (!isUnauthorizedError(error)) {
          setFormError(getErrorMessage(error));
        }
      },
    });
  };

  if (!ready) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <TaskForm
      initial={initialDraft}
      submitLabel="Добавить задачу"
      onSubmit={handleSubmit}
      onChange={handleChange}
      submitting={createMutation.isPending}
      errorMessage={formError}
    />
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
