import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import Animated, {
  FadeInUp,
  FadeOut,
  LinearTransition,
  SlideInRight,
  SlideOutDown,
} from 'react-native-reanimated';
import AppInput from '../../src/components/ui/AppInput';
import Screen from '../../src/components/ui/Screen';
import SwipeableTaskCard from '../../src/components/task/SwipeableTaskCard';
import TaskStats from '../../src/components/task/TaskStats';
import TaskFilterBar from '../../src/components/task/TaskFilterBar';
import EmptyState from '../../src/components/ui/EmptyState';
import { useTasks } from '../../src/hooks/useTasks';
import { useTheme } from '../../src/hooks/useTheme';
import {
  filterTasks,
  filterTasksByStatus,
  getTaskStats,
  sortTasksByPriority,
} from '../../src/utils/task';
import { spacing } from '../../src/theme/spacing';
import type { Task, TaskStatusFilter } from '../../src/types/task';


const UNDO_VISIBLE_MS = 5000;

interface UndoEntry {
  task: Task;
  index: number;
}

export default function ListScreen() {
  const router = useRouter();
  const { tasks, toggleTaskStatus, removeTask, restoreTask, lastCreatedId, clearLastCreated } =
    useTasks();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<TaskStatusFilter>('all');
  const [undo, setUndo] = useState<UndoEntry | null>(null);

  useEffect(() => {
    if (!lastCreatedId) return;
    clearLastCreated();
  }, [lastCreatedId, clearLastCreated]);

  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), UNDO_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [undo]);

  const commitDelete = (task: Task, index: number) => {
    removeTask(task.id);
    setUndo({ task, index });
  };


  const requestDelete = (task: Task, index: number) => {
    Alert.alert('Удалить задачу?', `«${task.title}» будет удалена.`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => commitDelete(task, index),
      },
    ]);
  };

  const handleUndo = () => {
    if (!undo) return;
    restoreTask(undo.task, undo.index);
    setUndo(null);
  };

  const stats = useMemo(() => getTaskStats(tasks), [tasks]);
  const visibleTasks = useMemo(() => {
    const sorted = sortTasksByPriority(tasks);
    const searched = filterTasks(sorted, query);
    return filter === 'all' ? searched : filterTasksByStatus(searched, filter);
  }, [tasks, query, filter]);

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

      <Animated.FlatList
        data={visibleTasks}
        keyExtractor={(item) => item.id}
        skipEnteringExitingAnimations
        itemLayoutAnimation={LinearTransition}
        renderItem={({ item }) => (
          <Animated.View
            entering={SlideInRight.springify().damping(17)}
            exiting={FadeOut.duration(240)}
          >
            <SwipeableTaskCard
              task={item}
              onPress={() => router.push(`/task/${item.id}`)}
              onToggle={() => toggleTaskStatus(item.id)}
              onSwipeRight={() => toggleTaskStatus(item.id)}
              onSwipeLeft={() =>
                requestDelete(item, tasks.findIndex((t) => t.id === item.id))
              }
              highlight={item.id === lastCreatedId}
              onEdit={() => router.push(`/edit/${item.id}`)}
              onDelete={() => removeTask(item.id)}
            />
          </Animated.View>
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

      {undo ? (
        <Animated.View
          entering={FadeInUp.duration(260)}
          exiting={SlideOutDown.duration(260)}
          style={styles.undoBar}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={handleUndo}
            style={[styles.undoPill, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="arrow-undo" size={18} color={colors.onPrimary} />
            <Text numberOfLines={1} style={[styles.undoText, { color: colors.onPrimary }]}>
              Отменить удаление
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.lg },
  searchWrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  headerGap: { marginLeft: spacing.md },
  undoBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.md,
    alignItems: 'center',
  },
  undoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    maxWidth: '85%',
  },
  undoText: { fontSize: 14, fontWeight: '600' },
});
