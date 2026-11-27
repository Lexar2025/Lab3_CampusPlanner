import { Switch, Text, StyleSheet } from 'react-native';
import AppButton from '../../src/components/ui/AppButton';
import SettingsRow from '../../src/components/ui/SettingsRow';
import Screen from '../../src/components/ui/Screen';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { spacing } from '../../src/theme/spacing';

export default function SettingsScreen() {
  const { theme, colors, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <Screen style={styles.content}>
      <SettingsRow
        title="Тёмная тема"
        subtitle={
          theme === 'dark' ? 'Включена' : 'Выключена'
        }
        right={
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        }
      />

      {user ? (
        <SettingsRow title={user.name} subtitle={`@${user.login}`} />
      ) : null}

      <AppButton
        label="Выйти"
        variant="danger"
        onPress={() => {
          void signOut();
        }}
        style={styles.button}
      />

      <Text style={[styles.hint, { color: colors.subtext }]}>
        Ваши задачи и токен сессии хранятся в защищённом хранилище устройства.
        Адрес учебного API настраивается через переменную окружения EXPO_PUBLIC_API_URL.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  button: { alignSelf: 'stretch' },
  hint: { fontSize: 13, lineHeight: 18 },
});
