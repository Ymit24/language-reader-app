import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { cn } from '../../lib/utils';
import type { VocabStatusGroup } from '@/src/lib/vocabStatus';

export type TokenStatus = VocabStatusGroup;

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

  // Selection States
  if (isWordSelected && normalized) {
    // Word details panel is open - solid highlight to indicate active selection
    bgClass = 'bg-brand/20';
    textClass = 'text-ink';
  } else if (isSelected) {
    // Transient selection / touch feedback
    bgClass = 'bg-brand/10';
    textClass = 'text-brand-light';
  } else {
    // Default Status Styles
    switch (effectiveStatus) {
      case 'new':
        // New: Blue Text. Stands out as "Unknown".
        // Using blue-400 for better dark mode visibility (vs 700).
        bgClass = 'bg-transparent';
        textClass = 'text-vUnknownLine decoration-vUnknownLine/50 underline decoration-2';
        break;
      case 'learning':
        // Learning: Orange Text + Orange Underline.
        bgClass = 'bg-transparent';
        textClass = 'text-vLearningLine decoration-vLearningLine underline decoration-2';
        break;
      case 'familiar':
        // Familiar: Yellow/Amber Text + Yellow/Amber Underline.
        // Using yellow-400/amber-400 for readability.
        bgClass = 'bg-transparent';
        textClass = 'text-vFamiliarLine decoration-vFamiliarLine/50 underline decoration-dashed decoration-2';
        break;
      case 'known':
        // Known: Plain.
        bgClass = 'bg-transparent';
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
