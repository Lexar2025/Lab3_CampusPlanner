import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApiError } from '../../src/api/http';
import AppButton from '../../src/components/ui/AppButton';
import AppInput from '../../src/components/ui/AppInput';
import Screen from '../../src/components/ui/Screen';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { spacing } from '../../src/theme/spacing';

export default function LoginScreen() {
  const { signIn, authNotice } = useAuth();
  const { colors } = useTheme();

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | undefined>(undefined);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    const trimmedLogin = login.trim();
    const nextLoginError = trimmedLogin ? undefined : 'Введите логин.';
    const nextPasswordError = password.trim() ? undefined : 'Введите пароль.';

    setLoginError(nextLoginError);
    setPasswordError(nextPasswordError);

    if (nextLoginError || nextPasswordError) {
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      await signIn({ login: trimmedLogin, password });
      setPassword('');
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Не удалось войти. Попробуйте ещё раз.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen bottomOnlySafe={false} style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Campus Planner</Text>
            <Text style={[styles.subtitle, { color: colors.subtext }]}>
              Войдите в учебный планировщик
            </Text>
          </View>

          {authNotice ? (
            <View
              style={[styles.notice, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.noticeText, { color: colors.subtext }]}>{authNotice}</Text>
            </View>
          ) : null}

          <AppInput
            label="Логин"
            value={login}
            onChangeText={setLogin}
            autoCapitalize="none"
            placeholder="Например, student01"
            error={loginError}
          />

          <AppInput
            label="Пароль"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            error={passwordError}
          />

          {formError ? (
            <Text style={[styles.formError, { color: colors.danger }]}>{formError}</Text>
          ) : null}

          <AppButton
            label={isSubmitting ? 'Вход...' : 'Войти'}
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={styles.button}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', gap: spacing.md },
  header: { gap: spacing.xs, marginBottom: spacing.sm },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 15 },
  notice: { padding: spacing.md, borderRadius: 12, borderWidth: 1 },
  noticeText: { fontSize: 14, lineHeight: 20 },
  formError: { fontSize: 14 },
  button: { alignSelf: 'stretch' },
});
