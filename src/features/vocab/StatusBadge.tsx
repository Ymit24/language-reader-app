import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '../../lib/utils';
import {
  getStatusLabel,
  getStatusTheme,
  type VocabStatus,
} from '@/src/lib/vocabStatus';

interface StatusBadgeProps {
  status: VocabStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const theme = getStatusTheme(status);

  return (
    <View
      className={cn(
        'rounded-full',
        theme.badgeBgClass,
        size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1'
      )}
    >
      <Text
        className={cn(
          'font-sans-semibold',
          theme.badgeTextClass,
          size === 'sm' ? 'text-[10px]' : 'text-xs'
        )}
      >
        {getStatusLabel(status)}
      </Text>
    </View>
  );
}

export { getStatusColor, type VocabStatus } from '@/src/lib/vocabStatus';
