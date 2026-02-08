import React from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '../../lib/utils';
import { VocabStatus } from './StatusBadge';
import { useAppTheme } from '@/src/theme/AppThemeProvider';

type SortBy = 'dateAdded' | 'alphabetical' | 'status';

interface VocabFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: VocabStatus | null;
  onStatusFilterChange: (status: VocabStatus | null) => void;
  sortBy: SortBy;
  onSortChange: (sort: SortBy) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  isSearching?: boolean;
  counts?: {
    total: number;
    new: number;
    recognized: number;
    learning: number;
    familiar: number;
    known: number;
  };
}

const STATUS_FILTERS: {
  status: VocabStatus | null;
  label: string;
  countKey: string;
}[] = [
  { status: null, label: 'All', countKey: 'total' },
  { status: 0, label: 'New', countKey: 'new' },
  // Status 1 is "recognized" in counts; this pill is intentionally labeled "Learning" (MVP choice),
  // but the count should match what the filter will show.
  { status: 1, label: 'Learning', countKey: 'recognized' },
  { status: 3, label: 'Familiar', countKey: 'familiar' },
  { status: 4, label: 'Known', countKey: 'known' },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'dateAdded', label: 'Date Added' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'status', label: 'Status' },
];

export function VocabFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  isSearching = false,
  counts,
}: VocabFilterBarProps) {
  const { colors } = useAppTheme();
  return (
    <View className="gap-3 pb-3">
      {/* Search bar */}
      <View className="flex-row items-center gap-2">
        <View className="flex-1 flex-row items-center rounded-lg border border-border/70 bg-panel px-3 py-2">
          <Ionicons name="search" size={18} color={colors['--faint']} />
          <TextInput
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder="Search words..."
            placeholderTextColor={colors['--faint']}
            className="ml-2 flex-1 font-sans-medium text-sm text-ink"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => onSearchChange('')} hitSlop={8}>
              <Ionicons
                name="close-circle"
                size={18}
                color={colors['--faint']}
              />
            </Pressable>
          )}
        </View>

        {/* Sort dropdown */}
        <Pressable
          disabled={isSearching}
          onPress={() => {
            if (isSearching) return;
            const currentIndex = SORT_OPTIONS.findIndex(
              (o) => o.value === sortBy,
            );
            const nextIndex = (currentIndex + 1) % SORT_OPTIONS.length;
            onSortChange(SORT_OPTIONS[nextIndex].value);
          }}
          className={cn(
            'flex-row items-center rounded-lg border border-border/70 bg-panel px-3 py-2',
            isSearching && 'opacity-50',
          )}
        >
          <Ionicons name="swap-vertical" size={18} color={colors['--subink']} />
          <Text className="ml-1 font-sans-medium text-sm text-subink">
            {isSearching
              ? 'Relevance'
              : SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
          </Text>
        </Pressable>

        {/* Sort order toggle */}
        <Pressable
          disabled={isSearching}
          onPress={() => {
            if (isSearching) return;
            onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
          }}
          className={cn(
            'rounded-lg border border-border/70 bg-panel p-2',
            isSearching && 'opacity-50',
          )}
        >
          <Ionicons
            name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
            size={18}
            color={colors['--subink']}
          />
        </Pressable>
      </View>

      {/* Status filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {STATUS_FILTERS.map((filter) => {
          const isActive = statusFilter === filter.status;
          const count = counts?.[filter.countKey as keyof typeof counts] ?? 0;
          return (
            <Pressable
              key={filter.label}
              onPress={() => onStatusFilterChange(filter.status)}
              className={cn(
                'flex-row items-center rounded-full border px-3 py-1.5',
                isActive
                  ? 'border-brand bg-brand'
                  : 'border-border/70 bg-panel',
              )}
            >
              <Text
                className={cn(
                  'font-sans-semibold text-sm',
                  isActive ? 'text-white' : 'text-subink',
                )}
              >
                {filter.label}
              </Text>
              <Text
                className={cn(
                  'ml-1.5 font-sans-medium text-xs',
                  isActive ? 'text-white/80' : 'text-faint',
                )}
              >
                {count}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
