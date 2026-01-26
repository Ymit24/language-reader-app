import React, { memo } from 'react';
import { LayoutChangeEvent, Text } from 'react-native';
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
  onLayout: (event: LayoutChangeEvent) => void;
  isWordSelected?: boolean;
  ref: React.Ref<Text>;
}

function TokenComponent({ surface, isWord, status, learningLevel, onPress, isSelected, normalized, onLayout, isWordSelected, ref }: TokenProps) {
  if (!isWord) {
    return (
      <Text
        className="text-[22px] text-ink font-serif leading-relaxed"
        style={{ lineHeight: 38 }}
      >
        {surface}
      </Text>
    );
  }

  const effectiveStatus = status || 'new';

  let bgClass = 'bg-transparent';
  let textClass = 'text-ink';

  if (isWordSelected && normalized) {
    // Word details panel is open - lighter highlight to maintain readability
    bgClass = 'bg-brand/15';
    textClass = 'text-brand font-medium';
  } else if (isSelected) {
    // Transient selection / touch feedback - slightly darker
    bgClass = 'bg-brand/25';
    textClass = 'text-brand';
  } else {
    switch (effectiveStatus) {
      case 'new':
        bgClass = 'bg-vUnknownBg';
        textClass = 'text-accent';
        break;
      case 'learning':
        bgClass = 'bg-vLearningBg';
        textClass = 'text-vLearningLine';
        break;
      case 'familiar':
        bgClass = 'bg-vFamiliarBg';
        textClass = 'text-vFamiliarLine';
        break;
      case 'known':
        bgClass = 'bg-transparent';
        textClass = 'text-subink';
        break;
    }
  }

  return (
    <Text
      ref={ref}
      onPress={onPress}
      suppressHighlighting={true}
      onLayout={(e) => {
        // console.log("Token layout:", surface, e.nativeEvent.layout);
        onLayout(e);
      }}
      className={cn(
        "text-[22px] font-serif rounded-md inline px-1 py-0.5 box-decoration-clone",
        textClass,
        bgClass
      )}
      style={{
        lineHeight: 38,
      }}
    >
      {surface}
    </Text>
  );
}

export const Token = memo(TokenComponent);
