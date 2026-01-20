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
        className="text-2xl text-ink font-serif leading-relaxed"
        style={{ lineHeight: 42 }}
      >
        {surface}
      </Text>
    );
  }

  const effectiveStatus = status || 'new';

  let bgClass = 'bg-transparent';
  let textClass = 'text-ink';

  if (isWordSelected && normalized) {
    bgClass = 'bg-brand/30';
    textClass = 'text-brand';
  } else if (isSelected) {
    bgClass = 'bg-brand/30';
    textClass = 'text-brand';
  } else {
    switch (effectiveStatus) {
      case 'new':
        bgClass = 'bg-blue-100/60';
        textClass = 'text-blue-900';
        break;
      case 'learning':
        if (learningLevel === 1) {
          bgClass = 'bg-orange-200/60';
          textClass = 'text-orange-900';
        } else if (learningLevel === 2) {
          bgClass = 'bg-amber-200/60';
          textClass = 'text-amber-900';
        } else {
          bgClass = 'bg-yellow-100/60';
          textClass = 'text-yellow-900';
        }
        break;
      case 'known':
        bgClass = 'bg-transparent';
        textClass = 'text-ink'; 
        break;
    }
  }

  return (
    <Text
      onPress={onPress}
      suppressHighlighting={true}
      className={cn(
        "text-2xl font-serif rounded-sm inline",
        textClass,
        bgClass
      )}
      style={{ 
        lineHeight: 42,
      }}
    >
      {surface}
    </Text>
  );
}
