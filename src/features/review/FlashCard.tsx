import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

interface FlashCardProps {
  word: string;
  definition?: string;
  example?: string;
  context?: string;
  language: 'de' | 'fr' | 'ja';
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  isInteractive?: boolean;
}

interface DictionaryEntry {
  partOfSpeech: string;
  phonetic?: string;
  tags?: string[];
  definitions: {
    definition: string;
    examples?: string[];
    synonyms?: string[];
    antonyms?: string[];
  }[];
}

interface LookupResult {
  success: boolean;
  entries: DictionaryEntry[];
  lemma?: string;
  lemmaEntries: DictionaryEntry[];
  error?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

export function FlashCard({
  word,
  definition,
  example,
  context,
  language,
  onSwipeLeft,
  onSwipeRight,
  isInteractive = true,
}: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [hasLookupError, setHasLookupError] = useState(false);
  const flipProgress = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const cacheRef = useRef(new Map<string, LookupResult>());
  const lookupAction = useAction(api.dictionaryActions.lookupDefinition);

  const lookupKey = useMemo(
    () => `${language}:${word.toLowerCase()}`,
    [language, word]
  );

  useEffect(() => {
    setLookupResult(null);
    setIsLookingUp(false);
    setHasLookupError(false);
    setIsFlipped(false);
    flipProgress.value = 0;
    translateX.value = 0;
    translateY.value = 0;
    cardScale.value = 1;
  }, [lookupKey]);

  useEffect(() => {
    if (!isFlipped || lookupResult !== null || isLookingUp || !word) return;

    const cached = cacheRef.current.get(lookupKey);
    if (cached) {
      setLookupResult(cached);
      setHasLookupError(!cached.success);
      return;
    }

    const fetchDefinition = async () => {
      setIsLookingUp(true);
      setHasLookupError(false);
      try {
        const result = (await lookupAction({
          language,
          term: word,
        })) as LookupResult;
        cacheRef.current.set(lookupKey, result);
        setLookupResult(result);
        setHasLookupError(!result.success);
      } catch (_error) {
        setLookupResult({ success: false, entries: [], lemmaEntries: [] });
        setHasLookupError(true);
      } finally {
        setIsLookingUp(false);
      }
    };

    fetchDefinition();
  }, [isFlipped, lookupResult, isLookingUp, lookupKey, lookupAction, language, word]);

  const handleFlip = () => {
    if (!isInteractive) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newIsFlipped = !isFlipped;
    setIsFlipped(newIsFlipped);
    flipProgress.value = withTiming(newIsFlipped ? 1 : 0, { duration: 400 });
  };

  const triggerHaptic = (type: 'left' | 'right') => {
    Haptics.impactAsync(
      type === 'left' 
        ? Haptics.ImpactFeedbackStyle.Medium 
        : Haptics.ImpactFeedbackStyle.Heavy
    );
  };

  const panGesture = Gesture.Pan()
    .enabled(isInteractive && isFlipped)
    .onStart(() => {
      cardScale.value = withTiming(1.02, { duration: 100 });
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.3;
    })
    .onEnd((event) => {
      cardScale.value = withTiming(1, { duration: 100 });

      if (event.translationX > SWIPE_THRESHOLD && onSwipeRight) {
        runOnJS(triggerHaptic)('right');
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 200 });
        runOnJS(onSwipeRight)();
      } else if (event.translationX < -SWIPE_THRESHOLD && onSwipeLeft) {
        runOnJS(triggerHaptic)('left');
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 200 });
        runOnJS(onSwipeLeft)();
      } else {
        translateX.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(0, { duration: 200 });
      }
    });

  const frontAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${interpolate(flipProgress.value, [0, 1], [0, 180])}deg` },
    ],
    backfaceVisibility: 'hidden' as const,
  }));

  const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${interpolate(flipProgress.value, [0, 1], [180, 360])}deg` },
    ],
    backfaceVisibility: 'hidden' as const,
  }));

  const cardContainerStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-15, 0, 15],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
        { scale: cardScale.value },
      ],
    };
  });

  const leftOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  const rightOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  const languageColors: Record<string, string> = {
    de: '#d7b98a',
    fr: '#9bbbd2',
    ja: '#d2a39b',
  };

  const accentColor = languageColors[language] || languageColors.fr;
  const primaryDefinition =
    lookupResult?.entries?.[0]?.definitions?.[0]?.definition;
  const definitionText = primaryDefinition || definition?.trim();

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          cardContainerStyle,
          {
            width: '100%',
            aspectRatio: 0.7,
            maxHeight: 480,
          },
        ]}
      >
        {/* Swipe Overlays */}
        <Animated.View
          style={[
            leftOverlayStyle,
            {
              position: 'absolute',
              top: 20,
              right: 20,
              zIndex: 10,
              backgroundColor: '#ef4444',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
            },
          ]}
        >
          <Text className="text-white font-sans-bold text-lg">Again</Text>
        </Animated.View>

        <Animated.View
          style={[
            rightOverlayStyle,
            {
              position: 'absolute',
              top: 20,
              left: 20,
              zIndex: 10,
              backgroundColor: '#22c55e',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
            },
          ]}
        >
          <Text className="text-white font-sans-bold text-lg">Good</Text>
        </Animated.View>

        <Pressable
          onPress={handleFlip}
          style={{
            flex: 1,
            perspective: 1000,
          } as any}
        >
          {/* Front of card */}
          <Animated.View
            style={[
              frontAnimatedStyle,
              {
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: 24,
                backgroundColor: '#fff',
                borderWidth: 1,
                borderColor: '#e1d7c9',
                borderTopWidth: 4,
                borderTopColor: accentColor,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.1,
                shadowRadius: 24,
                elevation: 8,
              },
            ]}
          >
            <View className="flex-1 items-center justify-center p-8">
              <Text className="text-3xl font-serif-bold text-ink text-center">
                {word}
              </Text>
                {context && (
                  <Text className="mt-4 text-base text-subink font-sans-medium text-center italic">
                    &quot;{context}&quot;
                  </Text>
                )}
              <View className="absolute bottom-8 flex-row items-center gap-2">
                <Ionicons name="hand-left-outline" size={16} color="#9a8c7e" />
                <Text className="text-sm text-faint font-sans-medium">
                  Tap to reveal
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Back of card */}
          <Animated.View
            style={[
              backAnimatedStyle,
              {
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: 24,
                backgroundColor: '#faf8f5',
                borderWidth: 1,
                borderColor: '#e1d7c9',
                borderTopWidth: 4,
                borderTopColor: accentColor,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.1,
                shadowRadius: 24,
                elevation: 8,
              },
            ]}
          >
            <View className="flex-1 p-8">
              <View className="flex-1 items-center justify-center gap-6">
                {/* Word */}
                <Text className="text-2xl font-serif-bold text-ink text-center">
                  {word}
                </Text>

                {/* Divider */}
                <View className="w-16 h-0.5 bg-border" />

                {/* Definition */}
                {isLookingUp ? (
                  <View className="items-center gap-2">
                    <ActivityIndicator size="small" color="#80776e" />
                    <Text className="text-sm text-faint font-sans-medium">
                      Looking up definition...
                    </Text>
                  </View>
                ) : hasLookupError ? (
                  <Text className="text-sm text-subink italic font-sans-medium text-center">
                    Unable to load definition.
                  </Text>
                ) : definitionText ? (
                  <Text className="text-lg text-ink font-sans-medium text-center leading-relaxed">
                    {definitionText}
                  </Text>
                ) : (
                  <Text className="text-sm text-subink italic font-sans-medium text-center">
                    No definition found.
                  </Text>
                )}

                {/* Example */}
                {example && (
                  <View className="mt-2 px-4 py-3 rounded-xl bg-muted/50">
                    <Text className="text-sm text-subink font-sans-medium text-center italic">
                      &quot;{example}&quot;
                    </Text>
                  </View>
                )}
              </View>

              {/* Hint */}
              <View className="flex-row items-center justify-center gap-2">
                <Ionicons name="swap-horizontal" size={16} color="#9a8c7e" />
                <Text className="text-sm text-faint font-sans-medium">
                  Swipe to grade
                </Text>
              </View>
            </View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}
