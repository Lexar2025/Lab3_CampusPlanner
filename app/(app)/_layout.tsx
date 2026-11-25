import { Stack } from 'expo-router';
import { TasksUiProvider } from '../../src/features/tasks/TasksUiContext';
import { useTheme } from '../../src/hooks/useTheme';

function AppStack() {
  const { colors } = useTheme();

  return (
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
  );
}

export default function AppLayout() {
  return (
    <TasksUiProvider>
      <AppStack />
    </TasksUiProvider>
  );
}
