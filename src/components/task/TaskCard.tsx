import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { useTasks } from '../../hooks/useTasks';
import { spacing } from '../../theme/spacing';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../../theme/priority';
import { isTaskOverdue } from '../../utils/task';
import type { Task } from '../../types/task';

interface Props {
  task: Task;
  onPress: () => void;
}

export default function TaskCard({ task, onPress }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const { toggleTaskStatus, removeTask, lastCreatedId } = useTasks();

  const completed = task.status === 'completed';
  const overdue = isTaskOverdue(task);

  // --- Сценарий 1: анимация статуса ---
  const statusProgress = useSharedValue(completed ? 1 : 0);
  const checkScale = useSharedValue(completed ? 1 : 0);

  useEffect(() => {
    statusProgress.value = withTiming(completed ? 1 : 0, { duration: 250 });
    checkScale.value = withSpring(completed ? 1 : 0, { damping: 12, stiffness: 220 });
  }, [completed, statusProgress, checkScale]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: 1 - 0.4 * statusProgress.value,
    backgroundColor: interpolateColor(statusProgress.value, [0, 1], [colors.card, colors.background]),
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  // --- Сценарий 2: раскрытие области ---
  const [expanded, setExpanded] = useState(false);
  const expandHeight = useSharedValue(0);
  const chevron = useSharedValue(0);
  const contentHeight = useRef(0);

  const toggleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    expandHeight.value = withTiming(next ? contentHeight.current : 0, { duration: 300 });
    chevron.value = withTiming(next ? 1 : 0, { duration: 300 });
  };

  const expandStyle = useAnimatedStyle(() => ({
    height: expandHeight.value,
    overflow: 'hidden',
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevron.value * Math.PI}rad` }],
  }));

  // --- Доп. задание: подсветка только что созданной задачи ---
  const highlight = useSharedValue(0);

  useEffect(() => {
    if (task.id === lastCreatedId) {
      highlight.value = withSequence(
        withTiming(1, { duration: 150 }),
        withDelay(400, withTiming(0, { duration: 600 })),
      );
    }
  }, [task.id, lastCreatedId, highlight]);

  const highlightStyle = useAnimatedStyle(() => ({
    opacity: highlight.value,
  }));

  const confirmDelete = () => {
    Alert.alert('Удаление задачи', `Удалить задачу «${task.title}»?`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => removeTask(task.id),
      },
    ]);
  };

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.card, { borderColor: colors.border }, cardStyle]}>
        <Pressable onPress={onPress} style={styles.mainRow}>
          <Pressable
            onPress={() => toggleTaskStatus(task.id)}
            hitSlop={8}
            style={[styles.checkbox, { borderColor: colors.primary }]}
          >
            <Animated.View style={[styles.checkboxFill, { backgroundColor: colors.success }, checkStyle]}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </Animated.View>
          </Pressable>

          <View style={styles.info}>
            <Text
              numberOfLines={1}
              style={[styles.title, { color: colors.text }, completed && styles.titleDone]}
            >
              {task.title}
            </Text>
            <View style={styles.metaRow}>
              <View style={[styles.badge, { backgroundColor: PRIORITY_COLORS[task.priority] }]}>
                <Text style={styles.badgeText}>{PRIORITY_LABELS[task.priority]}</Text>
              </View>
              {overdue && (
                <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                  <Text style={styles.badgeText}>Просрочено</Text>
                </View>
              )}
            </View>
          </View>

          <Pressable onPress={toggleExpand} hitSlop={8} style={styles.chevron}>
            <Animated.View style={chevronStyle}>
              <Ionicons name="chevron-down" size={20} color={colors.subtext} />
            </Animated.View>
          </Pressable>
        </Pressable>

        <Animated.View style={expandStyle}>
          <View
            style={styles.details}
            onLayout={(e) => {
              contentHeight.current = e.nativeEvent.layout.height;
            }}
          >
            <View style={styles.detailRow}>
              <Ionicons name="book-outline" size={16} color={colors.subtext} />
              <Text style={[styles.detailText, { color: colors.subtext }]}>{task.subject}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.subtext} />
              <Text style={[styles.detailText, { color: overdue ? colors.danger : colors.subtext }]}>
                {task.dueDate ? `Срок: ${task.dueDate}` : 'Срок не задан'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={16} color={colors.subtext} />
              <Text style={[styles.detailText, { color: colors.subtext }]}>
                {task.description ?? 'Без описания'}
              </Text>
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                onPress={() => router.push(`/edit/${task.id}`)}
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.actionText, { color: colors.onPrimary }]}>Редактировать</Text>
              </Pressable>
              <Pressable
                onPress={confirmDelete}
                style={[styles.actionBtn, { backgroundColor: colors.danger }]}
              >
                <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Удалить</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.highlight, { backgroundColor: colors.primary }, highlightStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 14,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.md,
  },
  mainRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxFill: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600' },
  titleDone: { textDecorationLine: 'line-through' },
  metaRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  chevron: { padding: 4 },
  details: { paddingTop: spacing.sm, gap: spacing.sm },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 14, flex: 1 },
  actionsRow: { flexDirection: 'row', gap: 8, paddingTop: spacing.xs },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  actionText: { fontSize: 14, fontWeight: '600' },
  highlight: { borderRadius: 14, opacity: 0 },
});