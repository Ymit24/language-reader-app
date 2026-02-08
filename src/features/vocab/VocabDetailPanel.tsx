import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { VocabStatus, getStatusColor } from './StatusBadge';
import { cn } from '../../lib/utils';
import { useAppTheme } from '@/src/theme/AppThemeProvider';

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

interface VocabDetailPanelProps {
  vocabId: Id<'vocab'> | null;
  term: string;
  display: string;
  status: number;
  meaning?: string;
  notes?: string;
  language: 'de' | 'fr' | 'ja';
  onClose: () => void;
  onDeleted?: () => void;
}

const STATUS_OPTIONS: { value: VocabStatus; label: string; icon: string }[] = [
  { value: 0, label: 'New', icon: 'sparkles' },
  { value: 1, label: 'Learning', icon: 'book' },
  { value: 3, label: 'Familiar', icon: 'star' },
  { value: 4, label: 'Known', icon: 'checkmark-circle' },
];

export function VocabDetailPanel({
  vocabId,
  term,
  display,
  status,
  meaning: initialMeaning,
  notes: initialNotes,
  language,
  onClose,
  onDeleted,
}: VocabDetailPanelProps) {
  const { colors } = useAppTheme();
  const [meaning, setMeaning] = useState(initialMeaning || '');
  const [notes, setNotes] = useState(initialNotes || '');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const cacheRef = useRef(new Map<string, LookupResult>());

  const updateVocabStatus = useMutation(api.vocab.updateVocabStatus);
  const updateVocabMeta = useMutation(api.vocab.updateVocabMeta);
  const deleteVocab = useMutation(api.vocab.deleteVocab);
  const lookupAction = useAction(api.dictionaryActions.lookupDefinition);

  const lookupKey = useMemo(
    () => `${language}:${term.toLowerCase()}`,
    [language, term],
  );

  // Lookup dictionary definition
  useEffect(() => {
    if (!term) return;

    const cached = cacheRef.current.get(lookupKey);
    if (cached) {
      setLookupResult(cached);
      return;
    }

    const fetchDefinition = async () => {
      setIsLookingUp(true);
      try {
        const result = (await lookupAction({ language, term })) as LookupResult;
        cacheRef.current.set(lookupKey, result);
        setLookupResult(result);
      } catch {
        setLookupResult({ success: false, entries: [], lemmaEntries: [] });
      } finally {
        setIsLookingUp(false);
      }
    };

    fetchDefinition();
  }, [lookupKey, lookupAction, language, term]);

  // Reset fields when vocab changes
  useEffect(() => {
    setMeaning(initialMeaning || '');
    setNotes(initialNotes || '');
    setLookupResult(null);
  }, [vocabId, initialMeaning, initialNotes]);

  const handleStatusChange = async (newStatus: VocabStatus) => {
    await updateVocabStatus({
      language,
      term,
      status: newStatus,
    });
  };

  const handleMeaningSave = async () => {
    if (vocabId && meaning !== initialMeaning) {
      await updateVocabMeta({ termId: vocabId, meaning });
    }
  };

  const handleNotesSave = async () => {
    if (vocabId && notes !== initialNotes) {
      await updateVocabMeta({ termId: vocabId, notes });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Word',
      `Are you sure you want to remove "${display || term}" from your vocabulary?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (vocabId) {
              await deleteVocab({ termId: vocabId });
              onDeleted?.();
            }
          },
        },
      ],
    );
  };

  if (!vocabId) {
    return (
      <View className="flex-1 items-center justify-center border-l border-border/70 bg-panel px-6">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Ionicons name="book-outline" size={28} color={colors['--faint']} />
        </View>
        <Text className="text-center font-sans-semibold text-base text-subink">
          Select a word to view details
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 border-l border-border/70 bg-panel">
      {/* Header */}
      <View className="border-b border-border/50 p-6 pb-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="font-serif-bold text-3xl tracking-tight text-ink">
              {display || term}
            </Text>
            {display && display.toLowerCase() !== term.toLowerCase() && (
              <Text className="mt-0.5 font-sans-medium text-sm italic text-faint">
                {term}
              </Text>
            )}
          </View>
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
        {/* Dictionary section */}
        <View className="border-b border-border/40 bg-canvas/60 px-6 py-4">
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

          {isLookingUp ? (
            <View className="items-center py-4">
              <ActivityIndicator size="small" color={colors['--faint']} />
              <Text className="mt-2 text-sm text-faint">
                Looking up definition...
              </Text>
            </View>
          ) : lookupResult?.success &&
            (lookupResult.entries.length > 0 ||
              lookupResult.lemmaEntries.length > 0) ? (
            <View>
              {lookupResult.entries.length > 0 &&
                lookupResult.entries.slice(0, 2).map((entry, idx) => (
                  <View key={idx} className="mb-3 last:mb-0">
                    <View className="mb-1 flex-row items-center gap-2">
                      <Text className="rounded bg-brandSoft px-2 py-0.5 font-sans-semibold text-xs text-brand">
                        {entry.partOfSpeech}
                      </Text>
                      {entry.phonetic && (
                        <Text className="font-mono text-xs text-faint">
                          {entry.phonetic}
                        </Text>
                      )}
                    </View>
                    {entry.definitions.slice(0, 2).map((def, defIdx) => (
                      <Text
                        key={defIdx}
                        className="font-sans-medium text-sm leading-5 text-ink"
                      >
                        {defIdx + 1}. {def.definition}
                      </Text>
                    ))}
                  </View>
                ))}

              {lookupResult.lemma && lookupResult.lemmaEntries.length > 0 && (
                <View className="mt-4 border-t border-border/30 pt-4">
                  <View className="mb-2 flex-row items-center gap-2">
                    <Ionicons
                      name="git-branch-outline"
                      size={14}
                      color={colors['--brand']}
                    />
                    <Text className="font-sans-semibold text-xs text-brand">
                      Base form: {lookupResult.lemma}
                    </Text>
                  </View>
                  {lookupResult.lemmaEntries.slice(0, 2).map((entry, idx) => (
                    <View key={idx} className="mb-3 last:mb-0">
                      <View className="mb-1 flex-row items-center gap-2">
                        <Text className="rounded bg-brandSoft px-2 py-0.5 font-sans-semibold text-xs text-brand">
                          {entry.partOfSpeech}
                        </Text>
                        {entry.phonetic && (
                          <Text className="font-mono text-xs text-faint">
                            {entry.phonetic}
                          </Text>
                        )}
                      </View>
                      {entry.definitions.slice(0, 2).map((def, defIdx) => (
                        <Text
                          key={defIdx}
                          className="font-sans-medium text-sm leading-5 text-ink"
                        >
                          {defIdx + 1}. {def.definition}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <Text className="font-sans-medium text-sm italic leading-5 text-subink">
              No definition found for this word.
            </Text>
          )}
        </View>

        {/* Meaning field */}
        <View className="border-b border-border/40 px-6 py-4">
          <Text className="mb-2 font-sans-semibold text-[10px] uppercase tracking-widest text-faint">
            Your Meaning
          </Text>
          <TextInput
            value={meaning}
            onChangeText={setMeaning}
            onBlur={handleMeaningSave}
            placeholder="Add your own meaning..."
            placeholderTextColor={colors['--faint']}
            multiline
            className="min-h-[60px] rounded-lg border border-border/50 bg-canvas/80 p-3 font-sans-medium text-sm text-ink"
          />
        </View>

        {/* Notes field */}
        <View className="border-b border-border/40 px-6 py-4">
          <Text className="mb-2 font-sans-semibold text-[10px] uppercase tracking-widest text-faint">
            Notes
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            onBlur={handleNotesSave}
            placeholder="Add notes, examples, mnemonics..."
            placeholderTextColor={colors['--faint']}
            multiline
            className="min-h-[80px] rounded-lg border border-border/50 bg-canvas/80 p-3 font-sans-medium text-sm text-ink"
          />
        </View>

        {/* Status section */}
        <View className="px-6 py-4">
          <Text className="mb-3 font-sans-semibold text-[10px] uppercase tracking-widest text-faint">
            Status
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const isActive = status === opt.value;
              const color = getStatusColor(opt.value, colors);
              const activeBgClass: Record<VocabStatus, string> = {
                0: 'bg-vUnknownBg',
                1: 'bg-vLearningBg',
                2: 'bg-vLearningBg',
                3: 'bg-brandSoft',
                4: 'bg-successSoft',
              };
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => handleStatusChange(opt.value)}
                  className={cn(
                    'flex-row items-center rounded-lg border px-3 py-2',
                    isActive
                      ? cn('border-transparent', activeBgClass[opt.value])
                      : 'border-border/70 bg-panel',
                  )}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={16}
                    color={isActive ? color : colors['--faint']}
                  />
                  <Text
                    className={cn(
                      'ml-2 font-sans-semibold text-sm',
                      isActive ? '' : 'text-subink',
                    )}
                    style={isActive ? { color } : undefined}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Delete button */}
      <View className="border-t border-border/50 p-6">
        <Pressable
          onPress={handleDelete}
          className="flex-row items-center justify-center rounded-lg border border-danger/40 bg-dangerSoft py-3 active:bg-danger/15"
        >
          <Ionicons name="trash-outline" size={18} color={colors['--danger']} />
          <Text className="ml-2 font-sans-semibold text-sm text-danger">
            Delete Word
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
