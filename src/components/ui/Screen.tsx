import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../../theme/spacing';

interface ScreenProps {
  children: ReactNode;
  /** Внутренние отступы 16px (по умолчанию true). Выключайте, когда внутри FlatList. */
  padded?: boolean;
  style?: ViewStyle;
  /** Ограничить safe-area только нижней стороной — актуально, когда сверху Stack-header */
  bottomOnlySafe?: boolean;
}

export default function Screen({
  children,
  padded = true,
  style,
  bottomOnlySafe = true,
}: ScreenProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      edges={bottomOnlySafe ? ['bottom'] : undefined}
    >
      <View style={[padded && styles.padded, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  padded: { padding: spacing.md },
});
