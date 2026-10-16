import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppButton from './AppButton';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../../theme/spacing';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionTitle,
  onAction,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={56} color={colors.subtext} />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: colors.subtext }]}>
          {description}
        </Text>
      ) : null}
      {actionTitle && onAction ? (
        <View style={styles.button}>
          <AppButton title={actionTitle} onPress={onAction} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  title: { fontSize: 17, fontWeight: '700', textAlign: 'center', marginTop: spacing.xs },
  description: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  button: { marginTop: spacing.sm },
});
