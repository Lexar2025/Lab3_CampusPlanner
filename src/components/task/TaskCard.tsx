import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../../theme/priority';
import { isTaskOverdue } from '../../utils/task';
import type { Task } from '../../types/task';
import { spacing } from '../../theme/spacing';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onToggle: () => void;
}

const formatDueDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

export default function TaskCard({ task, onPress, onToggle }: TaskCardProps) {
  const { colors } = useTheme();
  const isDone = task.status === 'completed';
  const overdue = isTaskOverdue(task);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        overdue && { borderColor: colors.danger },
      ]}
    >
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
        {isDone ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
      </Pressable>

      <View style={styles.info}>
        <Text
          numberOfLines={1}
          style={[styles.title, { color: colors.text }, isDone && styles.doneTitle]}
        >
          {task.title}
        </Text>
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
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
  doneTitle: { textDecorationLine: 'line-through', opacity: 0.6 },
  metaRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  subject: { fontSize: 13, flexShrink: 1 },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dueText: { fontSize: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
});
