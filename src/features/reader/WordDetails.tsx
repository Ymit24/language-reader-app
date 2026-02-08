import { useAppTheme } from '@/src/theme/AppThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { useAction } from 'convex/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../../convex/_generated/api';
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

interface DictionaryEntry {
  partOfSpeech: string;
  phonetic?: string;
  tags?: string[];
  definitions: {
    definition: string;
    examples?: string[];
    synonyms?: string[];
    antonyms?: string[];
  }[];
}

interface LookupResult {
  success: boolean;
  entries: DictionaryEntry[];
  lemma?: string;
  lemmaEntries: DictionaryEntry[];
  error?: string;
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
  const cacheRef = useRef(new Map<string, LookupResult>());

  const lookupAction = useAction(api.dictionaryActions.lookupDefinition);

  const [entries, setEntries] = useState<DictionaryEntry[] | null>(null);
  const [lemma, setLemma] = useState<string | undefined>();
  const [lemmaEntries, setLemmaEntries] = useState<DictionaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLookupError, setHasLookupError] = useState(false);
  const [lookupNonce, setLookupNonce] = useState(0);

  const lookupKey = useMemo(
    () => `${language}:${normalized.toLowerCase()}`,
    [language, normalized],
  );

  useEffect(() => {
    setEntries(null);
    setLemma(undefined);
    setLemmaEntries([]);
    setIsLoading(false);
    setHasLookupError(false);
  }, [lookupKey]);

  useEffect(() => {
    if (entries !== null) return;

    const cached = cacheRef.current.get(lookupKey);
    if (cached) {
      setEntries(cached.entries);
      setLemma(cached.lemma);
      setLemmaEntries(cached.lemmaEntries);
      setHasLookupError(!cached.success);
      return;
    }

    const fetchDefinition = async () => {
      setIsLoading(true);
      setHasLookupError(false);
      try {
        const result = (await lookupAction({
          language,
          term: normalized,
        })) as LookupResult;
        cacheRef.current.set(lookupKey, result);
        if (result.success) {
          setEntries(result.entries);
          setLemma(result.lemma);
          setLemmaEntries(result.lemmaEntries);
        } else {
          setHasLookupError(true);
        }
      } catch (error) {
        setHasLookupError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDefinition();
  }, [entries, language, normalized, lookupAction, lookupKey, lookupNonce]);

  const handleRetry = () => {
    cacheRef.current.delete(lookupKey);
    setEntries(null);
    setHasLookupError(false);
    setLookupNonce((prev) => prev + 1);
  };

  const statusOptions = [
    {
      value: 0,
      label: 'New',
      desc: 'Never seen',
      icon: 'sparkles-outline',
      activeIcon: 'sparkles',
      color: colors['--vUnknownLine'],
      bg: 'bg-vUnknownBg/50', // Subtle background from theme
      activeBg: 'bg-vUnknownLine/15',
      border: 'border-vUnknownLine/30',
    },
    {
      value: 1,
      label: 'Learning',
      desc: 'Recognize',
      icon: 'book-outline',
      activeIcon: 'book',
      color: colors['--vLearningLine'],
      bg: 'bg-vLearningBg/50',
      activeBg: 'bg-vLearningLine/15',
      border: 'border-vLearningLine/30',
    },
    {
      value: 3,
      label: 'Familiar',
      desc: 'Almost known',
      icon: 'star-outline',
      activeIcon: 'star',
      color: colors['--vFamiliarLine'],
      bg: 'bg-vFamiliarBg/50',
      activeBg: 'bg-vFamiliarLine/15',
      border: 'border-vFamiliarLine/30',
    },
    {
      value: 4,
      label: 'Known',
      desc: 'Mastered',
      icon: 'checkmark-circle-outline',
      activeIcon: 'checkmark-circle',
      color: colors['--vKnownLine'], // Or customize if we want "Ink" style, but Green is standard for Known
      bg: 'bg-vKnownBg/50',
      activeBg: 'bg-vKnownLine/15',
      border: 'border-vKnownLine/30',
    },
  ];

  const containerStyle = isSidebar
    ? 'flex-1 bg-panel border-l border-border/70'
    : 'w-full min-h-[70%] max-h-[85%] bg-panel shadow-pop border-t border-border/70 overflow-auto rounded-t-3xl';

  const renderEntry = (entry: DictionaryEntry, keyPrefix: string) => (
    <View
      key={`${keyPrefix}-${JSON.stringify(entry)}`}
      className="mb-4 last:mb-0"
    >
      <View className="mb-2 flex-row flex-wrap items-center gap-2">
        <Text className="rounded bg-brandSoft px-2 py-0.5 font-sans-semibold text-xs text-brand">
          {entry.partOfSpeech}
        </Text>
        {entry.phonetic && (
          <Text className="font-mono text-xs text-faint">{entry.phonetic}</Text>
        )}
        {entry.tags?.map((tag) => (
          <Text
            key={tag}
            className="rounded bg-muted px-2 py-0.5 font-sans-medium text-xs text-faint"
          >
            {tag}
          </Text>
        ))}
      </View>
      {entry.definitions.map((def, defIndex) => (
        <View key={defIndex} className="mb-3 last:mb-0">
          <Text className="font-sans-medium text-sm leading-5 text-ink">
            {defIndex + 1}. {def.definition}
          </Text>
          {def.examples && def.examples.length > 0 && (
            <View className="ml-4 mt-1">
              {def.examples.map((example, exIndex) => (
                <Text
                  key={exIndex}
                  className="font-sans-medium text-xs italic leading-5 text-faint"
                >
                  &quot;{example}&quot;
                </Text>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderDictionaryContent = () => {
    if (isLoading) {
      return (
        <View className="items-center px-6 py-8">
          <ActivityIndicator size="small" color={colors['--faint']} />
          <Text className="mt-2 text-sm text-faint">
            Looking up definition...
          </Text>
        </View>
      );
    }

    if (hasLookupError) {
      return (
        <Pressable
          onPress={handleRetry}
          className="border-y border-border/40 bg-canvas/60 px-6 py-4 active:bg-muted/70"
        >
          <View className="mb-2 flex-row items-center opacity-50">
            <Ionicons
              name="search-outline"
              size={14}
              color={colors['--subink']}
            />
            <Text className="ml-1.5 font-sans-semibold text-[10px] uppercase tracking-widest text-subink">
              Definition
            </Text>
          </View>
          <Text className="font-sans-medium text-sm italic leading-5 text-subink">
            Unable to load definition. Tap to retry.
          </Text>
        </Pressable>
      );
    }

    if ((!entries || entries.length === 0) && lemmaEntries.length === 0) {
      return (
        <View className="border-y border-border/40 bg-canvas/60 px-6 py-4">
          <View className="mb-2 flex-row items-center opacity-50">
            <Ionicons
              name="search-outline"
              size={14}
              color={colors['--subink']}
            />
            <Text className="ml-1.5 font-sans-semibold text-[10px] uppercase tracking-widest text-subink">
              Definition
            </Text>
          </View>
          <Text className="font-sans-medium text-sm italic leading-5 text-subink">
            No definition found for this word.
          </Text>
        </View>
      );
    }

    return (
      <View className="border-y border-border/40 bg-canvas/60 px-6 py-4">
        <View className="mb-3 flex-row items-center opacity-50">
          <Ionicons
            name="search-outline"
            size={14}
            color={colors['--subink']}
          />
          <Text className="ml-1.5 font-sans-semibold text-[10px] uppercase tracking-widest text-subink">
            Definition
          </Text>
        </View>

        {entries && entries.length > 0 && renderEntry(entries[0], 'main')}

        {lemma && lemmaEntries.length > 0 && (
          <View className="mt-4 border-t border-border/30 pt-4">
            <View className="mb-3 flex-row items-center gap-2">
              <Ionicons
                name="git-branch-outline"
                size={14}
                color={colors['--brand']}
              />
              <Text className="font-sans-semibold text-xs text-brand">
                Base form: {lemma}
              </Text>
            </View>
            {lemmaEntries.map((entry, idx) =>
              renderEntry(entry, `lemma-${idx}`),
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View className={containerStyle}>
      <View className="p-6 pb-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="font-serif-bold text-3xl tracking-tight text-ink">
              {surface}
            </Text>
            {surface.toLowerCase() !== normalized.toLowerCase() && (
              <Text className="mt-0.5 font-sans-medium text-sm italic text-faint">
                {normalized}
              </Text>
            )}
            {isUpdating && (
              <View className="mt-3 flex-row items-center gap-2">
                <ActivityIndicator size="small" color={colors['--faint']} />
                <Text className="font-sans-medium text-xs text-faint">
                  Updating status…
                </Text>
              </View>
            )}
          </View>

          <Pressable
            onPress={() => {
              // TODO: open Ask modal / prompt to query LLM about this word
            }}
            className="mr-2 h-8 flex-row items-center justify-center rounded-full bg-muted px-3 active:bg-border"
            hitSlop={20}
            accessibilityLabel="Ask about word"
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={16}
              color={colors['--brand']}
            />
            <Text className="ml-2 font-sans-medium text-sm text-brand">
              Ask
            </Text>
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
        className="border-t border-border/40 bg-panel p-5 pt-4"
        style={
          !isSidebar
            ? { paddingBottom: Math.max(insets.bottom, 24) }
            : undefined
        }
      >
        <Text className="mb-3.5 pl-1 font-sans-semibold text-[10px] uppercase tracking-widest text-subink/70">
          Set Word Status
        </Text>
        <View
          className={cn(
            'flex-row flex-wrap gap-2.5',
            isSidebar ? 'flex-col' : 'flex-row',
          )}
        >
          {statusOptions.map((opt) => {
            const isActive = currentStatus === opt.value;
            // Use specialized active background or default muted
            const bgClass = isActive ? opt.activeBg : 'bg-muted/30';
            const borderClass = isActive ? opt.border : 'border-transparent';
            const textClass = isActive ? 'text-ink' : 'text-subink';

            return (
              <Pressable
                key={opt.value}
                onPress={() => onUpdateStatus(opt.value)}
                disabled={isUpdating}
                className={cn(
                  'rounded-xl border p-3 transition-all',
                  isSidebar ? 'w-full' : 'min-w-[140px] flex-1',
                  bgClass,
                  borderClass,
                  isUpdating ? 'opacity-50' : '',
                )}
              >
                <View className="flex-row items-center">
                  <View
                    className={cn(
                      'mr-3 h-8 w-8 items-center justify-center rounded-lg',
                      isActive ? 'bg-panel/80 shadow-sm' : 'bg-panel/40', // Inner icon container
                    )}
                  >
                    <Ionicons
                      name={(isActive ? opt.activeIcon : opt.icon) as any}
                      size={18}
                      color={isActive ? opt.color : colors['--faint']}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={cn(
                        'font-sans-bold text-sm leading-tight',
                        textClass,
                      )}
                      style={isActive ? { color: opt.color } : undefined}
                    >
                      {opt.label}
                    </Text>
                    <Text className="mt-0.5 font-sans-medium text-[10px] leading-tight text-faint">
                      {opt.desc}
                    </Text>
                  </View>

                  {isActive && (
                    <View
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: opt.color }}
                    />
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
