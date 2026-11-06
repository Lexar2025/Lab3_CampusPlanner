import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../../theme/spacing';

interface Props {
  completed: number;
  total: number;
}

export default function ProgressBar({ completed, total }: Props) {
  const { colors } = useTheme();
  const progress = useSharedValue(0);
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    const target = total === 0 ? 0 : Math.min(1, Math.max(0, completed / total));
    progress.value = withTiming(target, { duration: 400 });
  }, [completed, total, progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [0, trackWidth]),
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: colors.text }]}>Прогресс выполнения</Text>
        <Text style={[styles.percent, { color: colors.subtext }]}>
          {total === 0 ? 0 : Math.round((completed / total) * 100)}%
        </Text>
      </View>
      <View
        style={[styles.track, { backgroundColor: colors.border }]}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View style={[styles.bar, { backgroundColor: colors.success }, barStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  label: { fontSize: 14, fontWeight: '600' },
  percent: { fontSize: 14, fontWeight: '600' },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  bar: { height: 8, borderRadius: 4 },
});