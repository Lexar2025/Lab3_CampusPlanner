import { StyleSheet, View } from 'react-native';
import AppButton from '../ui/AppButton';
import { spacing } from '../../theme/spacing';
import type { TaskStatus, TaskStatusFilter } from '../../types/task';

interface Props {
  value: TaskStatusFilter;
  onChange: (value: TaskStatusFilter) => void;
}

const FILTERS: { value: TaskStatusFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'active' as TaskStatus, label: 'Активные' },
  { value: 'completed' as TaskStatus, label: 'Выполненные' },
];

/**
 * Сегментированный контроллер фильтра по статусу.
 * Доменный компонент (знает про TaskStatus), использует примитив AppButton.
 */
export default function TaskFilterBar({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {FILTERS.map((f) => (
        <AppButton
          key={f.value}
          title={f.label}
          variant={value === f.value ? 'primary' : 'secondary'}
          onPress={() => onChange(f.value)}
          style={styles.button}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
});
