import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { cn } from '../../lib/utils';

export type TokenStatus = 'new' | 'learning' | 'familiar' | 'known';

interface TokenProps {
  surface: string;
  isWord: boolean;
  status?: TokenStatus;
  learningLevel?: number;
  isSelected?: boolean;
  normalized?: string;
  isWordSelected?: boolean;
  /** Ref to the Text for measurement (only for word tokens) */
  measureRef?: React.Ref<View>;
}

function TokenComponent({ surface, isWord, status, learningLevel, onPress, isSelected, normalized, isWordSelected, measureRef }: TokenProps) {
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

  // Cast ref to any since Text accepts View-compatible refs for measurement
  return (
    <Text
      ref={measureRef as React.Ref<Text>}
      suppressHighlighting={true}
      className={cn(
        "text-[22px] font-serif rounded-md px-1 py-0.5 box-decoration-clone",
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
