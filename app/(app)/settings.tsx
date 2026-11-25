import { StyleSheet, Switch, Text, View } from 'react-native';
import AppButton from '../../src/components/ui/AppButton';
import Screen from '../../src/components/ui/Screen';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { spacing } from '../../src/theme/spacing';

export default function SettingsScreen() {
  const { theme, colors, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <Screen style={styles.content}>
      <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.labels}>
          <Text style={[styles.title, { color: colors.text }]}>Тёмная тема</Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            Текущая: {theme === 'dark' ? 'тёмная' : 'светлая'}
          </Text>
        </View>
        <Switch
          value={theme === 'dark'}
          onValueChange={toggleTheme}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#FFFFFF"
        />
      </View>

      {user ? (
        <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.labels}>
            <Text style={[styles.title, { color: colors.text }]}>{user.name}</Text>
            <Text style={[styles.subtitle, { color: colors.subtext }]}>@{user.login}</Text>
          </View>
        </View>
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
        Выбор темы сохраняется в AsyncStorage и применяется при следующем запуске приложения.
        Задачи хранятся на сервере Campus API: кэш очищается при выходе из аккаунта,
        а черновик новой задачи привязан к пользователю.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
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
  button: { alignSelf: 'stretch' },
  hint: { fontSize: 13, lineHeight: 18 },
});
