import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { useAppTheme } from '@/src/theme/AppThemeProvider';

interface SessionHeaderProps {
  currentIndex: number;
  totalItems: number;
  totalXp: number;
  onClose: () => void;
}

export function SessionHeader({
  currentIndex,
  totalItems,
  totalXp,
  onClose,
}: SessionHeaderProps) {
  const { colors } = useAppTheme();
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    if (totalItems > 0) {
      progressWidth.value = withTiming(
        (currentIndex / totalItems) * 100,
        { duration: 300 }
      );
    }
  }, [currentIndex, totalItems, progressWidth]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <View className="px-4 py-3 flex-row items-center justify-between">
      {/* Close button */}
      <Pressable
        onPress={onClose}
        className="w-10 h-10 rounded-full items-center justify-center bg-muted/50 active:bg-muted"
      >
        <Ionicons name="close" size={24} color={colors['--subink']} />
      </Pressable>

      {/* Progress */}
      <View className="flex-1 mx-4">
        <View className="h-2 rounded-full bg-muted overflow-hidden">
          <Animated.View
            style={progressStyle}
            className="h-full rounded-full bg-brand"
          />
        </View>
        <Text className="text-xs text-center text-faint font-sans-medium mt-1">
          {currentIndex + 1} / {totalItems}
        </Text>
      </View>

      {/* XP counter */}
      <View className="bg-brandSoft px-3 py-1.5 rounded-full">
        <Text className="text-sm font-sans-bold text-brand">
          +{totalXp} XP
        </Text>
      </View>
    </View>
  );
}
