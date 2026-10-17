import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../../theme/spacing';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success';

interface AppButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Плотный режим для сегмент-контролов: меньше отступы и шрифт, без переноса текста. */
  dense?: boolean;
  style?: ViewStyle;
}

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  dense = false,
  style,
}: AppButtonProps) {
  const { colors } = useTheme();

  const filledBg: Record<ButtonVariant, string> = {
    primary: colors.primary,
    success: colors.success,
    danger: colors.danger,
    secondary: 'transparent',
  };

  const textColor: Record<ButtonVariant, string> = {
    primary: colors.onPrimary,
    success: '#FFFFFF',
    danger: '#FFFFFF',
    secondary: colors.primary,
  };

  const borderColor = variant === 'secondary' ? colors.primary : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        dense ? styles.buttonDense : styles.button,
        { backgroundColor: filledBg[variant], borderColor },
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        numberOfLines={1}
        style={[dense ? styles.textDense : styles.text, { color: textColor[variant] }]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDense: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontSize: 15, fontWeight: '700' },
  textDense: { fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
