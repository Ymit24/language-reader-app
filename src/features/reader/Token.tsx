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

function TokenComponent({ surface, isWord, status, learningLevel, isSelected, normalized, isWordSelected, measureRef }: TokenProps) {
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
        // New words: Stand out with a distinct color (e.g. orange-600 or brand-dark)
        // Avoiding background color to keep flow.
        bgClass = 'bg-transparent';
        textClass = 'text-orange-600 font-medium decoration-orange-200/50 underline decoration-2';
        break;
      case 'learning':
        // Learning: Subtle indication, maybe just a dotted underline or lighter color?
        // Let's go with a dotted underline.
        bgClass = 'bg-transparent';
        textClass = 'text-ink decoration-brand/40 underline decoration-dotted decoration-2';
        break;
      case 'familiar':
        // Familiar: Very subtle, maybe just standard text or very faint underline
        bgClass = 'bg-transparent';
        textClass = 'text-ink';
        break;
      case 'known':
        bgClass = 'bg-transparent';
        textClass = 'text-subink'; // slightly softer than main ink to let unknown words pop? or just standard ink?
        // Let's stick to standard ink or slightly reduced contrast if we want new words to pop.
        // Actually, 'text-ink' is better for readability.
        textClass = 'text-ink';
        break;
    }
  }

  // Cast ref to any since Text accepts View-compatible refs for measurement
  return (
    <Text
      ref={measureRef as React.Ref<Text>}
      suppressHighlighting={true}
      className={cn(
        "text-[22px] font-serif box-decoration-clone",
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
