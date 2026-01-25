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
    
    xpScale.value = withDelay(200, withSequence(
      withSpring(1.2, { damping: 8 }),
      withSpring(1, { damping: 12 })
    ));
    
    statsOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));
    
    if (leveledUp) {
      levelUpScale.value = withDelay(600, withSequence(
        withSpring(1.3, { damping: 8 }),
        withSpring(1, { damping: 12 })
      ));
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
    <View className="flex-1 bg-canvas items-center justify-center px-6">
      <Animated.View
        style={cardAnimStyle}
        className="w-full max-w-md rounded-3xl bg-panel border border-border/80 shadow-card p-8"
      >
        {/* Header */}
        <View className="items-center mb-6">
          <Text className="text-4xl mb-2">{getAccuracyEmoji()}</Text>
          <Text className="text-2xl font-serif-bold text-ink">
            Session Complete!
          </Text>
        </View>

        {/* XP Earned */}
        <Animated.View style={xpAnimStyle} className="items-center mb-6">
          <View className="bg-brandSoft px-6 py-3 rounded-2xl">
            <Text className="text-3xl font-sans-bold text-brand">
              +{xpEarned} XP
            </Text>
          </View>
        </Animated.View>

        {/* Level Up Celebration */}
        {leveledUp && newLevel && newTitle && (
          <Animated.View 
            style={levelUpAnimStyle} 
            className="items-center mb-6 py-4 px-6 rounded-2xl bg-gradient-to-r from-brandSoft to-successSoft"
          >
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name="trophy" size={24} color={colors['--accent']} />
              <Text className="text-lg font-sans-bold text-accent">
                Level Up!
              </Text>
            </View>
            <LevelBadge level={newLevel} title={newTitle} size="large" />
          </Animated.View>
        )}

        {/* Stats Grid */}
        <Animated.View style={statsAnimStyle} className="gap-4 mb-8">
          <View className="flex-row gap-4">
            {/* Accuracy */}
            <View className="flex-1 bg-muted/50 rounded-xl p-4 items-center">
              <Text className={`text-2xl font-sans-bold ${getAccuracyColor()}`}>
                {accuracy}%
              </Text>
              <Text className="text-xs text-faint font-sans-medium mt-1">
                Accuracy
              </Text>
            </View>

            {/* Cards Reviewed */}
            <View className="flex-1 bg-muted/50 rounded-xl p-4 items-center">
              <Text className="text-2xl font-sans-bold text-ink">
                {totalCards}
              </Text>
              <Text className="text-xs text-faint font-sans-medium mt-1">
                Cards
              </Text>
            </View>
          </View>

          {/* Streak */}
          <View className="flex-row items-center justify-center gap-2 py-3">
            <Ionicons name="flame" size={20} color={colors['--accent']} />
            <Text className="text-lg font-sans-bold text-accent">
              {currentStreak} day streak
            </Text>
          </View>
        </Animated.View>

        {/* Done Button */}
        <Animated.View style={buttonAnimStyle}>
          <Pressable
            onPress={onDone}
            className="w-full py-4 rounded-xl bg-brand items-center active:bg-brand/90"
          >
            <Text className="text-base font-sans-bold text-white">
              Done
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
