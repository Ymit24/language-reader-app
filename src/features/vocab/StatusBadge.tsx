import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '../../lib/utils';
import type { ThemeColors } from '@/src/theme/AppThemeProvider';

export type VocabStatus = 0 | 1 | 2 | 3 | 4;

interface StatusBadgeProps {
  status: VocabStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<VocabStatus, { label: string; bgClass: string; textClass: string }> = {
  0: { label: 'New', bgClass: 'bg-vUnknownBg', textClass: 'text-vUnknownLine' },
  1: { label: 'Learning', bgClass: 'bg-vLearningBg', textClass: 'text-vLearningLine' },
  2: { label: 'Learning', bgClass: 'bg-vLearningBg', textClass: 'text-vLearningLine' },
  3: { label: 'Familiar', bgClass: 'bg-brandSoft', textClass: 'text-brand' },
  4: { label: 'Known', bgClass: 'bg-successSoft', textClass: 'text-success' },
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG[0];
  
  return (
    <View
      className={cn(
        'rounded-full',
        config.bgClass,
        size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1'
      )}
    >
      <Text
        className={cn(
          'font-sans-semibold',
          config.textClass,
          size === 'sm' ? 'text-[10px]' : 'text-xs'
        )}
      >
        {config.label}
      </Text>
    </View>
  );
}

export function getStatusLabel(status: VocabStatus): string {
  return STATUS_CONFIG[status]?.label || 'Unknown';
}

export function getStatusColor(status: VocabStatus, colors: ThemeColors): string {
  const colorMap: Record<VocabStatus, string> = {
    0: colors['--vUnknownLine'],
    1: colors['--vLearningLine'],
    2: colors['--vLearningLine'],
    3: colors['--brand'],
    4: colors['--success'],
  };
  return colorMap[status] || colors['--faint'];
}
