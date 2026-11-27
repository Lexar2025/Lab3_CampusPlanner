import { StyleSheet, Text, View } from 'react-native';
import { spacing } from '../../theme/spacing';

interface TaskSectionHeaderProps {
  title: string;
  count: number;
  overdue?: boolean;
}

export default function TaskSectionHeader({
  title,
  count,
  overdue = false,
}: TaskSectionHeaderProps) {

  return (
    <View style={styles.row}>
      <Text style={[styles.title, overdue && styles.titleOverdue]}>
        {title}
      </Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#6B7280',
  },
  titleOverdue: {
    color: '#DC2626',
  },
  badge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
});
