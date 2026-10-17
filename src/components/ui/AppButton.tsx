import { Pressable, Text, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../../theme/spacing';

export type AppButtonVariant = 'primary' | 'secondary' | 'danger' | 'success';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  disabled?: boolean;
  dense?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  dense = false,
  style,
}: AppButtonProps) {
  const { colors } = useTheme();

  const backgroundColor =
    variant === 'secondary' ? colors.card
    : variant === 'danger' ? colors.danger
    : variant === 'success' ? colors.success
    : colors.primary;

  const borderColor = variant === 'secondary' ? colors.primary : backgroundColor;
  const textColor = variant === 'secondary' ? colors.primary : colors.onPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        dense ? styles.dense : styles.normal,
        { backgroundColor, borderColor },
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        numberOfLines={1}
        style={[dense ? styles.labelDense : styles.label, { color: textColor }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  normal: { paddingVertical: spacing.sm + spacing.xs, paddingHorizontal: spacing.md },
  dense: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm },
  label: { fontSize: 15, fontWeight: '600' },
  labelDense: { fontSize: 13, fontWeight: '600' },
  disabled: { opacity: 0.5 },
});