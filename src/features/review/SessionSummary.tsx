import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LevelBadge } from './LevelBadge';
import { useAppTheme } from '@/src/theme/AppThemeProvider';

interface SessionSummaryProps {
  totalCards: number;
  correctCount: number;
  xpEarned: number;
  currentStreak: number;
  leveledUp: boolean;
  newLevel?: number;
  newTitle?: string;
  onDone: () => void;
}

export function SessionSummary({
  totalCards,
  correctCount,
  xpEarned,
  currentStreak,
  leveledUp,
  newLevel,
  newTitle,
  onDone,
}: SessionSummaryProps) {
  const { colors } = useAppTheme();
  const accuracy = Math.round((correctCount / totalCards) * 100);

  const cardScale = useSharedValue(0);
  const xpScale = useSharedValue(0);
  const statsOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const levelUpScale = useSharedValue(0);

  useEffect(() => {
    // Staggered animations
    cardScale.value = withSpring(1, { damping: 12 });

    xpScale.value = withDelay(
      200,
      withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 12 }),
      ),
    );

    statsOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));

    if (leveledUp) {
      levelUpScale.value = withDelay(
        600,
        withSequence(
          withSpring(1.3, { damping: 8 }),
          withSpring(1, { damping: 12 }),
        ),
      );
    }

    buttonOpacity.value = withDelay(800, withTiming(1, { duration: 300 }));
  }, []);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const xpAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: xpScale.value }],
  }));

  const statsAnimStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const levelUpAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: levelUpScale.value }],
    opacity: levelUpScale.value,
  }));

  const getAccuracyColor = () => {
    if (accuracy >= 80) return 'text-success';
    if (accuracy >= 60) return 'text-warning';
    return 'text-danger';
  };

  const getAccuracyEmoji = () => {
    if (accuracy >= 90) return '🎯';
    if (accuracy >= 80) return '💪';
    if (accuracy >= 60) return '👍';
    return '📚';
  };

  return (
    <View className="flex-1 items-center justify-center bg-canvas px-6">
      <Animated.View
        style={cardAnimStyle}
        className="w-full max-w-md rounded-3xl border border-border/80 bg-panel p-8 shadow-card"
      >
        {/* Header */}
        <View className="mb-6 items-center">
          <Text className="mb-2 text-4xl">{getAccuracyEmoji()}</Text>
          <Text className="font-serif-bold text-2xl text-ink">
            Session Complete!
          </Text>
        </View>

        {/* XP Earned */}
        <Animated.View style={xpAnimStyle} className="mb-6 items-center">
          <View className="rounded-2xl bg-brandSoft px-6 py-3">
            <Text className="font-sans-bold text-3xl text-brand">
              +{xpEarned} XP
            </Text>
          </View>
        </Animated.View>

        {/* Level Up Celebration */}
        {leveledUp && newLevel && newTitle && (
          <Animated.View
            style={levelUpAnimStyle}
            className="mb-6 items-center rounded-2xl bg-gradient-to-r from-brandSoft to-successSoft px-6 py-4"
          >
            <View className="mb-2 flex-row items-center gap-2">
              <Ionicons name="trophy" size={24} color={colors['--accent']} />
              <Text className="font-sans-bold text-lg text-accent">
                Level Up!
              </Text>
            </View>
            <LevelBadge level={newLevel} title={newTitle} size="large" />
          </Animated.View>
        )}

        {/* Stats Grid */}
        <Animated.View style={statsAnimStyle} className="mb-8 gap-4">
          <View className="flex-row gap-4">
            {/* Accuracy */}
            <View className="flex-1 items-center rounded-xl bg-muted/50 p-4">
              <Text className={`font-sans-bold text-2xl ${getAccuracyColor()}`}>
                {accuracy}%
              </Text>
              <Text className="mt-1 font-sans-medium text-xs text-faint">
                Accuracy
              </Text>
            </View>

            {/* Cards Reviewed */}
            <View className="flex-1 items-center rounded-xl bg-muted/50 p-4">
              <Text className="font-sans-bold text-2xl text-ink">
                {totalCards}
              </Text>
              <Text className="mt-1 font-sans-medium text-xs text-faint">
                Cards
              </Text>
            </View>
          </View>

          {/* Streak */}
          <View className="flex-row items-center justify-center gap-2 py-3">
            <Ionicons name="flame" size={20} color={colors['--accent']} />
            <Text className="font-sans-bold text-lg text-accent">
              {currentStreak} day streak
            </Text>
          </View>
        </Animated.View>

        {/* Done Button */}
        <Animated.View style={buttonAnimStyle}>
          <Pressable
            onPress={onDone}
            className="w-full items-center rounded-xl bg-brand py-4 active:bg-brand/90"
          >
            <Text className="font-sans-bold text-base text-white">Done</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
