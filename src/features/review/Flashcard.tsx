import { useRef, useState, useEffect } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { Doc } from '@/convex/_generated/dataModel';

interface FlashcardProps {
  vocab: Doc<"vocab">;
  isFlipped: boolean;
  onFlip: () => void;
}

export function Flashcard({ vocab, isFlipped, onFlip }: FlashcardProps) {
  const animation = useRef(new Animated.Value(0)).current;
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    if (isFlipped) {
      setShowBack(true);
      animation.setValue(180);
    } else {
      setShowBack(false);
      animation.setValue(0);
    }
  }, [isFlipped, animation]);

  const frontInterpolate = animation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = animation.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const handlePress = () => {
    if (!showBack) {
      Animated.timing(animation, {
        toValue: 180,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowBack(true);
      });
      onFlip();
    }
  };

  return (
    <View className="perspective-1000">
      <Pressable onPress={handlePress} className="w-full h-full">
        <Animated.View
          className="w-full h-full bg-panel rounded-2xl border-2 border-border shadow-pop justify-center items-center p-8"
          style={{
            transform: [{ rotateY: frontInterpolate }],
          }}
        >
          <Text className="text-4xl font-serif font-medium text-ink text-center">
            {vocab.display}
          </Text>
          <Text className="text-sm text-subink mt-4">Tap to reveal</Text>
        </Animated.View>

        <Animated.View
          className="absolute inset-0 w-full h-full bg-panel rounded-2xl border-2 border-vKnownLine/30 shadow-pop p-8 justify-center items-center"
          style={{
            transform: [{ rotateY: backInterpolate }],
            backfaceVisibility: 'hidden',
          }}
        >
          <Text className="text-4xl font-serif font-medium text-ink text-center mb-2">
            {vocab.display}
          </Text>
          {vocab.reading && (
            <Text className="text-xl text-subink mb-4">{vocab.reading}</Text>
          )}
          {vocab.pos && (
            <Text className="text-sm text-vUnknownLine uppercase tracking-wide font-semibold mb-3">
              {vocab.pos}
            </Text>
          )}
          {vocab.meaning ? (
            <Text className="text-xl text-ink/80 text-center font-serif leading-7">
              {vocab.meaning}
            </Text>
          ) : (
            <Text className="text-lg text-faint text-center italic">
              No definition available
            </Text>
          )}
          <Text className="text-xs text-subink mt-6">Select a rating below</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}
