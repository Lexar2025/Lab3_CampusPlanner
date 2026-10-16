import { StyleSheet, Switch, Text, View } from 'react-native';
import Screen from '../src/components/ui/Screen';
import { useTheme } from '../src/hooks/useTheme';
import { spacing } from '../src/theme/spacing';

export default function SettingsScreen() {
  const { theme, colors, toggleTheme } = useTheme();

  return (
    <Screen>
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

      <Text style={[styles.hint, { color: colors.subtext }]}>
        Выбор сохраняется в AsyncStorage и применяется при следующем запуске приложения.
        Задачи хранятся в памяти приложения (согласно ТЗ ЛР3).
      </Text>
    </Screen>
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
  hint: { fontSize: 13, marginTop: spacing.md, lineHeight: 18 },
});
