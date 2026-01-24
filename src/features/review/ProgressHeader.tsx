import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LevelBadge } from './LevelBadge';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface ProgressHeaderProps {
  level: number;
  title: string;
  totalXp: number;
  currentXpInLevel: number;
  xpForNextLevel: number;
  xpProgress: number;
  currentStreak: number;
  isLoading?: boolean;
}

export function ProgressHeader({
  level,
  title,
  totalXp,
  currentXpInLevel,
  xpForNextLevel,
  xpProgress,
  currentStreak,
  isLoading = false,
}: ProgressHeaderProps) {
  if (isLoading) {
    return (
      <View className="rounded-2xl border border-border/80 bg-panel p-5 shadow-card">
        <View className="flex-row items-center gap-4">
          <View className="w-14 h-14 rounded-full bg-muted animate-pulse" />
          <View className="flex-1 gap-2">
            <View className="w-32 h-5 rounded bg-muted animate-pulse" />
            <View className="w-full h-3 rounded-full bg-muted animate-pulse" />
          </View>
        </View>
      </View>
    );
  }

  // Generate avatar color based on level
  const avatarColors = [
    '#2f6b66', '#b56a2c', '#3c7da8', '#1d6b4f', '#7a4f1f',
    '#5b4b8a', '#7a3f34', '#9b3b5a', '#e65100', '#524a43',
  ];
  const avatarColor = avatarColors[(level - 1) % avatarColors.length];

  return (
    <View className="rounded-2xl border border-border/80 bg-panel p-5 shadow-card">
      <View className="flex-row items-center gap-4">
        {/* Avatar */}
        <View
          className="w-14 h-14 rounded-full items-center justify-center"
          style={{ backgroundColor: avatarColor }}
        >
          <Text className="text-xl font-sans-bold text-white">
            {title.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Level and Progress */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-2">
            <LevelBadge level={level} title={title} size="medium" />
            <View className="flex-row items-center gap-1">
              <Ionicons name="flame" size={18} color="#b56a2c" />
              <Text className="text-sm font-sans-bold text-accent">
                {currentStreak} day{currentStreak !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* XP Progress Bar */}
          <View className="gap-1">
            <View className="h-2.5 rounded-full bg-muted overflow-hidden">
              <Animated.View
                className="h-full rounded-full bg-brand"
                style={{ width: `${Math.min(xpProgress, 100)}%` }}
              />
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-faint font-sans-medium">
                {currentXpInLevel.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
              </Text>
              <Text className="text-xs text-faint font-sans-medium">
                {totalXp.toLocaleString()} total
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
