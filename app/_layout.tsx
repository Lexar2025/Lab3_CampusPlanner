import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../src/auth/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { useAuth } from '../src/hooks/useAuth';
import { useTheme } from '../src/hooks/useTheme';

function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();
  const { theme, colors } = useTheme();

  if (isLoading) {
    return (
      <>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.background,
          }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
