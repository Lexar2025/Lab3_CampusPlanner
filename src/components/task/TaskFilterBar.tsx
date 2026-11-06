import { View, StyleSheet } from 'react-native';
import AppButton from '../ui/AppButton';
import { spacing } from '../../theme/spacing';
import type { TaskStatusFilter } from '../../types/task';

interface Props {
  value: TaskStatusFilter;
  onChange: (value: TaskStatusFilter) => void;
}

const FILTERS: { value: TaskStatusFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'completed', label: 'Выполненные' },
];

export default function TaskFilterBar({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {FILTERS.map((f) => (
        <AppButton
          key={f.value}
          label={f.label}
          variant={value === f.value ? 'primary' : 'secondary'}
          dense
          onPress={() => onChange(f.value)}
          style={styles.segment}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  segment: { flex: 1, paddingHorizontal: spacing.xs },
});