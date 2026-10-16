import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../../theme/spacing';

interface AppInputProps {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string;
  style?: ViewStyle;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
}

export default function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  style,
  multiline,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
}: AppInputProps) {
  const { colors } = useTheme();
  const hasError = Boolean(error);

  return (
    <View style={style}>
      {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtext}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            color: colors.text,
            borderColor: hasError ? colors.danger : colors.border,
          },
        ]}
      />
      {hasError ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  error: { fontSize: 12, marginTop: spacing.xs },
});
