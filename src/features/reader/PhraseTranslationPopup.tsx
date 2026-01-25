import { useAppTheme } from '@/src/theme/AppThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { useAction } from 'convex/react';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  LayoutRectangle,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../../convex/_generated/api';

interface PhraseTranslationPopupProps {
  selectedText: string;
  language: 'de' | 'fr' | 'ja';
  selectionBounds: LayoutRectangle | null;
  onDismiss: () => void;
}

type LoadingState = 'loading' | 'success' | 'error';

const POPUP_MAX_WIDTH = 360;
const POPUP_MIN_WIDTH = 240;
const POPUP_PADDING = 16;
const ARROW_SIZE = 8;

export function PhraseTranslationPopup({
  selectedText,
  language,
  selectionBounds,
  onDismiss,
}: PhraseTranslationPopupProps) {
  const { colors } = useAppTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isSmallScreen = windowWidth < 768;

  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [translation, setTranslation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const translateAction = useAction(api.translationActions.translatePhrase);

  // Animation values
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Animate in
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 150 });
  }, []);

  // Fetch translation
  useEffect(() => {
    let cancelled = false;

    const fetchTranslation = async () => {
      setLoadingState('loading');
      setError(null);

      try {
        const result = await translateAction({
          text: selectedText,
          sourceLanguage: language,
        });

        if (cancelled) return;

        if (result.success && result.translation) {
          setTranslation(result.translation);
          setLoadingState('success');
        } else {
          setError(result.error || 'Translation failed');
          setLoadingState('error');
        }
      } catch (err) {
        if (cancelled) return;
        setError('Failed to connect to translation service');
        setLoadingState('error');
      }
    };

    fetchTranslation();

    return () => {
      cancelled = true;
    };
  }, [selectedText, language, translateAction]);

  const handleRetry = () => {
    setLoadingState('loading');
    setError(null);
    setTranslation(null);

    translateAction({
      text: selectedText,
      sourceLanguage: language,
    })
      .then((result) => {
        if (result.success && result.translation) {
          setTranslation(result.translation);
          setLoadingState('success');
        } else {
          setError(result.error || 'Translation failed');
          setLoadingState('error');
        }
      })
      .catch(() => {
        setError('Failed to connect to translation service');
        setLoadingState('error');
      });
  };

  const handleDismiss = () => {
    // Animate out then dismiss
    scale.value = withTiming(0.9, { duration: 100 });
    opacity.value = withTiming(0, { duration: 100 }, () => {
      runOnJS(onDismiss)();
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Calculate popup position
  const getPopupPosition = () => {
    if (!selectionBounds || isSmallScreen) {
      return null; // Use bottom sheet for small screens
    }

    const popupWidth = Math.min(
      POPUP_MAX_WIDTH,
      Math.max(POPUP_MIN_WIDTH, windowWidth - POPUP_PADDING * 2)
    );

    // Try to center horizontally on selection
    let left = selectionBounds.x + selectionBounds.width / 2 - popupWidth / 2;

    // Ensure popup stays within screen bounds
    left = Math.max(POPUP_PADDING, Math.min(left, windowWidth - popupWidth - POPUP_PADDING));

    // Estimate popup height
    const estimatedPopupHeight = 160;

    // Try to position above the selection
    const spaceAbove = selectionBounds.y - insets.top;
    const spaceBelow = windowHeight - selectionBounds.y - selectionBounds.height - insets.bottom;

    let top: number;
    let showArrowBelow = true;

    if (spaceAbove >= estimatedPopupHeight + ARROW_SIZE + POPUP_PADDING) {
      // Position above
      top = selectionBounds.y - estimatedPopupHeight - ARROW_SIZE;
      showArrowBelow = true;
    } else if (spaceBelow >= estimatedPopupHeight + ARROW_SIZE + POPUP_PADDING) {
      // Position below
      top = selectionBounds.y + selectionBounds.height + ARROW_SIZE;
      showArrowBelow = false;
    } else {
      // Center vertically
      top = Math.max(
        insets.top + POPUP_PADDING,
        Math.min(
          selectionBounds.y + selectionBounds.height / 2 - estimatedPopupHeight / 2,
          windowHeight - estimatedPopupHeight - insets.bottom - POPUP_PADDING
        )
      );
      showArrowBelow = false;
    }

    // Calculate arrow position
    const arrowLeft = Math.max(
      16,
      Math.min(
        selectionBounds.x + selectionBounds.width / 2 - left - ARROW_SIZE,
        popupWidth - ARROW_SIZE * 2 - 16
      )
    );

    return {
      left,
      top,
      width: popupWidth,
      showArrowBelow,
      arrowLeft,
    };
  };

  const popupPosition = getPopupPosition();

  // Truncate selected text for display
  const displayText =
    selectedText.length > 100 ? selectedText.substring(0, 100) + '...' : selectedText;

  // Render content
  const renderContent = () => (
    <>
      {/* Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 pr-3">
          <Text className="text-xs font-sans-semibold uppercase tracking-widest text-faint mb-2">
            Selected Text
          </Text>
          <Text className="text-base font-serif text-ink leading-relaxed" numberOfLines={3}>
            {displayText}
          </Text>
        </View>
        <Pressable
          onPress={handleDismiss}
          className="h-8 w-8 items-center justify-center rounded-full bg-muted active:bg-border"
          hitSlop={12}
        >
          <Ionicons name="close" size={18} color={colors['--subink']} />
        </Pressable>
      </View>

      {/* Divider */}
      <View className="h-px bg-border/60 my-3" />

      {/* Translation */}
      <View className="min-h-[48px]">
        <Text className="text-xs font-sans-semibold uppercase tracking-widest text-faint mb-2">
          Translation
        </Text>

        {loadingState === 'loading' && (
          <View className="flex-row items-center gap-2 py-2">
            <ActivityIndicator size="small" color={colors['--faint']} />
            <Text className="text-sm text-faint font-sans-medium">Translating...</Text>
          </View>
        )}

        {loadingState === 'success' && translation && (
          <Text className="text-base font-sans-medium text-ink leading-relaxed">
            {translation}
          </Text>
        )}

        {loadingState === 'error' && (
          <Pressable onPress={handleRetry} className="py-2 active:opacity-70">
            <Text className="text-sm text-danger font-sans-medium mb-1">
              {error || 'Translation failed'}
            </Text>
            <Text className="text-xs text-brand font-sans-semibold">Tap to retry</Text>
          </Pressable>
        )}
      </View>
    </>
  );

  // Small screen: Bottom sheet style
  if (isSmallScreen) {
    return (
      <View className="absolute inset-0" pointerEvents="box-none">
        {/* Backdrop */}
        <Pressable className="absolute inset-0" onPress={handleDismiss}>
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(100)}
            style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
          />
        </Pressable>

        {/* Bottom sheet */}
        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(300)}
          exiting={SlideOutDown.duration(150)}
          className="absolute bottom-0 left-0 right-0 bg-panel rounded-t-3xl border-t border-border/70 shadow-pop"
          style={{ paddingBottom: insets.bottom + 16, backgroundColor: colors['--panel'] }}
        >
          <View className="p-5">{renderContent()}</View>
        </Animated.View>
      </View>
    );
  }

  // Large screen: Floating popup
  if (!popupPosition) {
    return null;
  }

  return (
    <View className="absolute inset-0" pointerEvents="box-none">
      {/* Backdrop - tap to dismiss */}
      <Pressable className="absolute inset-0" onPress={handleDismiss}>
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.15)' }}
        />
      </Pressable>

      {/* Floating popup */}
      <Animated.View
        style={[
          animatedStyle,
          {
            position: 'absolute',
            left: popupPosition.left,
            top: popupPosition.top,
            width: popupPosition.width,
            backgroundColor: colors['--panel'],
          },
        ]}
        className="bg-panel rounded-2xl border border-border/70 shadow-pop"
        pointerEvents="auto"
      >
        {/* Arrow pointing to selection */}
        {popupPosition.showArrowBelow && (
          <View
            style={{
              position: 'absolute',
              bottom: -ARROW_SIZE,
              left: popupPosition.arrowLeft,
              width: 0,
              height: 0,
              borderLeftWidth: ARROW_SIZE,
              borderRightWidth: ARROW_SIZE,
              borderTopWidth: ARROW_SIZE,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: colors['--panel'],
            }}
          />
        )}

        <View className="p-4">{renderContent()}</View>
      </Animated.View>
    </View>
  );
}
