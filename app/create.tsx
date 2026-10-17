import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TaskForm from '../src/components/task/TaskForm';
import { useTasks } from '../src/hooks/useTasks';
import { useTheme } from '../src/hooks/useTheme';
import type { CreateTaskInput } from '../src/types/task';

/**
 * Ключ в AsyncStorage для черновика формы создания.
 * Префикс `@campus_planner/` — защита от коллизий с другими приложениями.
 */
const DRAFT_KEY = '@campus_planner/create_draft';

/**
 * Черновик считается пустым, если пользователь ничего содержательного не ввёл.
 * Приоритет 'medium' — дефолт формы, его наличие ничего не значит.
 */
const isDraftEmpty = (draft: CreateTaskInput): boolean =>
  !draft.title.trim() && !draft.subject.trim() && !draft.dueDate;

/**
 * Экран создания задачи с автоматическим сохранением черновика.
 *
 * Жизненный цикл черновика:
 *  1. Запись: форма на каждое изменение полей пишет input в AsyncStorage.
 *  2. Восстановление: при входе читается ключ; если непустой — Alert с Yes/No.
 *  3. Удаление: после успешного createTask или при ответе «Нет» ключ удаляется.
 */
export default function CreateScreen() {
  const router = useRouter();
  const { createTask } = useTasks();
  const { colors } = useTheme();
  const [initialDraft, setInitialDraft] = useState<CreateTaskInput | undefined>(undefined);
  /** `ready` блокирует рендер формы до ответа пользователя на Alert. */
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DRAFT_KEY);
        if (cancelled) return;
        if (raw) {
          const draft = JSON.parse(raw) as CreateTaskInput;
          if (!isDraftEmpty(draft)) {
            Alert.alert('Найден черновик', 'Восстановить несохранённую задачу?', [
              {
                text: 'Нет',
                style: 'cancel',
                onPress: () => {
                  AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
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
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Сериализует и пишет черновик на каждое изменение полей формы. */
  const handleChange = useCallback((input: CreateTaskInput) => {
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(input)).catch(() => {});
  }, []);

  const handleSubmit = (input: CreateTaskInput) => {
    createTask(input);
    AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
    router.back();
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
    />
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
