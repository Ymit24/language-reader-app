import React from 'react';
import { Text, Pressable } from 'react-native';
import { cn } from '../../lib/utils';

export type TokenStatus = 'new' | 'learning' | 'known' | 'ignored';

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
    return <Text className="text-xl text-ink font-serif leading-9">{surface}</Text>;
  }

  const effectiveStatus = status || 'new';

  let bgClass = 'bg-transparent';
  let textClass = 'text-ink';

  if (isWordSelected && normalized) {
    bgClass = 'bg-brand/40 outline outline-2 outline-brand rounded-sm';
    textClass = 'text-brand';
  } else if (isSelected) {
    bgClass = 'bg-brand/40 outline outline-2 outline-brand rounded-sm';
    textClass = 'text-brand';
  } else {
    switch (effectiveStatus) {
      case 'new':
        bgClass = 'bg-blue-50';
        textClass = 'text-blue-700';
        break;
      case 'learning':
        if (learningLevel === 1) {
          bgClass = 'bg-orange-100';
          textClass = 'text-orange-800';
        } else if (learningLevel === 2) {
          bgClass = 'bg-amber-100';
          textClass = 'text-amber-800';
        } else {
          bgClass = 'bg-yellow-50';
          textClass = 'text-yellow-700';
        }
        break;
      case 'known':
        bgClass = 'bg-emerald-50/50';
        textClass = 'text-emerald-800';
        break;
      case 'ignored':
        bgClass = 'bg-gray-100';
        textClass = 'text-gray-500';
        break;
    }
  }

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "px-0.5 mx-[1px] rounded-sm items-center justify-center",
        bgClass
      )}
    >
      <Text className={cn("text-xl font-serif leading-9", textClass)}>
        {surface}
      </Text>
    </Pressable>
  );
}
