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
    // Replace newlines with actual line breaks if we are doing paragraph rendering,
    // but typically we might just render text. 
    // If surface contains newline, View might handle it or we need explicit handling.
    // For now, let's just render Text.
    return <Text className="text-lg text-ink font-serif leading-8">{surface}</Text>;
  }

  // Determine background color based on status
  // Default (no status) is usually treated as "Unknown" (Blue) in LingQ
  const effectiveStatus = status || 'new';

  let bgClass = 'bg-transparent';
  let textClass = 'text-ink';

  if (isSelected) {
     bgClass = 'bg-primary/30'; // Highlight selection
  } else {
    switch (effectiveStatus) {
      case 'new':
        bgClass = 'bg-blue-100 dark:bg-blue-900/30';
        textClass = 'text-blue-900 dark:text-blue-100';
        break;
      case 'learning':
        bgClass = 'bg-yellow-100 dark:bg-yellow-900/30';
        textClass = 'text-yellow-900 dark:text-yellow-100';
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
        "rounded-sm px-0.5 mx-0.5",
        bgClass
      )}
    >
      <Text className={cn("text-lg font-serif leading-8", textClass)}>
        {surface}
      </Text>
    </Pressable>
  );
}
