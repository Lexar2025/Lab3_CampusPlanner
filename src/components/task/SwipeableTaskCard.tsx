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
  /** Обычное нажатие — переход к деталям (сохранён из ЛР №1–№4). */
  onPress: () => void;
  onToggle: () => void;
  /** Порог свайпа вправо достигнут → сменить статус записи. */
  onSwipeRight: () => void;
  /** Порог свайпа влево достигнут → запросить подтверждение удаления. */
  onSwipeLeft: () => void;
  highlight?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

/** ЛР №5: порог смещения, после которого жест считается намеренным действием. */
const SWIPE_ACTION_THRESHOLD = 100;
/** ЛР №5: ограничение смещения — карточка не может уехать за границы. */
const SWIPE_MAX_OFFSET = 170;
/** ЛР №5: жест активируется после 12px по горизонтали,
 * поэтому короткое движение и касание остаются обычным нажатием. */
const SWIPE_ACTIVATION_OFFSET = 12;
/** ЛР №5: пружина возврата карточки на исходную позицию. */
const RETURN_SPRING = { damping: 18, stiffness: 220 };

/**
 * ЛР №5: свайп-обёртка над TaskCard.
 *
 * Сама карточка и её анимации ЛР №4 остаются неизменными — обёртка добавляет:
 *  - панорамный жест через GestureDetector + Gesture.Pan();
 *  - фон действий под карточкой с интенсивностью, зависящей от дистанции
 *    свайпа (interpolate);
 *  - вызов бизнес-логики после жеста через runOnJS, т.к. колбэки жеста —
 *    worklet'ы и не должны напрямую менять React-состояние.
 */
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

  /** Горизонтальное смещение карточки; SharedValue — только визуал,
   * источник истины о статусе по-прежнему task.status из контекста задач. */
  const translateX = useSharedValue(0);

  /**
   * Pan-жест свайпа.
   *  - onUpdate: обновляет translateX с ограничением по SWIPE_MAX_OFFSET;
   *  - onEnd: проверяет порог SWIPE_ACTION_THRESHOLD; бизнес-логика
   *    (смена статуса / подтверждение удаления) вызывается через runOnJS,
   *    а карточка в любом случае возвращается пружиной withSpring.
   * Жест создаётся в теле рендера — рекомендованный способ в Reanimated 4:
   * GestureDetector подхватывает обновлённый объект, мемоизация не нужна.
   */
  const pan = Gesture.Pan()
    // Вертикальное движение делает жест «проваленным» (fail) —
    // это не конфликтует со скроллом FlatList
    .failOffsetY([-8, 8])
    // Активация при 12px горизонтального движения: обычное нажатие
    // на карточку (переход к деталям) продолжает работать
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
        // Смена статуса — React-логика: вызов передаётся на JS-поток
        runOnJS(onSwipeRight)();
      } else if (event.translationX < -SWIPE_ACTION_THRESHOLD) {
        // Подтверждение удаления тоже показывается на JS-стороне
        runOnJS(onSwipeLeft)();
      }
      // Незавершённый свайп и действие после порога: возврат на место
      translateX.value = withSpring(0, RETURN_SPRING);
    });

  /** Интенсивность зоны «Выполнить» растёт со свайпом вправо. */
  const completeBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_ACTION_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));
  /** Интенсивность зоны «Удалить» растёт со свайпом влево. */
  const deleteBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_ACTION_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));
  /** Иконки действий слегка дожимаются к 1 у порога — усиливают подсказку. */
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
  /** Непосредственно смещение карточки под пальцем. */
  const cardPanStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View>
      {/*
        * Фоновые зоны действий находятся строго под карточкой
        * (absolute + те же отступы, что у card silhouette) и не
        * перехватывают касания (pointerEvents="none").
        */}
      {/* Свайп вправо: «Выполнить» / «Вернуть» — содержимое у левого края */}
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
      {/* Свайп влево: «Удалить» — содержимое у правого края */}
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

/**
 * Фон зоны выровнен по силуэту TaskCard (marginTop 0, внутренние
 * отступы карточки marginHorizontal / marginBottom), закругление — как у карты.
 */
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
