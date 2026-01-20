import React from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '../../lib/utils';
import type { Id } from '@/convex/_generated/dataModel';

const STATUS_NEW = 0;
const STATUS_LEARNING_MIN = 1;
const STATUS_LEARNING_MAX = 3;
const STATUS_KNOWN = 4;

interface VocabDetailPanelProps {
  vocab: {
    _id: Id<"vocab">;
    term: string;
    display: string;
    status: number;
    meaning?: string | undefined;
    notes?: string | undefined;
    reviews?: number | undefined;
    intervalDays?: number | undefined;
    ease?: number | undefined;
    nextReviewAt?: number | undefined;
    lastReviewedAt?: number | undefined;
    createdAt: number;
  };
  onUpdateStatus: (status: number) => void;
  onUpdateMeaning: (meaning: string) => void;
  onUpdateNotes: (notes: string) => void;
  onReset: () => void;
  onDelete: () => void;
}

const statusOptions = [
  { value: STATUS_NEW, label: 'New', color: 'bg-amber-300 border-amber-500', activeColor: 'bg-amber-400 border-amber-600', textClass: 'text-amber-900' },
  { value: 1, label: '1', color: 'bg-orange-300 border-orange-500', activeColor: 'bg-orange-500 border-orange-600', textClass: 'text-orange-950' },
  { value: 2, label: '2', color: 'bg-amber-400 border-amber-600', activeColor: 'bg-amber-600 border-amber-700', textClass: 'text-amber-950' },
  { value: 3, label: '3', color: 'bg-yellow-400 border-yellow-600', activeColor: 'bg-yellow-600 border-yellow-700', textClass: 'text-yellow-950' },
  { value: STATUS_KNOWN, label: 'Known', color: 'bg-panel border-border', activeColor: 'bg-emerald-300 border-emerald-500', textClass: 'text-emerald-800' },
];

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatRelativeTime = (timestamp?: number) => {
  if (!timestamp) return 'Never';
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
};

