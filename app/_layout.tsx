import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '../src/context/ThemeContext';
import { TasksProvider } from '../src/context/TasksContext';
import { useTheme } from '../src/hooks/useTheme';

function RootStack() {
  const { theme, colors } = useTheme();

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.onPrimary,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Campus Planner' }} />
        <Stack.Screen name="create" options={{ title: 'Новая задача', presentation: 'modal' }} />
        <Stack.Screen name="task/[id]" options={{ title: 'Детали задачи' }} />
        <Stack.Screen name="edit/[id]" options={{ title: 'Редактирование', presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ title: 'Настройки' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <TasksProvider>
        <RootStack />
      </TasksProvider>
    </ThemeProvider>
  );
}
