import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, TextInput, View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import TaskCard from '../src/components/task/TaskCard';
import TaskStats from '../src/components/task/TaskStats';
import TaskFilterBar from '../src/components/task/TaskFilterBar';
import EmptyState from '../src/components/ui/EmptyState';
import Screen from '../src/components/ui/Screen';
import { useTasks } from '../src/hooks/useTasks';
import { useTheme } from '../src/hooks/useTheme';
import { spacing } from '../src/theme/spacing';
import { filterTasks, getTaskStats, sortTasksByPriority } from '../src/utils/task';
import type { TaskStatusFilter } from '../src/types/task';

export default function ListScreen() {
  const router = useRouter();
  const { tasks, lastCreatedId, clearLastCreatedId } = useTasks();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('all');

  const stats = useMemo(() => getTaskStats(tasks), [tasks]);

  const visibleTasks = useMemo(() => {
    // Сначала фильтр по статусу
    let filtered = tasks;
    if (statusFilter === 'active') {
      filtered = tasks.filter((t) => t.status === 'active');
    } else if (statusFilter === 'completed') {
      filtered = tasks.filter((t) => t.status === 'completed');
    }
    // Потом фильтр по поиску
    filtered = filterTasks(filtered, query);
    // И сортировка
    return sortTasksByPriority(filtered);
  }, [tasks, query, statusFilter]);

  useEffect(() => {
    if (!lastCreatedId) return;
    const timer = setTimeout(clearLastCreatedId, 1500);
    return () => clearTimeout(timer);
  }, [lastCreatedId, clearLastCreatedId]);

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerButtons}>
              <Pressable onPress={() => router.push('/create')} hitSlop={8}>
                <Ionicons name="add" size={26} color={colors.onPrimary} />
              </Pressable>
              <Pressable onPress={() => router.push('/settings')} hitSlop={8} style={styles.headerGap}>
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
          <Animated.View entering={FadeInDown.duration(300)} exiting={FadeOut.duration(250)}>
            <TaskCard task={item} onPress={() => router.push(`/task/${item.id}`)} />
          </Animated.View>
        )}
        ListHeaderComponent={
          <View>
            <TaskStats stats={stats} />
            <TaskFilterBar value={statusFilter} onChange={setStatusFilter} />
            <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search" size={18} color={colors.subtext} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Поиск по названию или предмету"
                placeholderTextColor={colors.subtext}
                style={[styles.searchInput, { color: colors.text }]}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          tasks.length === 0 ? (
            <EmptyState
              icon="clipboard-outline"
              title="Задач пока нет"
              description="Нажмите «+», чтобы добавить первую задачу."
              actionTitle="Добавить задачу"
              onAction={() => router.push('/create')}
            />
          ) : (
            <EmptyState
              icon="search-outline"
              title="Ничего не найдено"
              description="Попробуйте изменить фильтры или поисковый запрос."
              actionTitle="Сбросить поиск"
              onAction={() => {
                setQuery('');
                setStatusFilter('all');
              }}
            />
          )
        }
        contentContainerStyle={styles.list}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.lg },
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  headerGap: { marginLeft: spacing.md },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
});