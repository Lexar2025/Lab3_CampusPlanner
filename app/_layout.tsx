import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
  /**
   * ЛР №5: корневой контейнер обработки жестов (GestureHandlerRootView).
   * Без него GestureDetector-жесты не распознаются — контейнер должен
   * охватывать всё приложение, включая все экраны навигатора.
   */
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <TasksProvider>
          <RootStack />
        </TasksProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
