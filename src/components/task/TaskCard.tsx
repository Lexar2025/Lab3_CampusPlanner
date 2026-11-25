import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Extrapolation,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import AppButton from '../ui/AppButton';
import { useTheme } from '../../hooks/useTheme';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../../theme/priority';
import { formatDateOnly, isTaskOverdue } from '../../utils/task';
import type { Task } from '../../types/task';
import { spacing } from '../../theme/spacing';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onToggle: () => void;
  highlight?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}


const STATUS_SPRING = { damping: 15, stiffness: 170 };

const CREATE_SPRING = { damping: 18, stiffness: 200 };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const formatDueDate = (date: string): string =>
  formatDateOnly(date, { day: 'numeric', month: 'short' });

const formatFullDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export default function TaskCard({
  task,
  onPress,
  onToggle,
  highlight = false,
  onEdit,
  onDelete,
}: TaskCardProps) {

  const { colors } = useTheme();
  const isDone = task.status === 'completed';
  const overdue = isTaskOverdue(task);
  const doneProgress = useSharedValue(isDone ? 1 : 0);

  useEffect(() => {
    doneProgress.value = withSpring(isDone ? 1 : 0, STATUS_SPRING);
  }, [isDone, doneProgress]);

  const offsetY = useSharedValue(highlight ? 16 : 0);
  const glow = useSharedValue(0);
  const creationPlayed = useRef(false);
  useEffect(() => {
    if (creationPlayed.current) return;
    creationPlayed.current = true;
    if (highlight) {
      offsetY.value = withSpring(0, CREATE_SPRING);
      glow.value = withDelay(
        240,
        withSequence(
          withTiming(1, { duration: 180 }),
          withTiming(0, { duration: 620 }),
        ),
      );
    } else {
      offsetY.value = 0;
    }
  }, [highlight, offsetY, glow]);

  const [expanded, setExpanded] = useState(false);
  const expandTick = useSharedValue(0);

  const toggleDetails = () => {
    const next = !expanded;
    setExpanded(next);
    expandTick.value = withTiming(next ? 1 : 0, { duration: 280 });
  };

  const cardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      doneProgress.value,
      [0, 1],
      [1, 0.62],
      Extrapolation.CLAMP,
    ),
    transform: [{ translateY: offsetY.value }],
  }));

  const tintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(doneProgress.value, [0, 1], [0, 0.14], Extrapolation.CLAMP),
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(doneProgress.value, [0, 1], [0, 1]) }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(doneProgress.value, [0, 1], [1, 0.6], Extrapolation.CLAMP),
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(expandTick.value, [0, 1], [0, 180], Extrapolation.CLAMP)}deg`,
      },
    ],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        overdue && { borderColor: colors.danger },
        cardStyle,
      ]}
    >

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: colors.success }, tintStyle]}
      />
  
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: colors.primary }, glowStyle]}
      />

      <View style={styles.row}>
        <Pressable
          onPress={onToggle}
          hitSlop={8}
          style={[
            styles.checkbox,
            {
              borderColor: colors.primary,
              backgroundColor: isDone ? colors.success : 'transparent',
            },
          ]}
        >
          {isDone ? (
            <Animated.View style={iconStyle}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </Animated.View>
          ) : null}
        </Pressable>

        <View style={styles.info}>
          <Animated.Text
            numberOfLines={1}
            style={[
              styles.title,
              { color: colors.text },
              isDone && styles.doneTitle,
              titleStyle,
            ]}
          >
            {task.title}
          </Animated.Text>
          <View style={styles.metaRow}>
            <Text numberOfLines={1} style={[styles.subject, { color: colors.subtext }]}>
              {task.subject}
            </Text>
            {task.dueDate ? (
              <View style={styles.dueRow}>
                <Ionicons
                  name={overdue ? 'warning' : 'calendar-outline'}
                  size={14}
                  color={overdue ? colors.danger : colors.subtext}
                />
                <Text
                  style={[styles.dueText, { color: overdue ? colors.danger : colors.subtext }]}
                >
                  {formatDueDate(task.dueDate)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={[styles.badge, { backgroundColor: PRIORITY_COLORS[task.priority] }]}>
          <Text style={styles.badgeText}>{PRIORITY_LABELS[task.priority]}</Text>
        </View>

        <Pressable onPress={toggleDetails} hitSlop={8} accessibilityLabel="Подробнее">
          <Animated.View style={chevronStyle}>
            <Ionicons name="chevron-down" size={18} color={colors.subtext} />
          </Animated.View>
        </Pressable>
      </View>

      {expanded ? (
        <Animated.View
          entering={FadeIn.duration(280)}
          exiting={FadeOut.duration(220)}
          style={[styles.detailsInner, { borderTopColor: colors.border }]}
        >
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.subtext }]}>Предмет</Text>
            <Text numberOfLines={1} style={[styles.detailValue, { color: colors.text }]}>
              {task.subject}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.subtext }]}>Дедлайн</Text>
            <Text style={[styles.detailValue, { color: task.dueDate ? colors.text : colors.subtext }]}>
              {task.dueDate
                ? formatDateOnly(task.dueDate, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : 'не задан'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.subtext }]}>Создано</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {formatFullDate(task.createdAt)}
            </Text>
          </View>
          {onEdit || onDelete ? (
            <View style={styles.actionsRow}>
              {onEdit ? (
                <AppButton label="Редактировать" variant="secondary" dense style={styles.actionBtn} onPress={onEdit} />
              ) : null}
              {onDelete ? (
                <AppButton label="Удалить" variant="danger" dense style={styles.actionBtn} onPress={onDelete} />
              ) : null}
            </View>
          ) : null}
        </Animated.View>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  overlay: { borderRadius: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: spacing.xs },
  title: { fontSize: 16, fontWeight: '600' },
  doneTitle: { textDecorationLine: 'line-through' },
  metaRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  subject: { fontSize: 13, flexShrink: 1 },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dueText: { fontSize: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  detailsInner: {
    borderTopWidth: 1,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  detailLabel: { fontSize: 13 },
  detailValue: { fontSize: 13, fontWeight: '500', flexShrink: 1 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  actionBtn: { flex: 1 },
});
