import { Pressable, Text, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export type AppButtonVariant = 'primary' | 'secondary' | 'danger' | 'success';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  dense?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  dense,
  disabled,
  style,
}: AppButtonProps) {
  const { colors } = useTheme();

  const background =
    variant === 'danger' ? colors.danger :
    variant === 'success' ? colors.success :
    variant === 'secondary' ? colors.card :
    colors.primary;

  const textColor = variant === 'secondary' ? colors.primary : colors.onPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        dense ? styles.buttonDense : styles.button,
        { backgroundColor: background },
        variant === 'secondary' && [styles.secondary, { borderColor: colors.border }],
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[dense ? styles.textDense : styles.text, { color: textColor }]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  buttonDense: { paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  secondary: { borderWidth: 1 },
  disabled: { opacity: 0.5 },
  text: { fontSize: 15, fontWeight: '700' },
  textDense: { fontSize: 13, fontWeight: '600' },
});