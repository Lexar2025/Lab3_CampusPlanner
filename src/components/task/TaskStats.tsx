import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../../theme/spacing';
import type { TaskStats as TaskStatsModel } from '../../utils/task';

interface TaskStatsProps {
  stats: TaskStatsModel;
}

export default function TaskStats({ stats }: TaskStatsProps) {
  const { colors } = useTheme();
  const percent =
    stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);

  /**
   * Сценарий 4: анимированный индикатор прогресса.
   * Значение — доля выполненных задач, ограниченная диапазоном 0..1,
   * анимируется через withTiming. Источник данных — stats из состояния задач.
   */
  const ratio = stats.total === 0 ? 0 : Math.min(1, Math.max(0, stats.completed / stats.total));
  const progress = useSharedValue(ratio);

  useEffect(() => {
    progress.value = withTiming(ratio, {
      duration: 650,
      easing: Easing.out(Easing.cubic),
    });
  }, [ratio, progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const cells: Array<{ label: string; value: string }> = [
    { label: 'Всего', value: String(stats.total) },
    { label: 'В работе', value: String(stats.active) },
    { label: 'Готово', value: String(stats.completed) },
    { label: 'Прогресс', value: `${percent}%` },
  ];

  return (
    <View>
      <View style={[styles.progressBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: colors.subtext }]}>Выполнено задач</Text>
          <Text style={[styles.progressValue, { color: colors.primary }]}>{percent}%</Text>
        </View>
        <View style={[styles.track, { backgroundColor: colors.border }]}>
          <Animated.View style={[styles.bar, { backgroundColor: colors.success }, barStyle]} />
        </View>
      </View>

      <View style={styles.row}>
        {cells.map((c) => (
          <View
            key={c.label}
            style={[styles.cell, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.value, { color: colors.primary }]}>{c.value}</Text>
            <Text style={[styles.label, { color: colors.subtext }]}>{c.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressBlock: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressLabel: { fontSize: 13 },
  progressValue: { fontSize: 14, fontWeight: '700' },
  track: { height: 10, borderRadius: 5, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 5 },
  row: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
  },
  value: { fontSize: 18, fontWeight: '700' },
  label: { fontSize: 11, marginTop: spacing.xs },
});
