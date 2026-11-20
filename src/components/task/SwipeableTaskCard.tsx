import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import TaskCard from './TaskCard';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../../theme/spacing';
import type { Task } from '../../types/task';

interface SwipeableTaskCardProps {
  task: Task;
  onPress: () => void;
  onToggle: () => void;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  highlight?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const SWIPE_ACTION_THRESHOLD = 100;
const SWIPE_MAX_OFFSET = 170;
const SWIPE_ACTIVATION_OFFSET = 12;
const RETURN_SPRING = { damping: 18, stiffness: 220 };

export default function SwipeableTaskCard({
  task,
  onPress,
  onToggle,
  onSwipeRight,
  onSwipeLeft,
  highlight = false,
  onEdit,
  onDelete,
}: SwipeableTaskCardProps) {
  const { colors } = useTheme();
  const isDone = task.status === 'completed';
  const translateX = useSharedValue(0);
  const pan = Gesture.Pan()
    .failOffsetY([-8, 8])
    .activeOffsetX([-SWIPE_ACTIVATION_OFFSET, SWIPE_ACTIVATION_OFFSET])
    .onUpdate((event) => {
      'worklet';
      translateX.value = Math.min(
        SWIPE_MAX_OFFSET,
        Math.max(-SWIPE_MAX_OFFSET, event.translationX),
      );
    })
    .onEnd((event) => {
      'worklet';
      if (event.translationX > SWIPE_ACTION_THRESHOLD) {
        
        runOnJS(onSwipeRight)();
      } else if (event.translationX < -SWIPE_ACTION_THRESHOLD) {
        runOnJS(onSwipeLeft)();
      }
      translateX.value = withSpring(0, RETURN_SPRING);
    });

  const completeBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_ACTION_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const deleteBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_ACTION_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));
 
  const completeIconStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          translateX.value,
          [0, SWIPE_ACTION_THRESHOLD],
          [0.7, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));
  const deleteIconStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          translateX.value,
          [-SWIPE_ACTION_THRESHOLD, 0],
          [1, 0.7],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));
 
  const cardPanStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bgShell,
          { backgroundColor: colors.success },
          completeBgStyle,
        ]}
      >
        <Animated.View style={[styles.action, styles.actionLeft, completeIconStyle]}>
          <Ionicons name={isDone ? 'arrow-undo' : 'checkmark-circle'} size={22} color="#FFFFFF" />
          <Text style={styles.actionLabel}>{isDone ? 'Вернуть' : 'Выполнить'}</Text>
        </Animated.View>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[styles.bgShell, { backgroundColor: colors.danger }, deleteBgStyle]}
      >
        <Animated.View style={[styles.action, styles.actionRight, deleteIconStyle]}>
          <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
          <Text style={styles.actionLabel}>Удалить</Text>
        </Animated.View>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={cardPanStyle}>
          <TaskCard
            task={task}
            onPress={onPress}
            onToggle={onToggle}
            highlight={highlight}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  bgShell: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  actionLeft: {
    alignSelf: 'flex-start',
    paddingLeft: spacing.md + spacing.sm,
  },
  actionRight: {
    alignSelf: 'flex-end',
    paddingRight: spacing.md + spacing.sm,
  },
  actionLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
