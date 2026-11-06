import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../../src/components/ui/AppButton';
import EmptyState from '../../src/components/ui/EmptyState';
import Screen from '../../src/components/ui/Screen';
import { useTasks } from '../../src/hooks/useTasks';
import { useTheme } from '../../src/hooks/useTheme';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../../src/theme/priority';
import { spacing } from '../../src/theme/spacing';
import { isTaskOverdue } from '../../src/utils/task';

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function TaskDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTaskById, toggleTaskStatus, removeTask } = useTasks();
  const { colors } = useTheme();

  const task = id ? getTaskById(id) : undefined;

  if (!task) {
    return (
      <Screen>
        <EmptyState
          icon="alert-circle-outline"
          title="Задача не найдена"
          description="Возможно, она была удалена."
          actionTitle="Назад к списку"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const confirmDelete = () => {
    Alert.alert('Удаление задачи', `Удалить задачу «${task.title}»?`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          removeTask(task.id);
          router.back();
        },
      },
    ]);
  };

  const isDone = task.status === 'completed';
  const overdue = isTaskOverdue(task);

  return (
    <Screen>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{task.title}</Text>

        <DetailRow
          icon="book-outline"
          color={colors.subtext}
          label={task.subject}
        />

        <View style={styles.row}>
          <Ionicons name="flag-outline" size={18} color={colors.subtext} />
          <View
            style={[styles.badge, { backgroundColor: PRIORITY_COLORS[task.priority] }]}
          >
            <Text style={styles.badgeText}>{PRIORITY_LABELS[task.priority]}</Text>
          </View>
        </View>

        <DetailRow
          icon={isDone ? 'checkmark-circle' : 'time-outline'}
          color={isDone ? colors.success : colors.subtext}
          label={isDone ? 'Выполнена' : 'В работе'}
        />

        <DetailRow
          icon="calendar-outline"
          color={colors.subtext}
          label={`Создана: ${formatDate(task.createdAt)}`}
        />

        {task.dueDate ? (
          <DetailRow
            icon={overdue ? 'warning' : 'alarm-outline'}
            color={overdue ? colors.danger : colors.subtext}
            label={
              overdue
                ? `Просрочено: ${formatDate(task.dueDate)}`
                : `Срок: ${formatDate(task.dueDate)}`
            }
          />
        ) : null}
      </View>

      <AppButton
        label={isDone ? 'Вернуть в работу' : 'Отметить выполненной'}
        onPress={() => toggleTaskStatus(task.id)}
        variant={isDone ? 'secondary' : 'success'}
        style={styles.button}
      />

      <AppButton
        label="Редактировать"
        onPress={() => router.push(`/edit/${task.id}`)}
        variant="primary"
        style={styles.button}
      />

      <AppButton
        label="Удалить"
        onPress={confirmDelete}
        variant="danger"
        style={styles.button}
      />
    </Screen>
  );
}

function DetailRow({
  icon,
  color,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
}) {
  return (
    <View style={detailStyles.row}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[detailStyles.label, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { fontSize: 15, flexShrink: 1 },
});

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  button: { marginTop: spacing.sm },
});
