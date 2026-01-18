import React from 'react';
import { Text, Pressable, View } from 'react-native';
import { cn } from '../../lib/utils';

export type TokenStatus = 'new' | 'learning' | 'known' | 'ignored';

interface TokenProps {
  surface: string;
  isWord: boolean;
  status?: TokenStatus; // undefined if not a word or no vocab entry yet (treat as 'new' if word)
  onPress?: () => void;
  isSelected?: boolean;
}

export function Token({ surface, isWord, status, onPress, isSelected }: TokenProps) {
  if (!isWord) {
    // Render punctuation/whitespace cleanly
    return <Text className="text-xl text-ink font-serif leading-9">{surface}</Text>;
  }

  // Determine background color based on status
  const effectiveStatus = status || 'new';

  let bgClass = 'bg-transparent';
  let textClass = 'text-ink';
  
  // Refined palette for "iPad-like" elegance
  // Using softer, more deliberate colors.
  
  if (isSelected) {
     bgClass = 'bg-primary/20 rounded-md'; // Softer selection highlight
  } else {
    switch (effectiveStatus) {
      case 'new':
        // LingQ uses blue, but let's make it a nice soft azure blue
        // Text should be readable.
        bgClass = 'bg-blue-50'; // Very subtle blue background
        textClass = 'text-blue-700'; // Clear blue text
        break;
      case 'learning':
        // Soft amber
        bgClass = 'bg-amber-50';
        textClass = 'text-amber-700';
        break;
      case 'known':
      case 'ignored':
        bgClass = 'bg-transparent';
        textClass = 'text-ink';
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
