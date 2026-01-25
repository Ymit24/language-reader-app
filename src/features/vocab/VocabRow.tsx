import React, { memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Id } from '../../../convex/_generated/dataModel';
import { StatusBadge, VocabStatus } from './StatusBadge';
import { cn } from '../../lib/utils';
import { useAppTheme } from '@/src/theme/AppThemeProvider';

export interface VocabItem {
  _id: Id<'vocab'>;
  term: string;
  display: string;
  status: number;
  meaning?: string;
}

interface VocabRowProps {
  vocab: VocabItem;
  isSelected: boolean;
  isActive: boolean;
  onToggleSelect: () => void;
  onPress: () => void;
  selectionMode: boolean;
}

export const VocabRow = memo(function VocabRow({
  vocab,
  isSelected,
  isActive,
  onToggleSelect,
  onPress,
  selectionMode,
}: VocabRowProps) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      onLongPress={selectionMode ? undefined : onToggleSelect}
      className={cn(
        'flex-row items-center px-4 py-3 border-b border-border/40',
        isActive && 'bg-brandSoft/50',
        isSelected && 'bg-muted/60'
      )}
    >
      {/* Checkbox - always visible in selection mode, otherwise on hover for desktop */}
      <Pressable
        onPress={onToggleSelect}
        hitSlop={8}
        className={cn(
          'mr-3 h-6 w-6 items-center justify-center rounded border',
          isSelected
            ? 'bg-brand border-brand'
            : 'border-border bg-panel'
        )}
      >
        {isSelected && (
          <Ionicons name="checkmark" size={16} color="#fff" />
        )}
      </Pressable>

      {/* Word info */}
      <View className="flex-1 mr-3">
        <Text
          className="text-base font-serif-bold text-ink"
          numberOfLines={1}
        >
          {vocab.display || vocab.term}
        </Text>
        {vocab.meaning && (
          <Text
            className="text-sm text-subink font-sans-medium mt-0.5"
            numberOfLines={1}
          >
            {vocab.meaning}
          </Text>
        )}
      </View>

      {/* Status badge */}
      <StatusBadge status={vocab.status as VocabStatus} />

      {/* Active indicator */}
      {isActive && (
        <View className="ml-3">
          <Ionicons name="chevron-forward" size={16} color={colors['--brand']} />
        </View>
      )}
    </Pressable>
  );
});
