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
        'flex-row items-center border-b border-border/40 px-4 py-3',
        isActive && 'bg-brandSoft/50',
        isSelected && 'bg-muted/60',
      )}
    >
      {/* Checkbox - always visible in selection mode, otherwise on hover for desktop */}
      <Pressable
        onPress={onToggleSelect}
        hitSlop={8}
        className={cn(
          'mr-3 h-6 w-6 items-center justify-center rounded border',
          isSelected ? 'border-brand bg-brand' : 'border-border bg-panel',
        )}
      >
        {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
      </Pressable>

      {/* Word info */}
      <View className="mr-3 flex-1">
        <Text className="font-serif-bold text-base text-ink" numberOfLines={1}>
          {vocab.display || vocab.term}
        </Text>
        {vocab.meaning && (
          <Text
            className="mt-0.5 font-sans-medium text-sm text-subink"
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
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors['--brand']}
          />
        </View>
      )}
    </Pressable>
  );
});
