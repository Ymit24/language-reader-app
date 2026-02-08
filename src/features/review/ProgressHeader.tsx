import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { LevelBadge } from './LevelBadge';
import { useAppTheme } from '@/src/theme/AppThemeProvider';

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
  const { colors } = useAppTheme();
  if (isLoading) {
    return (
      <View className="rounded-2xl border border-border/80 bg-panel p-5 shadow-card">
        <View className="flex-row items-center gap-4">
          <View className="h-14 w-14 animate-pulse rounded-full bg-muted" />
          <View className="flex-1 gap-2">
            <View className="h-5 w-32 animate-pulse rounded bg-muted" />
            <View className="h-3 w-full animate-pulse rounded-full bg-muted" />
          </View>
        </View>
      </View>
    );
  }

  const avatarColors = [
    '#2f6b66',
    '#b56a2c',
    '#3c7da8',
    '#1d6b4f',
    '#7a4f1f',
    '#5b4b8a',
    '#7a3f34',
    '#9b3b5a',
    '#e65100',
    '#524a43',
  ];
  const avatarColor = avatarColors[(level - 1) % avatarColors.length];

  return (
    <View className="rounded-2xl border border-border/80 bg-panel p-5 shadow-card">
      <View className="flex-row items-center">
        {/* Avatar - fixed size, won't shrink */}
        <View
          className="h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: avatarColor, flexShrink: 0 }}
        >
          <Text className="font-sans-bold text-xl text-white">
            {title.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Spacer instead of gap (more reliable on native) */}
        <View style={{ width: 16 }} />

        {/* Level and Progress - use minWidth: 0 to allow proper flex behavior */}
        <View style={{ flex: 1, minWidth: 0 }}>
          {/* Badge + Streak row */}
          <View
            className="mb-2 flex-row items-center"
            style={{ justifyContent: 'space-between' }}
          >
            {/* Badge wrapper - prevent shrinking */}
            <View style={{ flexShrink: 0 }}>
              <LevelBadge level={level} title={title} size="medium" />
            </View>

            {/* Streak - prevent shrinking, add left margin */}
            <View
              className="flex-row items-center"
              style={{ flexShrink: 0, marginLeft: 12 }}
            >
              <Ionicons name="flame" size={18} color={colors['--accent']} />
              <Text
                className="font-sans-bold text-sm text-accent"
                style={{ marginLeft: 4 }}
              >
                {currentStreak} day{currentStreak !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* XP Progress Bar */}
          <View>
            <View className="h-2.5 overflow-hidden rounded-full bg-muted">
              <Animated.View
                className="h-full rounded-full bg-brand"
                style={{ width: `${Math.min(xpProgress, 100)}%` }}
              />
            </View>
            <View className="flex-row justify-between" style={{ marginTop: 4 }}>
              <Text className="font-sans-medium text-xs text-faint">
                {currentXpInLevel.toLocaleString()} /{' '}
                {xpForNextLevel.toLocaleString()} XP
              </Text>
              <Text className="font-sans-medium text-xs text-faint">
                {totalXp.toLocaleString()} total
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
