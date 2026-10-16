import { StyleSheet, Text, View } from 'react-native';
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

  const cells: Array<{ label: string; value: string }> = [
    { label: 'Всего', value: String(stats.total) },
    { label: 'В работе', value: String(stats.active) },
    { label: 'Готово', value: String(stats.completed) },
    { label: 'Прогресс', value: `${percent}%` },
  ];

  return (
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
  );
}

const styles = StyleSheet.create({
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
