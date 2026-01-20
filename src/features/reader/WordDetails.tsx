import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAction } from 'convex/react';
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
}: WordDetailsProps) {
  const isSidebar = mode === 'sidebar';

  const lookupAction = useAction(api.dictionaryActions.lookupDefinition);

  const [entries, setEntries] = useState<DictionaryEntry[] | null>(null);
  const [lemma, setLemma] = useState<string | undefined>();
  const [lemmaEntries, setLemmaEntries] = useState<DictionaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLookupError, setHasLookupError] = useState(false);

  useEffect(() => {
    setEntries(null);
    setLemma(undefined);
    setLemmaEntries([]);
    setIsLoading(false);
    setHasLookupError(false);
  }, [normalized]);

  useEffect(() => {
    if (entries !== null) return;

    const fetchDefinition = async () => {
      setIsLoading(true);
      setHasLookupError(false);
      try {
        console.log('Looking up:', language, normalized);
        const result = await lookupAction({ language, term: normalized }) as LookupResult;
        console.log('Lookup result:', JSON.stringify(result));
        if (result.success) {
          setEntries(result.entries);
          setLemma(result.lemma);
          setLemmaEntries(result.lemmaEntries);
        } else {
          setHasLookupError(true);
        }
      } catch (error) {
        console.error('Dictionary lookup error:', error);
        setHasLookupError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDefinition();
  }, [entries, language, normalized, lookupAction]);

  const statusOptions = [
    {
      value: 0,
      label: 'New',
      desc: 'Never seen',
      icon: 'sparkles-outline',
      activeIcon: 'sparkles',
      color: '#d97706',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    {
      value: 1,
      label: 'Learning',
      desc: 'Recognize',
      icon: 'book-outline',
      activeIcon: 'book',
      color: '#2563eb',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    {
      value: 3,
      label: 'Familiar',
      desc: 'Almost known',
      icon: 'star-outline',
      activeIcon: 'star',
      color: '#4f46e5',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
    },
    {
      value: 4,
      label: 'Known',
      desc: 'Mastered',
      icon: 'checkmark-circle-outline',
      activeIcon: 'checkmark-circle',
      color: '#047857',
      bg: 'bg-successSoft',
      border: 'border-success/20',
    },
  ];

  const containerStyle = isSidebar
    ? "flex-1 bg-white border-l border-border/50"
    : "absolute bottom-0 left-0 right-0 bg-white shadow-pop border-t border-border/50 overflow-hidden rounded-t-3xl";

  const renderEntry = (entry: DictionaryEntry, keyPrefix: string) => (
    <View key={`${keyPrefix}-${JSON.stringify(entry)}`} className="mb-4 last:mb-0">
      <View className="flex-row items-center flex-wrap gap-2 mb-2">
        <Text className="text-xs font-bold text-brand bg-brand/10 px-2 py-0.5 rounded">
          {entry.partOfSpeech}
        </Text>
        {entry.phonetic && (
          <Text className="text-xs text-faint font-mono">
            {entry.phonetic}
          </Text>
        )}
        {entry.tags?.map((tag) => (
          <Text key={tag} className="text-xs text-faint bg-gray-100 px-2 py-0.5 rounded">
            {tag}
          </Text>
        ))}
      </View>
      {entry.definitions.map((def, defIndex) => (
        <View key={defIndex} className="mb-3 last:mb-0">
          <Text className="text-sm text-ink leading-5">
            {defIndex + 1}. {def.definition}
          </Text>
          {def.examples && def.examples.length > 0 && (
            <View className="mt-1 ml-4">
              {def.examples.map((example, exIndex) => (
                <Text key={exIndex} className="text-xs text-faint italic leading-5">
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
        <View className="px-6 py-8 items-center">
          <ActivityIndicator size="small" color="#6b7280" />
          <Text className="text-sm text-faint mt-2">Looking up definition...</Text>
        </View>
      );
    }

    if (hasLookupError) {
      return (
        <View className="px-6 py-4 bg-canvas/50 border-y border-border/30">
          <View className="flex-row items-center mb-2 opacity-50">
            <Ionicons name="search-outline" size={14} color="#4b5563" />
            <Text className="text-[10px] font-bold uppercase tracking-widest text-subink ml-1.5">
              Definition
            </Text>
          </View>
          <Text className="text-sm text-subink leading-5 italic">
            Unable to load definition. Tap to retry.
          </Text>
        </View>
      );
    }

    if ((!entries || entries.length === 0) && lemmaEntries.length === 0) {
      return (
        <View className="px-6 py-4 bg-canvas/50 border-y border-border/30">
          <View className="flex-row items-center mb-2 opacity-50">
            <Ionicons name="search-outline" size={14} color="#4b5563" />
            <Text className="text-[10px] font-bold uppercase tracking-widest text-subink ml-1.5">
              Definition
            </Text>
          </View>
          <Text className="text-sm text-subink leading-5 italic">
            No definition found for this word.
          </Text>
        </View>
      );
    }

    return (
      <View className="px-6 py-4 bg-canvas/50 border-y border-border/30">
        <View className="flex-row items-center mb-3 opacity-50">
          <Ionicons name="search-outline" size={14} color="#4b5563" />
          <Text className="text-[10px] font-bold uppercase tracking-widest text-subink ml-1.5">
            Definition
          </Text>
        </View>

        {entries && entries.length > 0 && renderEntry(entries[0], 'main')}

        {lemma && lemmaEntries.length > 0 && (
          <View className="mt-4 pt-4 border-t border-border/30">
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons name="git-branch-outline" size={14} color="#2563eb" />
              <Text className="text-xs font-bold text-blue-600">
                Base form: {lemma}
              </Text>
            </View>
            {lemmaEntries.map((entry, idx) => renderEntry(entry, `lemma-${idx}`))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View className={containerStyle}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: isSidebar ? 40 : 0 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="p-6 pb-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-4">
              <Text className="text-3xl font-bold text-ink tracking-tight">
                {surface}
              </Text>
              {surface.toLowerCase() !== normalized.toLowerCase() && (
                <Text className="text-sm text-faint mt-0.5 font-medium italic">
                  {normalized}
                </Text>
              )}
            </View>
            <Pressable
              onPress={onClose}
              className="h-8 w-8 items-center justify-center rounded-full bg-muted active:bg-border"
              hitSlop={20}
            >
              <Ionicons name="close" size={18} color="#4b5563" />
            </Pressable>
          </View>
        </View>

        {renderDictionaryContent()}

        <View className="p-6">
          <Text className="text-[10px] font-bold uppercase tracking-widest text-faint mb-4">
            Set Word Status
          </Text>
          <View className={cn(
            "flex-row flex-wrap gap-3",
            isSidebar ? "flex-col" : "flex-row"
          )}>
            {statusOptions.map((opt) => {
              const isActive = currentStatus === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => onUpdateStatus(opt.value)}
                  className={cn(
                    'p-3 rounded-xl border',
                    isSidebar ? 'w-full' : 'flex-1 min-w-[140px]',
                    isActive
                      ? `${opt.bg} ${opt.border}`
                      : 'bg-white border-border active:bg-muted'
                  )}
                >
                  <View className="flex-row items-center">
                    <View
                      className={cn(
                        'w-8 h-8 rounded-lg items-center justify-center mr-3',
                        isActive ? 'bg-white/50' : 'bg-canvas'
                      )}
                    >
                      <Ionicons
                        name={(isActive ? opt.activeIcon : opt.icon) as any}
                        size={18}
                        color={isActive ? opt.color : '#6b7280'}
                      />
                    </View>
                    <View>
                      <Text
                        className={cn(
                          'text-sm font-bold',
                          isActive ? 'text-ink' : 'text-subink'
                        )}
                      >
                        {opt.label}
                      </Text>
                      <Text className="text-[10px] text-faint font-medium">
                        {opt.desc}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View className="mt-4 pt-4 border-t border-border/50 flex-row justify-end items-center">
            <Pressable
              onPress={onClose}
              className="bg-ink px-6 py-2 rounded-full active:opacity-90"
            >
              <Text className="text-white text-xs font-bold">Done</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