export function VocabDetailPanel({
  vocab,
  onUpdateStatus,
  onUpdateMeaning,
  onUpdateNotes,
  onReset,
  onDelete,
}: VocabDetailPanelProps) {
  const [meaning, setMeaning] = React.useState(vocab.meaning || '');
  const [notes, setNotes] = React.useState(vocab.notes || '');
  const [savedMeaning, setSavedMeaning] = React.useState(vocab.meaning || '');
  const [savedNotes, setSavedNotes] = React.useState(vocab.notes || '');

  const handleMeaningBlur = () => {
    if (meaning !== savedMeaning) {
      onUpdateMeaning(meaning);
      setSavedMeaning(meaning);
    }
  };

  const handleNotesBlur = () => {
    if (notes !== savedNotes) {
      onUpdateNotes(notes);
      setSavedNotes(notes);
    }
  };

  const isLearning = vocab.status >= STATUS_LEARNING_MIN && vocab.status <= STATUS_LEARNING_MAX;

  return (
    <View className="h-full bg-panel border-l border-border flex-col">
      <View className="flex-1 overflow-y-auto">
        <View className="p-6">
          <View className="flex-row justify-between items-start mb-6">
            <View>
              <Text className="text-3xl font-serif font-medium text-ink tracking-tight">
                {vocab.display || vocab.term}
              </Text>
              <Text className="text-sm text-faint mt-1 font-mono">
                {vocab.term}
              </Text>
            </View>
          </View>

          <View className="mb-8">
            <Text className="text-xs font-semibold text-faint uppercase tracking-wider mb-3">
              Status
            </Text>
            <View className="flex-row gap-2 flex-wrap">
              {statusOptions.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => onUpdateStatus(opt.value)}
                  className={cn(
                    "items-center justify-center py-3 px-4 rounded-xl border",
                    vocab.status === opt.value
                      ? opt.activeColor
                      : `bg-panel ${opt.color.split(' ')[0]}`
                  )}
                  style={{ minWidth: 60 }}
                >
                  {opt.value === STATUS_KNOWN ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={vocab.status === opt.value ? "#059669" : "#8B7355"}
                    />
                  ) : (
                    <Text className={cn(
                      "text-lg font-bold",
                      vocab.status === opt.value
                        ? opt.textClass
                        : "text-faint"
                    )}>
                      {opt.label}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-xs font-semibold text-faint uppercase tracking-wider mb-3">
              Meaning
            </Text>
            <TextInput
              value={meaning}
              onChangeText={setMeaning}
              onBlur={handleMeaningBlur}
              placeholder="Add a definition..."
              placeholderTextColor="#8B7355"
              multiline
              textAlignVertical="top"
              className="min-h-[80px] p-4 bg-muted rounded-xl text-ink text-base"
            />
          </View>

          <View className="mb-6">
            <Text className="text-xs font-semibold text-faint uppercase tracking-wider mb-3">
              Notes
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              onBlur={handleNotesBlur}
              placeholder="Add notes..."
              placeholderTextColor="#8B7355"
              multiline
              textAlignVertical="top"
              className="min-h-[60px] p-4 bg-muted rounded-xl text-ink text-base"
            />
          </View>

          <View className="border-t border-border pt-6">
            <Text className="text-xs font-semibold text-faint uppercase tracking-wider mb-4">
              Statistics
            </Text>

            <View className="flex-row flex-wrap gap-4">
              <View className="bg-muted rounded-lg px-4 py-3 flex-1 min-w-[100px]">
                <Text className="text-xs text-faint mb-1">Reviews</Text>
                <Text className="text-xl font-semibold text-ink">
                  {vocab.reviews || 0}
                </Text>
              </View>

              <View className="bg-muted rounded-lg px-4 py-3 flex-1 min-w-[100px]">
                <Text className="text-xs text-faint mb-1">Interval</Text>
                <Text className="text-xl font-semibold text-ink">
                  {vocab.intervalDays || 0}d
                </Text>
              </View>

              {isLearning && vocab.ease !== undefined && (
                <View className="bg-muted rounded-lg px-4 py-3 flex-1 min-w-[100px]">
                  <Text className="text-xs text-faint mb-1">Ease</Text>
                  <Text className="text-xl font-semibold text-ink">
                    {vocab.ease.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row gap-4 mt-4">
              <View className="bg-muted rounded-lg px-4 py-3 flex-1">
                <Text className="text-xs text-faint mb-1">Added</Text>
                <Text className="text-sm text-ink">
                  {formatDate(vocab.createdAt)}
                </Text>
              </View>

              {isLearning && vocab.nextReviewAt && (
                <View className="bg-amber-200 rounded-lg px-4 py-3 flex-1">
                  <Text className="text-xs text-amber-800 mb-1">Next review</Text>
                  <Text className="text-sm text-amber-950 font-medium">
                    {formatRelativeTime(vocab.nextReviewAt)}
                  </Text>
                </View>
              )}

              {vocab.lastReviewedAt && (
                <View className="bg-muted rounded-lg px-4 py-3 flex-1">
                  <Text className="text-xs text-faint mb-1">Last reviewed</Text>
                  <Text className="text-sm text-ink">
                    {formatRelativeTime(vocab.lastReviewedAt)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      <View className="border-t border-border p-4 gap-2">
        {vocab.status === STATUS_KNOWN && (
          <Pressable
            onPress={onReset}
            className="flex-row items-center justify-center py-3 bg-muted rounded-lg active:bg-muted/70"
          >
            <Ionicons name="refresh" size={18} color="#5C4A32" />
            <Text className="ml-2 text-sm font-medium text-subink">
              Reset to New
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={onDelete}
          className="flex-row items-center justify-center py-3 bg-red-50 rounded-lg active:bg-red-100"
        >
          <Ionicons name="trash-outline" size={18} color="#dc2626" />
          <Text className="ml-2 text-sm font-medium text-red-600">
            Delete Word
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
