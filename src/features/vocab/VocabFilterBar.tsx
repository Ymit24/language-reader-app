import React from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '../../lib/utils';
import {
  STATUS_NEW,
  STATUS_LEARNING_1,
  STATUS_LEARNING_2,
  STATUS_LEARNING_3,
  STATUS_KNOWN,
  getStatusColor,
  type VocabStatus,
} from '../../lib/vocabStatus';

interface VocabCounts {
  new: number;
  recognized: number;
  learning: number;
  familiar: number;
  known: number;
  total: number;
}

interface VocabFilterBarProps {
  selectedLanguage: 'de' | 'fr' | 'ja';
  onLanguageChange: (lang: 'de' | 'fr' | 'ja') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: number[];
  onStatusFilterChange: (statuses: number[]) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  counts: VocabCounts;
}

const LANGUAGE_OPTIONS = [
  { value: 'de' as const, label: 'German', flag: '🇩🇪' },
  { value: 'fr' as const, label: 'French', flag: '🇫🇷' },
  { value: 'ja' as const, label: 'Japanese', flag: '🇯🇵' },
];

const STATUS_FILTER_OPTIONS = [
  { value: STATUS_NEW, label: 'New', countKey: 'new' as const },
  { value: STATUS_LEARNING_1, label: 'Recognized', countKey: 'recognized' as const },
  { value: STATUS_LEARNING_2, label: 'Learning', countKey: 'learning' as const },
  { value: STATUS_LEARNING_3, label: 'Familiar', countKey: 'familiar' as const },
  { value: STATUS_KNOWN, label: 'Known', countKey: 'known' as const },
];

const SORT_OPTIONS = [
  { value: 'dateAdded', label: 'Date added' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'status', label: 'Status' },
  { value: 'nextReview', label: 'Next review' },
];

export function VocabFilterBar({
  selectedLanguage,
  onLanguageChange,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  counts,
}: VocabFilterBarProps) {
  const [showSortMenu, setShowSortMenu] = React.useState(false);

  const toggleStatus = (status: number) => {
    if (statusFilter.includes(status)) {
      onStatusFilterChange(statusFilter.filter(s => s !== status));
    } else {
      onStatusFilterChange([...statusFilter, status]);
    }
  };

  return (
    <View className="bg-panel border-b border-border" style={{ zIndex: 10, overflow: 'visible' }}>
      <View className="px-4 py-3">
        <View className="flex-row items-center gap-2 mb-3">
          <View className="flex-row bg-muted rounded-lg p-1">
            {LANGUAGE_OPTIONS.map((lang) => (
              <Pressable
                key={lang.value}
                onPress={() => onLanguageChange(lang.value)}
                className={cn(
                  "px-3 py-1.5 rounded-md",
                  selectedLanguage === lang.value ? "bg-panel shadow-sm" : "active:bg-muted"
                )}
              >
                <Text className={cn(
                  "text-sm font-medium",
                  selectedLanguage === lang.value ? "text-ink" : "text-subink"
                )}>
                  {lang.flag} {lang.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="flex-row items-center gap-2" style={{ zIndex: 20, overflow: 'visible' }}>
          <View className="flex-1 flex-row items-center bg-muted rounded-lg px-3 py-2">
            <Ionicons name="search" size={18} color="#9ca3af" />
            <TextInput
              value={searchQuery}
              onChangeText={onSearchChange}
              placeholder="Search words..."
              placeholderTextColor="#9ca3af"
              className="flex-1 ml-2 text-sm text-ink"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => onSearchChange('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#9ca3af" />
              </Pressable>
            )}
          </View>

          <View className="relative" style={{ zIndex: 30 }}>
            <Pressable
              onPress={() => setShowSortMenu(!showSortMenu)}
              className="flex-row items-center bg-muted px-3 py-2 rounded-lg active:bg-muted/70"
            >
              <Ionicons name="options" size={18} color="#6b7280" />
              <Text className="ml-2 text-sm font-medium text-subink">Sort</Text>
              <Ionicons name="chevron-down" size={14} color="#6b7280" className="ml-1" />
            </Pressable>

            {showSortMenu && (
              <View 
                className="absolute top-full right-0 mt-1 bg-panel rounded-lg shadow-lg border border-border py-1 min-w-[160px]"
                style={{ zIndex: 1000, elevation: 5 }}
              >
                {SORT_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      onSortChange(option.value);
                      setShowSortMenu(false);
                    }}
                    className={cn(
                      "px-4 py-2 active:bg-muted",
                      sortBy === option.value && "bg-muted/50"
                    )}
                  >
                    <Text className={cn(
                      "text-sm",
                      sortBy === option.value ? "font-medium text-ink" : "text-subink"
                    )}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="border-t border-border px-4 py-2"
        contentContainerStyle={{ gap: 8 }}
      >
        <Pressable
          onPress={() => onStatusFilterChange(statusFilter.length === 0 ? [] : [])}
          className={cn(
            "px-3 py-1.5 rounded-full flex-row items-center gap-1.5 border",
            statusFilter.length === 0
              ? "bg-ink border-ink"
              : "bg-panel border-border active:bg-muted"
          )}
        >
          <Text className={cn(
            "text-sm font-medium",
            statusFilter.length === 0 ? "text-white" : "text-subink"
          )}>
            All
          </Text>
          <Text className={cn(
            "text-xs",
            statusFilter.length === 0 ? "text-amber-200" : "text-faint"
          )}>
            {counts.total}
          </Text>
        </Pressable>

        {STATUS_FILTER_OPTIONS.map((option) => {
          const isActive = statusFilter.includes(option.value);
          const count = counts[option.countKey];
          const color = getStatusColor(option.value as VocabStatus);

          return (
            <Pressable
              key={option.value}
              onPress={() => toggleStatus(option.value)}
              className={cn(
                "px-3 py-1.5 rounded-full flex-row items-center gap-1.5 border",
                isActive
                  ? color === 'blue'
                    ? "bg-amber-100 border-amber-300"
                    : color === 'amber-light'
                    ? "bg-amber-100 border-amber-300"
                    : color === 'amber-medium'
                    ? "bg-amber-200 border-amber-300"
                    : color === 'amber-dark'
                    ? "bg-amber-300 border-amber-400"
                    : "bg-emerald-100 border-emerald-300"
                    : "bg-panel border-border active:bg-muted"
              )}
            >
              <Text className={cn(
                "text-sm font-medium",
                isActive
                  ? color === 'blue'
                    ? "text-amber-800"
                    : color === 'amber-light'
                    ? "text-amber-800"
                    : color === 'amber-medium'
                    ? "text-amber-900"
                    : color === 'amber-dark'
                    ? "text-amber-950"
                    : "text-emerald-800"
                  : "text-subink"
              )}>
                {option.label}
              </Text>
              <Text className={cn(
                "text-xs",
                isActive ? "text-subink" : "text-faint"
              )}>
                {count}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
