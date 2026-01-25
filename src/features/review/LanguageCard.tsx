import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LanguageFlag } from '../../components/LanguageFlag';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface LanguageCardProps {
  language: 'fr' | 'de' | 'ja';
  languageName: string;
  dueCount: number;
  learningCount: number;
  knownCount: number;
  onStartReview: () => void;
  isLoading?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function LanguageCard({
  language,
  languageName,
  dueCount,
  learningCount,
  knownCount,
  onStartReview,
  isLoading = false,
}: LanguageCardProps) {
  const hasDue = dueCount > 0;
  const pulseScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  // Pulse animation for due badge
  React.useEffect(() => {
    if (hasDue) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = 1;
    }
  }, [hasDue, pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1);
  };

  if (isLoading) {
    return (
      <View className="rounded-2xl border border-border/80 bg-panel p-4 shadow-card">
        <View className="flex-row items-center gap-4">
          <View className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
          <View className="flex-1 gap-2">
            <View className="h-5 w-24 rounded bg-muted animate-pulse" />
            <View className="h-4 w-32 rounded bg-muted animate-pulse" />
          </View>
        </View>
      </View>
    );
  }

  const accentColors: Record<string, { bg: string; border: string }> = {
    de: { bg: '#fdf8ef', border: '#d7b98a' },
    fr: { bg: '#f0f6fb', border: '#9bbbd2' },
    ja: { bg: '#faf5f4', border: '#d2a39b' },
  };

  const accent = accentColors[language] || accentColors.fr;

  return (
    <AnimatedPressable
      onPress={hasDue ? onStartReview : undefined}
      onPressIn={hasDue ? handlePressIn : undefined}
      onPressOut={hasDue ? handlePressOut : undefined}
      style={[
        buttonAnimStyle,
        {
          opacity: hasDue ? 1 : 0.7,
        },
      ]}
      disabled={!hasDue}
    >
      <View
        className="rounded-2xl border border-border/80 bg-panel shadow-card overflow-hidden"
        style={{
          borderTopWidth: 3,
          borderTopColor: accent.border,
        }}
      >
        <View className="p-4 gap-4">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View
                className="w-12 h-12 rounded-xl items-center justify-center"
                style={{ backgroundColor: accent.bg }}
              >
                <LanguageFlag code={language} size={28} />
              </View>
              <View>
                <Text className="text-lg font-sans-bold text-ink">
                  {languageName}
                </Text>
                <Text className="text-xs text-subink font-sans-medium">
                  {knownCount + learningCount} words total
                </Text>
              </View>
            </View>

            {/* Due Badge */}
            {hasDue ? (
              <Animated.View
                style={pulseStyle}
                className="px-3 py-1.5 rounded-full bg-brand"
              >
                <Text className="text-sm font-sans-bold text-white">
                  {dueCount} due
                </Text>
              </Animated.View>
            ) : (
              <View className="px-3 py-1.5 rounded-full bg-muted">
                <Text className="text-sm font-sans-semibold text-faint">
                  All caught up
                </Text>
              </View>
            )}
          </View>

          {/* Stats Row */}
          <View className="flex-row gap-4">
            <View className="flex-row items-center gap-1.5">
              <View className="w-2.5 h-2.5 rounded-full bg-warning" />
              <Text className="text-xs text-subink font-sans-medium">
                {learningCount} learning
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="w-2.5 h-2.5 rounded-full bg-success" />
              <Text className="text-xs text-subink font-sans-medium">
                {knownCount} known
              </Text>
            </View>
          </View>

          {/* Start Button */}
          {hasDue && (
            <Pressable
              onPress={onStartReview}
              className="flex-row items-center justify-center gap-2 py-3 rounded-xl bg-brand active:bg-brand/90"
            >
              <Ionicons name="flash" size={18} color="#fff" />
              <Text className="text-sm font-sans-bold text-white">
                Start Review
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}
