import React, { useState, useEffect } from 'react';
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
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import {
  STATUS_OPTIONS,
  getStatusColor,
  getStatusGroup,
  getStatusTheme,
  type VocabStatus,
} from '@/src/lib/vocabStatus';
import { cn } from '../../lib/utils';
import { useAppTheme } from '@/src/theme/AppThemeProvider';
import { DictionaryEntries } from '@/src/features/dictionary/DictionaryEntries';
import { useDictionaryLookup } from '@/src/features/dictionary/useDictionaryLookup';

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
  const updateVocabStatus = useMutation(api.vocab.updateVocabStatus);
  const updateVocabMeta = useMutation(api.vocab.updateVocabMeta);
  const deleteVocab = useMutation(api.vocab.deleteVocab);
  const {
    entries,
    lemma,
    lemmaEntries,
    isLoading: isLookingUp,
    hasError: hasLookupError,
    hasResults,
  } = useDictionaryLookup({ language, term, enabled: Boolean(term) });

  // Reset fields when vocab changes
  useEffect(() => {
    setMeaning(initialMeaning || '');
    setNotes(initialNotes || '');
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
      ]
    );
  };

  if (!vocabId) {
    return (
      <View className="flex-1 items-center justify-center bg-panel border-l border-border/70 px-6">
        <View className="w-16 h-16 rounded-full bg-muted items-center justify-center mb-4">
          <Ionicons name="book-outline" size={28} color={colors['--faint']} />
        </View>
        <Text className="text-base font-sans-semibold text-subink text-center">
          Select a word to view details
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-panel border-l border-border/70">
      {/* Header */}
      <View className="p-6 pb-4 border-b border-border/50">
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-4">
            <Text className="text-3xl font-serif-bold text-ink tracking-tight">
              {display || term}
            </Text>
            {display && display.toLowerCase() !== term.toLowerCase() && (
              <Text className="text-sm text-faint mt-0.5 font-sans-medium italic">
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
        <View className="px-6 py-4 bg-canvas/60 border-b border-border/40">
          <View className="flex-row items-center mb-3 opacity-50">
            <Ionicons name="search-outline" size={14} color={colors['--subink']} />
            <Text className="text-[10px] font-sans-semibold uppercase tracking-widest text-subink ml-1.5">
              Definition
            </Text>
          </View>

          {isLookingUp ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color={colors['--faint']} />
              <Text className="text-sm text-faint mt-2">Looking up definition...</Text>
            </View>
          ) : hasLookupError ? (
            <Text className="text-sm text-subink leading-5 italic font-sans-medium">
              Unable to load definition.
            </Text>
          ) : hasResults ? (
            <DictionaryEntries
              entries={entries}
              lemma={lemma}
              lemmaEntries={lemmaEntries}
              maxEntries={2}
              maxLemmaEntries={2}
              maxDefinitions={2}
            />
          ) : (
            <Text className="text-sm text-subink leading-5 italic font-sans-medium">
              No definition found for this word.
            </Text>
          )}
        </View>

        {/* Meaning field */}
        <View className="px-6 py-4 border-b border-border/40">
          <Text className="text-[10px] font-sans-semibold uppercase tracking-widest text-faint mb-2">
            Your Meaning
          </Text>
          <TextInput
            value={meaning}
            onChangeText={setMeaning}
            onBlur={handleMeaningSave}
            placeholder="Add your own meaning..."
            placeholderTextColor={colors['--faint']}
            multiline
            className="text-sm text-ink font-sans-medium bg-canvas/80 border border-border/50 rounded-lg p-3 min-h-[60px]"
          />
        </View>

        {/* Notes field */}
        <View className="px-6 py-4 border-b border-border/40">
          <Text className="text-[10px] font-sans-semibold uppercase tracking-widest text-faint mb-2">
            Notes
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            onBlur={handleNotesSave}
            placeholder="Add notes, examples, mnemonics..."
            placeholderTextColor={colors['--faint']}
            multiline
            className="text-sm text-ink font-sans-medium bg-canvas/80 border border-border/50 rounded-lg p-3 min-h-[80px]"
          />
        </View>

        {/* Status section */}
        <View className="px-6 py-4">
          <Text className="text-[10px] font-sans-semibold uppercase tracking-widest text-faint mb-3">
            Status
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const isActive = getStatusGroup(status) === opt.group;
              const color = getStatusColor(opt.value, colors);
              const theme = getStatusTheme(opt.value);
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => handleStatusChange(opt.value)}
                  className={cn(
                    'flex-row items-center px-3 py-2 rounded-lg border',
                    isActive
                      ? cn('border-transparent', theme.activeBgClass)
                      : 'border-border/70 bg-panel'
                  )}
                >
                  <Ionicons
                    name={(isActive ? opt.activeIcon : opt.icon) as any}
                    size={16}
                    color={isActive ? color : colors['--faint']}
                  />
                  <Text
                    className={cn(
                      'ml-2 text-sm font-sans-semibold',
                      isActive ? '' : 'text-subink'
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
      <View className="p-6 border-t border-border/50">
        <Pressable
          onPress={handleDelete}
          className="flex-row items-center justify-center py-3 rounded-lg border border-error/30 bg-error/5 active:bg-error/10"
        >
          <Ionicons name="trash-outline" size={18} color={colors['--danger']} />
          <Text className="ml-2 text-sm font-sans-semibold text-error">
            Delete Word
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
