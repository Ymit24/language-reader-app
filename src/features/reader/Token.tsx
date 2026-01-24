import React from 'react';
import { Text, View } from 'react-native';
import { cn } from '../../lib/utils';

export type TokenStatus = 'new' | 'learning' | 'known';

interface TokenProps {
  surface: string;
  isWord: boolean;
  status?: TokenStatus;
  learningLevel?: number;
  onPress?: () => void;
  isSelected?: boolean;
  normalized?: string;
  isWordSelected?: boolean;
}

export function Token({ surface, isWord, status, learningLevel, onPress, isSelected, normalized, isWordSelected }: TokenProps) {
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
    bgClass = 'bg-brandSoft';
    textClass = 'text-brand';
  } else if (isSelected) {
    bgClass = 'bg-brandSoft';
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
      case 'known':
        bgClass = 'bg-transparent';
        textClass = 'text-subink'; 
        break;
    }
  }

  return (
    <Text
      onPress={onPress}
      suppressHighlighting={true}
      className={cn(
        "text-[22px] font-serif rounded-sm inline",
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
