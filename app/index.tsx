import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import AppInput from '../src/components/ui/AppInput';
import Screen from '../src/components/ui/Screen';
import TaskCard from '../src/components/task/TaskCard';
import TaskStats from '../src/components/task/TaskStats';
import TaskFilterBar from '../src/components/task/TaskFilterBar';
import EmptyState from '../src/components/ui/EmptyState';
import { useTasks } from '../src/hooks/useTasks';
import { useTheme } from '../src/hooks/useTheme';
import {
  filterTasks,
  filterTasksByStatus,
  getTaskStats,
  sortTasksByPriority,
} from '../src/utils/task';
import { spacing } from '../src/theme/spacing';
import type { TaskStatusFilter } from '../src/types/task';

export default function ListScreen() {
  const router = useRouter();
  const { tasks, toggleTaskStatus } = useTasks();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<TaskStatusFilter>('all');

  /** Статистика всегда по полному массиву — требование методички. */
  const stats = useMemo(() => getTaskStats(tasks), [tasks]);

  /**
   * Конвейер преобразований:
   * tasks → сортировка по приоритету → поиск → фильтр по статусу.
   * Все ступени — чистые функции из utils; экран только их склеивает.
   */
  const visibleTasks = useMemo(() => {
    const sorted = sortTasksByPriority(tasks);
    const searched = filterTasks(sorted, query);
    return filter === 'all' ? searched : filterTasksByStatus(searched, filter);
  }, [tasks, query, filter]);

  /**
   * Три варианта пустого состояния:
   *  1. задач в принципе нет — приглашение добавить;
   *  2. задачи есть, но поиск ничего не нашёл;
   *  3. задачи есть, но фильтр по статусу пустой.
   */
  const emptyState = useMemo(() => {
    if (tasks.length === 0) {
      return (
        <EmptyState
          icon="clipboard-outline"
          title="Задач пока нет"
          description="Нажмите «+», чтобы добавить первую."
          actionTitle="Добавить задачу"
          onAction={() => router.push('/create')}
        />
      );
    }
    if (query.trim().length > 0) {
      return (
        <EmptyState
          icon="search-outline"
          title="Ничего не найдено"
          description="Попробуйте изменить поисковый запрос."
        />
      );
    }
    return (
      <EmptyState
        icon="filter-outline"
        title="В этой категории пусто"
        description="Переключите фильтр, чтобы увидеть другие задачи."
      />
    );
  }, [tasks.length, query, router]);

  return (
    <Screen padded={false}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerButtons}>
              <Pressable onPress={() => router.push('/create')} hitSlop={8}>
                <Ionicons name="add" size={26} color={colors.onPrimary} />
              </Pressable>
              <Pressable
                onPress={() => router.push('/settings')}
                hitSlop={8}
                style={styles.headerGap}
              >
                <Ionicons name="settings-outline" size={24} color={colors.onPrimary} />
              </Pressable>
            </View>
          ),
        }}
      />

      <FlatList
        data={visibleTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onPress={() => router.push(`/task/${item.id}`)}
            onToggle={() => toggleTaskStatus(item.id)}
          />
        )}
        ListHeaderComponent={
          <>
            <TaskStats stats={stats} />
            <View style={styles.searchWrap}>
              <AppInput
                value={query}
                onChangeText={setQuery}
                placeholder="Поиск по названию или предмету"
              />
            </View>
            <TaskFilterBar value={filter} onChange={setFilter} />
          </>
        }
        ListEmptyComponent={emptyState}
        contentContainerStyle={styles.list}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.lg },
  searchWrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  headerGap: { marginLeft: spacing.md },
});
