import React from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '../../lib/utils';
import { VocabStatus } from './StatusBadge';
import { useAppTheme } from '@/src/theme/AppThemeProvider';

type Language = 'de' | 'fr' | 'ja';
type SortBy = 'dateAdded' | 'alphabetical' | 'status';

interface VocabFilterBarProps {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  availableLanguages: Language[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: VocabStatus | null;
  onStatusFilterChange: (status: VocabStatus | null) => void;
  sortBy: SortBy;
  onSortChange: (sort: SortBy) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  counts?: {
    total: number;
    new: number;
    recognized: number;
    learning: number;
    familiar: number;
    known: number;
  };
}

const LANGUAGE_LABELS: Record<Language, string> = {
  fr: 'French',
  de: 'German',
  ja: 'Japanese',
};

const LANGUAGE_FLAGS: Record<Language, string> = {
  fr: '🇫🇷',
  de: '🇩🇪',
  ja: '🇯🇵',
};

const STATUS_FILTERS: { status: VocabStatus | null; label: string; countKey: string }[] = [
  { status: null, label: 'All', countKey: 'total' },
  { status: 0, label: 'New', countKey: 'new' },
  { status: 1, label: 'Learning', countKey: 'learning' },
  { status: 3, label: 'Familiar', countKey: 'familiar' },
  { status: 4, label: 'Known', countKey: 'known' },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'dateAdded', label: 'Date Added' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'status', label: 'Status' },
];

export function VocabFilterBar({
  selectedLanguage,
  onLanguageChange,
  availableLanguages,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  counts,
}: VocabFilterBarProps) {
  const { colors } = useAppTheme();
  return (
    <View className="gap-3 pb-3">
      {/* Language tabs */}
      {availableLanguages.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {availableLanguages.map((lang) => (
            <Pressable
              key={lang}
              onPress={() => onLanguageChange(lang)}
              className={cn(
                'flex-row items-center px-3 py-2 rounded-lg border',
                selectedLanguage === lang
                  ? 'bg-brandSoft border-brand/30'
                  : 'bg-panel border-border/70'
              )}
            >
              <Text className="mr-2">{LANGUAGE_FLAGS[lang]}</Text>
              <Text
                className={cn(
                  'text-sm font-sans-semibold',
                  selectedLanguage === lang ? 'text-brand' : 'text-subink'
                )}
              >
                {LANGUAGE_LABELS[lang]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Search bar */}
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center bg-panel border border-border/70 rounded-lg px-3 py-2">
          <Ionicons name="search" size={18} color={colors['--faint']} />
          <TextInput
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder="Search words..."
            placeholderTextColor={colors['--faint']}
            className="flex-1 ml-2 text-sm text-ink font-sans-medium"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => onSearchChange('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors['--faint']} />
            </Pressable>
          )}
        </View>

        {/* Sort dropdown */}
        <Pressable
          onPress={() => {
            const currentIndex = SORT_OPTIONS.findIndex((o) => o.value === sortBy);
            const nextIndex = (currentIndex + 1) % SORT_OPTIONS.length;
            onSortChange(SORT_OPTIONS[nextIndex].value);
          }}
          className="flex-row items-center bg-panel border border-border/70 rounded-lg px-3 py-2"
        >
          <Ionicons name="swap-vertical" size={18} color={colors['--subink']} />
          <Text className="ml-1 text-sm text-subink font-sans-medium">
            {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
          </Text>
        </Pressable>

        {/* Sort order toggle */}
        <Pressable
          onPress={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="bg-panel border border-border/70 rounded-lg p-2"
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
                'flex-row items-center px-3 py-1.5 rounded-full border',
                isActive
                  ? 'bg-brand border-brand'
                  : 'bg-panel border-border/70'
              )}
            >
              <Text
                className={cn(
                  'text-sm font-sans-semibold',
                  isActive ? 'text-white' : 'text-subink'
                )}
              >
                {filter.label}
              </Text>
              <Text
                className={cn(
                  'ml-1.5 text-xs font-sans-medium',
                  isActive ? 'text-white/80' : 'text-faint'
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
