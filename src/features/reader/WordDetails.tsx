import { useAppTheme } from '@/src/theme/AppThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  STATUS_OPTIONS,
  getStatusColor,
  getStatusGroup,
  getStatusTheme,
} from '@/src/lib/vocabStatus';
import { DictionaryEntries } from '@/src/features/dictionary/DictionaryEntries';
import { useDictionaryLookup } from '@/src/features/dictionary/useDictionaryLookup';
import { cn } from '../../lib/utils';

interface WordDetailsProps {
  surface: string;
  normalized: string;
  language: 'de' | 'fr' | 'ja';
  currentStatus: number;
  onUpdateStatus: (status: number) => void;
  onClose: () => void;
  mode?: 'popup' | 'sidebar';
  isUpdating?: boolean;
}

export function WordDetails({
  surface,
  normalized,
  language,
  currentStatus,
  onUpdateStatus,
  onClose,
  mode = 'popup',
  isUpdating = false,
}: WordDetailsProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const isSidebar = mode === 'sidebar';
  const {
    entries,
    lemma,
    lemmaEntries,
    isLoading,
    hasError: hasLookupError,
    hasResults,
    retry,
  } = useDictionaryLookup({ language, term: normalized, enabled: Boolean(normalized) });

  const containerStyle = isSidebar
    ? "flex-1 bg-panel border-l border-border/70"
    : "w-full min-h-[70%] max-h-[85%] bg-panel shadow-pop border-t border-border/70 overflow-auto rounded-t-3xl";

  const renderDictionaryContent = () => {
    if (isLoading) {
      return (
        <View className="px-6 py-8 items-center">
          <ActivityIndicator size="small" color={colors['--faint']} />
          <Text className="text-sm text-faint mt-2">Looking up definition...</Text>
        </View>
      );
    }

    if (hasLookupError) {
      return (
        <Pressable
          onPress={retry}
          className="px-6 py-4 bg-canvas/60 border-y border-border/40 active:bg-muted/70"
        >
          <View className="flex-row items-center mb-2 opacity-50">
            <Ionicons name="search-outline" size={14} color={colors['--subink']} />
            <Text className="text-[10px] font-sans-semibold uppercase tracking-widest text-subink ml-1.5">
              Definition
            </Text>
          </View>
          <Text className="text-sm text-subink leading-5 italic font-sans-medium">
            Unable to load definition. Tap to retry.
          </Text>
        </Pressable>
      );
    }

    if (!hasResults) {
      return (
        <View className="px-6 py-4 bg-canvas/60 border-y border-border/40">
          <View className="flex-row items-center mb-2 opacity-50">
            <Ionicons name="search-outline" size={14} color={colors['--subink']} />
            <Text className="text-[10px] font-sans-semibold uppercase tracking-widest text-subink ml-1.5">
              Definition
            </Text>
          </View>
          <Text className="text-sm text-subink leading-5 italic font-sans-medium">
            No definition found for this word.
          </Text>
        </View>
      );
    }

    return (
      <View className="px-6 py-4 bg-canvas/60 border-y border-border/40">
        <View className="flex-row items-center mb-3 opacity-50">
          <Ionicons name="search-outline" size={14} color={colors['--subink']} />
          <Text className="text-[10px] font-sans-semibold uppercase tracking-widest text-subink ml-1.5">
            Definition
          </Text>
        </View>

        <DictionaryEntries
          entries={entries}
          lemma={lemma}
          lemmaEntries={lemmaEntries}
          maxEntries={1}
          showExamples
          showTags
        />
      </View>
    );
  };

  return (
    <View className={containerStyle}>
      <View className="p-6 pb-4">
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-4">
            <Text className="text-3xl font-serif-bold text-ink tracking-tight">
              {surface}
            </Text>
            {surface.toLowerCase() !== normalized.toLowerCase() && (
              <Text className="text-sm text-faint mt-0.5 font-sans-medium italic">
                {normalized}
              </Text>
            )}
            {isUpdating && (
              <View className="flex-row items-center gap-2 mt-3">
                <ActivityIndicator size="small" color={colors['--faint']} />
                <Text className="text-xs text-faint font-sans-medium">Updating status…</Text>
              </View>
            )}
          </View>

          <Pressable
            onPress={() => {
              // TODO: open Ask modal / prompt to query LLM about this word
            }}
            className="h-8 px-3 flex-row items-center justify-center rounded-full bg-muted active:bg-border mr-2"
            hitSlop={20}
            accessibilityLabel="Ask about word"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors['--brand']} />
            <Text className="text-sm text-brand font-sans-medium ml-2">Ask</Text>
          </Pressable>

          <Pressable
            onPress={onClose}
            className="h-8 w-8 items-center justify-center rounded-full bg-muted active:bg-border"
            hitSlop={20}
          >
            <Ionicons name="close" size={18} color={colors['--subink']} />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {renderDictionaryContent()}
      </ScrollView>

      <View
        className="p-5 pt-4 border-t border-border/40 bg-panel"
        style={!isSidebar ? { paddingBottom: Math.max(insets.bottom, 24) } : undefined}
      >
        <Text className="text-[10px] font-sans-semibold uppercase tracking-widest text-subink/70 mb-3.5 pl-1">
          Set Word Status
        </Text>
        <View
          className={cn(
            'flex-row flex-wrap gap-2.5',
            isSidebar ? 'flex-col' : 'flex-row'
          )}
        >
          {STATUS_OPTIONS.map((opt) => {
            const isActive = getStatusGroup(currentStatus) === opt.group;
            const theme = getStatusTheme(opt.value);
            const color = getStatusColor(opt.value, colors);
            const bgClass = isActive ? theme.activeBgClass : 'bg-muted/30';
            const borderClass = isActive ? theme.borderClass : 'border-transparent';
            const textClass = isActive ? 'text-ink' : 'text-subink';

            return (
              <Pressable
                key={opt.value}
                onPress={() => onUpdateStatus(opt.value)}
                disabled={isUpdating}
                className={cn(
                  'p-3 rounded-xl border transition-all',
                  isSidebar ? 'w-full' : 'flex-1 min-w-[140px]',
                  bgClass,
                  borderClass,
                  isUpdating ? 'opacity-50' : ''
                )}
              >
                <View className="flex-row items-center">
                  <View
                    className={cn(
                      'w-8 h-8 rounded-lg items-center justify-center mr-3',
                      isActive ? 'bg-panel/80 shadow-sm' : 'bg-panel/40' // Inner icon container
                    )}
                  >
                    <Ionicons
                      name={(isActive ? opt.activeIcon : opt.icon) as any}
                      size={18}
                      color={isActive ? color : colors['--faint']}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={cn(
                        'text-sm font-sans-bold leading-tight',
                        textClass
                      )}
                      style={isActive ? { color } : undefined}
                    >
                      {opt.label}
                    </Text>
                    <Text className="text-[10px] text-faint font-sans-medium leading-tight mt-0.5">
                      {opt.desc}
                    </Text>
                  </View>

                  {isActive && (
                    <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
