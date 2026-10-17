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
 *
 * На узких экранах ширина кнопки получается небольшой, поэтому включаем
 * `dense`-режим: меньше отступы, меньше шрифт, и подпись гарантированно
 * не переносится (`numberOfLines={1}` в AppButton).
 */
export default function TaskFilterBar({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {FILTERS.map((f) => (
        <AppButton
          key={f.value}
          title={f.label}
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
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  segment: {
    flex: 1,
    paddingHorizontal: spacing.xs, // перекрывает dense-отступ для ещё большей плотности
  },
});
