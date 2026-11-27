import { StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../../theme/spacing';

interface SettingsRowProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export default function SettingsRow({
  title,
  subtitle,
  right,
}: SettingsRowProps) {
  const { colors } = useTheme();

  return (
    <View style={[
      styles.row,
      { backgroundColor: colors.card, borderColor: colors.border },
    ]}>
    <View style={styles.labels}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
    {right ? <View style={styles.right}>{right}</View> : null}
  </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
  },
  labels: { flex: 1, gap: spacing.xs },
  title: { fontSize: 16, fontWeight: '600' },
  subtitle: { fontSize: 13 },
  right: { marginLeft: spacing.md },
});
