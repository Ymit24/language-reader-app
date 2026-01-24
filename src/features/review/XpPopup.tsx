import React, { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';

interface XpPopupProps {
  xp: number;
  bonusXp?: number;
  onComplete?: () => void;
}

export function XpPopup({ xp, bonusXp = 0, onComplete }: XpPopupProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withDelay(800, withTiming(0, { duration: 300 }))
    );
    
    translateY.value = withSequence(
      withTiming(-20, { duration: 150 }),
      withTiming(-60, { duration: 1000 })
    );
    
    scale.value = withSequence(
      withTiming(1.2, { duration: 150 }),
      withTiming(1, { duration: 100 })
    );

    const timeout = setTimeout(() => {
      onComplete?.();
    }, 1300);

    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const displayText = bonusXp > 0 ? `+${xp} (+${bonusXp}) XP` : `+${xp} XP`;

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          alignSelf: 'center',
          top: '40%',
          zIndex: 100,
          backgroundColor: '#22c55e',
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 12,
          shadowColor: '#22c55e',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        },
      ]}
    >
      <Text className="text-lg font-sans-bold text-white">
        {displayText}
      </Text>
    </Animated.View>
  );
}
