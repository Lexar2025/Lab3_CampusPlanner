import { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import Animated, {
  FadeInUp,
  FadeOut,
  LinearTransition,
  SlideInRight,
  SlideOutDown,
} from 'react-native-reanimated';
import { getErrorMessage, isUnauthorizedError } from '../../src/api/client';
import AppInput from '../../src/components/ui/AppInput';
import Screen from '../../src/components/ui/Screen';
import SwipeableTaskCard from '../../src/components/task/SwipeableTaskCard';
import TaskStats from '../../src/components/task/TaskStats';
import TaskFilterBar from '../../src/components/task/TaskFilterBar';
import EmptyState from '../../src/components/ui/EmptyState';
import TaskSectionHeader from '../../src/components/task/TaskSectionHeader';
import {
  groupTasksByDueDate,
  buildTaskRows,
  type TaskListRow,
} from '../../src/utils/taskSections';
import { useTasksUi } from '../../src/features/tasks/TasksUiContext';
import { useToggleTaskStatus } from '../../src/features/tasks/useTaskMutations';
import {
  useAllTasksQuery,
  useTasksQuery,
} from '../../src/features/tasks/useTasksQuery';
import { useTheme } from '../../src/hooks/useTheme';
import {
  filterTasks,
  filterTasksByStatus,
  getTaskStats,
} from '../../src/utils/task';
import { spacing } from '../../src/theme/spacing';
import type { Task } from '../../src/types/task';

const CREATE_HIGHLIGHT_MS = 1200;

export default function ListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    pendingIds,
    latestPending,
    scheduleDelete,
    undoDelete,
    lastCreatedId,
    clearLastCreated,
  } = useTasksUi();
  const listQuery = useTasksQuery(statusFilter);
  const allQuery = useAllTasksQuery();
  const toggleMutation = useToggleTaskStatus();

  const tasks = useMemo(() => listQuery.data ?? [], [listQuery.data]);
  const allTasks = useMemo(() => allQuery.data ?? [], [allQuery.data]);

  const sections = useMemo(() => {
    const withoutPending = tasks.filter((task) => !pendingIds.has(task.id));
    const byStatus =
      statusFilter === 'all'
        ? withoutPending
        : filterTasksByStatus(withoutPending, statusFilter);
    return groupTasksByDueDate(filterTasks(byStatus, searchQuery), statusFilter);
  }, [tasks, pendingIds, statusFilter, searchQuery]);

  const rows = useMemo(() => buildTaskRows(sections), [sections]);
  const visibleTasks = useMemo(
    () => sections.flatMap((section) => section.tasks),
    [sections],
  );

  const stats = useMemo(
    () => getTaskStats(allTasks.filter((task) => !pendingIds.has(task.id))),
    [allTasks, pendingIds],
  );

  useEffect(() => {
    if (!lastCreatedId) return;
    if (!visibleTasks.some((task) => task.id === lastCreatedId)) return;

    const timer = setTimeout(() => clearLastCreated(), CREATE_HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [lastCreatedId, visibleTasks, clearLastCreated]);

  const refresh = () => {
    void listQuery.refetch();
    if (statusFilter !== 'all') {
      void allQuery.refetch();
    }
  };

  const handleToggle = (task: Task) => {
    if (toggleMutation.isPending) return;
    toggleMutation.mutate(
      {
        id: task.id,
        status: task.status === 'active' ? 'completed' : 'active',
      },
      {
        onError: (error) => {
          if (!isUnauthorizedError(error)) {
            Alert.alert('Не удалось изменить статус', getErrorMessage(error));
          }
        },
      },
    );
  };

  const requestDelete = (task: Task) => {
    Alert.alert('Удалить задачу?', `«${task.title}» будет удалена.`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => scheduleDelete(task),
      },
    ]);
  };

  const emptyState = useMemo(() => {
    if (allTasks.length === 0) {
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
    if (searchQuery.trim().length > 0) {
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
  }, [allTasks.length, searchQuery, router]);

  if (listQuery.isPending && !listQuery.data) {
    return (
      <Screen padded={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (listQuery.isError && !listQuery.data) {
    return (
      <Screen padded={false}>
        <EmptyState
          icon="cloud-offline-outline"
          title="Не удалось загрузить задачи"
          description={getErrorMessage(listQuery.error)}
          actionTitle="Повторить"
          onAction={refresh}
        />
      </Screen>
    );
  }

  const hasDataError = listQuery.isError || allQuery.isError;

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

      <Animated.FlatList<TaskListRow>
        data={rows}
        keyExtractor={(item) => item.key}
        skipEnteringExitingAnimations
        itemLayoutAnimation={LinearTransition}
        refreshControl={
          <RefreshControl
            refreshing={listQuery.isRefetching || allQuery.isRefetching}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item }) => {
          if (item.kind === 'section') {
            return (
              <TaskSectionHeader
                title={item.title}
                count={item.count}
                overdue={item.overdue}
              />
            );
          }
          return (
            <Animated.View
              entering={SlideInRight.springify().damping(17)}
              exiting={FadeOut.duration(240)}
            >
              <SwipeableTaskCard
                task={item.task}
                onPress={() => router.push(`/task/${item.task.id}`)}
                onToggle={() => handleToggle(item.task)}
                onSwipeRight={() => handleToggle(item.task)}
                onSwipeLeft={() => requestDelete(item.task)}
                highlight={item.task.id === lastCreatedId}
                onEdit={() => router.push(`/edit/${item.task.id}`)}
                onDelete={() => requestDelete(item.task)}
              />
            </Animated.View>
          );
        }}
        ListHeaderComponent={
          <>
            {hasDataError ? (
              <View
                style={[
                  styles.errorBanner,
                  { backgroundColor: colors.card, borderColor: colors.danger },
                ]}
              >
                <Text
                  numberOfLines={2}
                  style={[styles.errorText, { color: colors.danger }]}
                >
                  {getErrorMessage(listQuery.error ?? allQuery.error)}
                </Text>
                <Pressable onPress={refresh} hitSlop={8}>
                  <Text style={[styles.retryText, { color: colors.primary }]}>
                    Повторить
                  </Text>
                </Pressable>
              </View>
            ) : null}
            <TaskStats stats={stats} />
            <View style={styles.searchWrap}>
              <AppInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Поиск по названию или предмету"
              />
            </View>
            <TaskFilterBar value={statusFilter} onChange={setStatusFilter} />
          </>
        }
        ListEmptyComponent={emptyState}
        contentContainerStyle={styles.list}
      />

      {latestPending ? (
        <Animated.View
          entering={FadeInUp.duration(260)}
          exiting={SlideOutDown.duration(260)}
          style={styles.undoBar}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={() => undoDelete(latestPending.id)}
            style={[styles.undoPill, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="trash-outline" size={18} color={colors.onPrimary} />
            <Text
              numberOfLines={1}
              style={[styles.undoText, { color: colors.onPrimary }]}
            >
              Удаление…
            </Text>
            <Text style={[styles.undoAction, { color: colors.onPrimary }]}>
              Отменить
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: { fontSize: 13, flex: 1 },
  retryText: { fontSize: 13, fontWeight: '600' },
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
  undoAction: { fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
});
