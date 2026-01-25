import { useAppTheme } from '@/src/theme/AppThemeProvider';
import React, { memo, useCallback, useEffect, useRef } from 'react';
import { LayoutChangeEvent, Text } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { cn } from '../../lib/utils';

export type TokenStatus = 'new' | 'learning' | 'familiar' | 'known';

interface TokenProps {
  surface: string;
  isWord: boolean;
  status?: TokenStatus;
  learningLevel?: number;
  onPress?: () => void;
  isSelected?: boolean;
  normalized?: string;
  isWordSelected?: boolean;
  // Props for phrase selection
  isInPhraseSelection?: boolean;
  tokenIndex?: number;
  onLayout?: (tokenIndex: number, event: LayoutChangeEvent) => void;
}

const AnimatedText = Animated.createAnimatedComponent(Text);

function TokenComponent({
  surface,
  isWord,
  status,
  onPress,
  isSelected,
  normalized,
  isWordSelected,
  isInPhraseSelection,
  tokenIndex,
  onLayout,
}: TokenProps) {
  const { colors } = useAppTheme();
  const selectionProgress = useSharedValue(0);
  const scaleValue = useSharedValue(1);
  const wasInSelection = useRef(false);

  // Animate selection state changes
  useEffect(() => {
    if (!isWord) return;

    if (isInPhraseSelection && !wasInSelection.current) {
      // Entering selection - animate in with a subtle pulse
      selectionProgress.value = withTiming(1, { duration: 120 });
      scaleValue.value = withSequence(
        withSpring(1.02, { damping: 15, stiffness: 400 }),
        withSpring(1, { damping: 20, stiffness: 300 })
      );
    } else if (!isInPhraseSelection && wasInSelection.current) {
      // Leaving selection - animate out
      selectionProgress.value = withTiming(0, { duration: 80 });
      scaleValue.value = withTiming(1, { duration: 80 });
    }
    wasInSelection.current = isInPhraseSelection ?? false;
  }, [isWord, isInPhraseSelection, selectionProgress, scaleValue]);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (tokenIndex !== undefined && onLayout) {
        onLayout(tokenIndex, event);
      }
    },
    [tokenIndex, onLayout]
  );

  // Calculate styling
  const effectiveStatus = status || 'new';

  // Determine base colors based on status
  let baseBgColor = 'transparent';
  let bgClass = 'bg-transparent';
  let textClass = 'text-ink';

  if (isWord) {
    if (isWordSelected && normalized) {
      bgClass = 'bg-brand/15';
      textClass = 'text-brand font-medium';
      baseBgColor = colors['--brandSoft'] || 'rgba(99, 102, 241, 0.15)';
    } else if (isSelected) {
      bgClass = 'bg-brand/25';
      textClass = 'text-brand';
      baseBgColor = colors['--brandSoft'] || 'rgba(99, 102, 241, 0.25)';
    } else {
      switch (effectiveStatus) {
        case 'new':
          bgClass = 'bg-vUnknownBg';
          textClass = 'text-accent';
          baseBgColor = colors['--vUnknownBg'];
          break;
        case 'learning':
          bgClass = 'bg-none';
          textClass = 'text-vLearningLine';
          baseBgColor = colors['--vLearningBg'];
          break;
        case 'familiar':
          bgClass = 'bg-none';
          textClass = 'text-vFamiliarLine';
          baseBgColor = colors['--vFamiliarBg'];
          break;
        case 'known':
          bgClass = 'bg-none';
          textClass = 'text-subink';
          baseBgColor = 'transparent';
          break;
      }
    }
  }

  // Selection highlight color (accent with opacity)
  const selectionBgColor = colors['--accent'] + '50';

  // Animated background style for phrase selection
  const animatedBgStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      selectionProgress.value,
      [0, 1],
      [baseBgColor || 'transparent', selectionBgColor]
    );

    return {
      backgroundColor,
      transform: [{ scale: scaleValue.value }],
    };
  });

  // Non-word tokens (whitespace, punctuation)
  if (!isWord) {
    return (
      <Text
        className="text-[22px] text-ink font-serif leading-relaxed"
        style={{ lineHeight: 38 }}
        onLayout={handleLayout}
      >
        {surface}
      </Text>
    );
  }

  const hasPhraseSelection = isInPhraseSelection !== undefined;

  return (
    <AnimatedText
      onPress={onPress}
      onLayout={handleLayout}
      suppressHighlighting={true}
      className={cn(
        'text-[22px] font-serif rounded-md inline px-1 py-0.5 box-decoration-clone',
        hasPhraseSelection ? (isInPhraseSelection ? 'text-ink' : textClass) : textClass,
        hasPhraseSelection ? undefined : bgClass
      )}
      style={[
        {
          fontSize: 22,
          lineHeight: 38,
          borderRadius: 6,
          paddingHorizontal: 4,
          paddingVertical: 2,
          overflow: 'hidden',
        },
        hasPhraseSelection ? animatedBgStyle : null,
      ]}
    >
      {surface}
    </AnimatedText>
  );
}

export const Token = memo(TokenComponent);
