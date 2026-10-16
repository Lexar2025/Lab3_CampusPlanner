import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import AppInput from '../src/components/ui/AppInput';
import Screen from '../src/components/ui/Screen';
import TaskCard from '../src/components/task/TaskCard';
import TaskStats from '../src/components/task/TaskStats';
import EmptyState from '../src/components/ui/EmptyState';
import { useTasks } from '../src/hooks/useTasks';
import { useTheme } from '../src/hooks/useTheme';
import {
  filterTasks,
  getTaskStats,
  sortTasksByPriority,
} from '../src/utils/task';
import { spacing } from '../src/theme/spacing';

export default function ListScreen() {
  const router = useRouter();
  const { tasks, toggleTask } = useTasks();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');

  const stats = useMemo(() => getTaskStats(tasks), [tasks]);

  const visibleTasks = useMemo(
    () => sortTasksByPriority(filterTasks(tasks, query)),
    [tasks, query],
  );

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
            onToggle={() => toggleTask(item.id)}
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
          </>
        }
        ListEmptyComponent={
          tasks.length === 0 ? (
            <EmptyState
              icon="clipboard-outline"
              title="Задач пока нет"
              description="Нажмите «+», чтобы добавить первую."
              actionTitle="Добавить задачу"
              onAction={() => router.push('/create')}
            />
          ) : (
            <EmptyState
              icon="search-outline"
              title="Ничего не найдено"
              description="Попробуйте изменить запрос."
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
  searchWrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  headerGap: { marginLeft: spacing.md },
});
