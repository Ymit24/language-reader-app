import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
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
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/src/theme/AppThemeProvider';

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
  const { colors } = useAppTheme();
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
    [language, word],
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
  }, [
    isFlipped,
    lookupResult,
    isLookingUp,
    lookupKey,
    lookupAction,
    language,
    word,
  ]);

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
        : Haptics.ImpactFeedbackStyle.Heavy,
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
      Extrapolation.CLAMP,
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
      Extrapolation.CLAMP,
    ),
  }));

  const rightOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const languageColors: Record<string, string> = {
    de: '#d7b98a',
    fr: '#9bbbd2',
    ja: '#d2a39b',
  };

  const languageLabels: Record<string, string> = {
    de: 'German',
    fr: 'French',
    ja: 'Japanese',
  };

  const accentColor = languageColors[language] || languageColors.fr;
  const languageLabel = languageLabels[language] || 'Language';
  const primaryDefinition =
    lookupResult?.entries?.[0]?.definitions?.[0]?.definition;
  const lemmaDefinition =
    lookupResult?.lemmaEntries?.[0]?.definitions?.[0]?.definition;
  const baseForm = lookupResult?.lemma;
  const showBaseForm = Boolean(
    baseForm && baseForm.toLowerCase() !== word.toLowerCase(),
  );
  const definitionText =
    lemmaDefinition || primaryDefinition || definition?.trim();

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          cardContainerStyle,
          {
            width: '100%',
            maxWidth: 720,
            alignSelf: 'center',
            aspectRatio: 0.68,
            maxHeight: 520,
          },
        ]}
      >
        {/* Swipe Overlays */}
        <Animated.View
          style={[
            leftOverlayStyle,
            {
              position: 'absolute',
              top: 18,
              right: 18,
              zIndex: 10,
              backgroundColor: colors['--danger'],
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 999,
            },
          ]}
        >
          <Text className="font-sans-bold text-base text-white">Again</Text>
        </Animated.View>

        <Animated.View
          style={[
            rightOverlayStyle,
            {
              position: 'absolute',
              top: 18,
              left: 18,
              zIndex: 10,
              backgroundColor: colors['--success'],
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 999,
            },
          ]}
        >
          <Text className="font-sans-bold text-base text-white">Good</Text>
        </Animated.View>

        <Pressable
          onPress={handleFlip}
          focusable={false}
          accessibilityRole="button"
          importantForAccessibility="no"
          {...({ tabIndex: -1 } as any)}
          onFocus={(event) => {
            const target = (event as any)?.target;
            if (target && typeof target.blur === 'function') {
              target.blur();
            }
          }}
          style={
            {
              flex: 1,
              perspective: 1000,
              outlineStyle: 'none',
              outlineWidth: 0,
              boxShadow: 'none',
            } as any
          }
        >
          {/* Front of card */}
          <Animated.View
            style={[
              frontAnimatedStyle,
              {
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: 28,
                backgroundColor: colors['--panel'],
                borderWidth: 1,
                borderColor: colors['--border'],
                borderTopWidth: 2,
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
              <View className="flex-row items-center justify-between">
                <View
                  style={{
                    backgroundColor: `${accentColor}22`,
                    borderColor: `${accentColor}55`,
                  }}
                  className="rounded-full border px-3 py-1"
                >
                  <Text
                    style={{ color: accentColor }}
                    className="font-sans-semibold text-xs tracking-wide"
                  >
                    {languageLabel}
                  </Text>
                </View>
                <Text className="font-sans-medium text-xs uppercase tracking-[0.25em] text-faint">
                  Front
                </Text>
              </View>

              <View className="flex-1 items-center justify-center">
                <Text className="text-center font-serif-bold text-4xl tracking-tight text-ink">
                  {word}
                </Text>
                {context && (
                  <View className="mt-6 rounded-2xl border border-border/40 bg-muted/40 px-4 py-3">
                    <Text className="text-center font-sans-medium text-sm italic leading-relaxed text-subink">
                      &quot;{context}&quot;
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center justify-center gap-2">
                <Ionicons
                  name="hand-left-outline"
                  size={16}
                  color={colors['--faint']}
                />
                <Text className="font-sans-medium text-sm text-faint">
                  Tap to reveal meaning
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
                borderRadius: 28,
                backgroundColor: colors['--panel'],
                borderWidth: 1,
                borderColor: colors['--border'],
                borderTopWidth: 2,
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
              <View className="flex-row items-center justify-between">
                <Text className="font-sans-medium text-xs uppercase tracking-[0.25em] text-faint">
                  Meaning
                </Text>
                {showBaseForm && (
                  <View
                    style={{
                      backgroundColor: `${accentColor}22`,
                      borderColor: `${accentColor}55`,
                    }}
                    className="rounded-full border px-2.5 py-1"
                  >
                    <Text
                      style={{ color: accentColor }}
                      className="font-sans-semibold text-xs"
                    >
                      Base: {baseForm}
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-1 items-center justify-center gap-6">
                <Text className="text-center font-serif-bold text-2xl text-ink">
                  {word}
                </Text>

                <View className="h-0.5 w-12 bg-border" />

                {isLookingUp ? (
                  <View className="items-center gap-2">
                    <ActivityIndicator size="small" color={colors['--faint']} />
                    <Text className="font-sans-medium text-sm text-faint">
                      Looking up definition...
                    </Text>
                  </View>
                ) : hasLookupError ? (
                  <Text className="text-center font-sans-medium text-sm italic text-subink">
                    Unable to load definition.
                  </Text>
                ) : definitionText ? (
                  <Text className="text-center font-sans-medium text-lg leading-relaxed text-ink">
                    {definitionText}
                  </Text>
                ) : (
                  <Text className="text-center font-sans-medium text-sm italic text-subink">
                    No definition found.
                  </Text>
                )}

                {example && (
                  <View className="mt-2 rounded-2xl border border-border/40 bg-muted/40 px-4 py-3">
                    <Text className="text-center font-sans-medium text-sm italic leading-relaxed text-subink">
                      &quot;{example}&quot;
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center justify-center gap-2">
                <Ionicons
                  name="swap-horizontal"
                  size={16}
                  color={colors['--faint']}
                />
                <Text className="font-sans-medium text-sm text-faint">
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
