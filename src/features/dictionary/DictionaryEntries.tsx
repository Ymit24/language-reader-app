import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useAppTheme } from '@/src/theme/AppThemeProvider';
import type { DictionaryEntry } from './types';

interface DictionaryEntriesProps {
  entries: DictionaryEntry[];
  lemma?: string;
  lemmaEntries?: DictionaryEntry[];
  maxEntries?: number;
  maxLemmaEntries?: number;
  maxDefinitions?: number;
  showExamples?: boolean;
  showTags?: boolean;
}

export function DictionaryEntries({
  entries,
  lemma,
  lemmaEntries = [],
  maxEntries,
  maxLemmaEntries,
  maxDefinitions,
  showExamples = false,
  showTags = false,
}: DictionaryEntriesProps) {
  const { colors } = useAppTheme();

  const renderEntry = (entry: DictionaryEntry, keyPrefix: string) => (
    <View key={`${keyPrefix}-${entry.partOfSpeech}`} className="mb-4 last:mb-0">
      <View className="flex-row items-center flex-wrap gap-2 mb-2">
        <Text className="text-xs font-sans-semibold text-brand bg-brandSoft px-2 py-0.5 rounded">
          {entry.partOfSpeech}
        </Text>
        {entry.phonetic && (
          <Text className="text-xs text-faint font-mono">
            {entry.phonetic}
          </Text>
        )}
        {showTags &&
          entry.tags?.map((tag) => (
            <Text
              key={`${keyPrefix}-${tag}`}
              className="text-xs text-faint bg-muted px-2 py-0.5 rounded font-sans-medium"
            >
              {tag}
            </Text>
          ))}
      </View>
      {entry.definitions
        .slice(0, maxDefinitions ?? entry.definitions.length)
        .map((def, defIndex) => (
          <View key={`${keyPrefix}-def-${defIndex}`} className="mb-3 last:mb-0">
            <Text className="text-sm text-ink leading-5 font-sans-medium">
              {defIndex + 1}. {def.definition}
            </Text>
            {showExamples && def.examples && def.examples.length > 0 && (
              <View className="mt-1 ml-4">
                {def.examples.map((example, exIndex) => (
                  <Text
                    key={`${keyPrefix}-ex-${exIndex}`}
                    className="text-xs text-faint italic leading-5 font-sans-medium"
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

  const visibleEntries = entries.slice(0, maxEntries ?? entries.length);
  const visibleLemmaEntries = lemmaEntries.slice(
    0,
    maxLemmaEntries ?? lemmaEntries.length
  );

  return (
    <View>
      {visibleEntries.map((entry, idx) => renderEntry(entry, `main-${idx}`))}

      {lemma && visibleLemmaEntries.length > 0 && (
        <View className="mt-4 pt-4 border-t border-border/30">
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="git-branch-outline" size={14} color={colors['--brand']} />
            <Text className="text-xs font-sans-semibold text-brand">
              Base form: {lemma}
            </Text>
          </View>
          {visibleLemmaEntries.map((entry, idx) =>
            renderEntry(entry, `lemma-${idx}`)
          )}
        </View>
      )}
    </View>
  );
}
