import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/AppThemeProvider';
import { cn } from '@/src/lib/utils';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  isVocabLoading: boolean;
  isLastPage: boolean;
  canGoPrev: boolean;
  hasPages: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onFinishLesson: () => void;
}

export function PaginationControls({
  currentPage,
  totalPages,
  isVocabLoading,
  isLastPage,
  canGoPrev,
  hasPages,
  onPrevPage,
  onNextPage,
  onFinishLesson,
}: PaginationControlsProps) {
  const { colors } = useAppTheme();

  return (
    <View className="flex-row items-center justify-between px-5 -mx-5 py-3">
      <Pressable
        onPress={onPrevPage}
        disabled={!canGoPrev}
        className={cn(
          'h-10 w-10 items-center justify-center rounded-full',
          !canGoPrev ? 'opacity-0' : 'active:bg-muted/70'
        )}
      >
        <Ionicons name="chevron-back" size={24} color={colors['--ink']} />
      </Pressable>

      <View className="items-center">
        <Text className="text-xs font-sans-medium text-faint tracking-[0.2em] uppercase">
          {currentPage + 1} / {totalPages || 1}
        </Text>
        {isVocabLoading && (
          <View className="flex-row items-center gap-1 mt-1">
            <ActivityIndicator size="small" color={colors['--faint']} />
          </View>
        )}
      </View>

      <Pressable
        onPress={isLastPage ? onFinishLesson : onNextPage}
        disabled={!hasPages}
        className={cn(
          'h-10 w-10 items-center justify-center rounded-full',
          !hasPages
            ? 'opacity-0'
            : isLastPage
              ? 'active:bg-successSoft'
              : 'active:bg-muted/70'
        )}
      >
        <Ionicons
          name={isLastPage ? 'checkmark' : 'chevron-forward'}
          size={24}
          color={isLastPage ? colors['--success'] : colors['--ink']}
        />
      </Pressable>
    </View>
  );
}
