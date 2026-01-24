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
  { value: STATUS_NEW, label: 'New', color: 'bg-vUnknownBg border-vUnknownLine/30', activeColor: 'bg-vUnknownBg border-vUnknownLine/60', textClass: 'text-vUnknownLine' },
  { value: 1, label: '1', color: 'bg-vLearningBg border-vLearningLine/30', activeColor: 'bg-vLearningBg border-vLearningLine/60', textClass: 'text-vLearningLine' },
  { value: 2, label: '2', color: 'bg-vLearningBg border-vLearningLine/40', activeColor: 'bg-vLearningBg border-vLearningLine/70', textClass: 'text-vLearningLine' },
  { value: 3, label: '3', color: 'bg-vLearningBg border-vLearningLine/50', activeColor: 'bg-vLearningBg border-vLearningLine/80', textClass: 'text-vLearningLine' },
  { value: STATUS_KNOWN, label: 'Known', color: 'bg-vKnownBg border-vKnownLine/30', activeColor: 'bg-vKnownBg border-vKnownLine/60', textClass: 'text-vKnownLine' },
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
    <View className="h-full bg-panel border-l border-border/70 flex-col">
      <View className="flex-1 overflow-y-auto">
        <View className="p-6">
          <View className="flex-row justify-between items-start mb-6">
            <View>
              <Text className="text-3xl font-serif-semibold text-ink tracking-tight">
                {vocab.display || vocab.term}
              </Text>
              <Text className="text-sm text-faint mt-1 font-mono">
                {vocab.term}
              </Text>
            </View>
          </View>

          <View className="mb-8">
            <Text className="text-xs font-sans-semibold text-faint uppercase tracking-widest mb-3">
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
                      color={vocab.status === opt.value ? "#2f7a57" : "#80776e"}
                    />
                  ) : (
                    <Text className={cn(
                      "text-lg font-sans-bold",
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
            <Text className="text-xs font-sans-semibold text-faint uppercase tracking-widest mb-3">
              Meaning
            </Text>
            <TextInput
              value={meaning}
              onChangeText={setMeaning}
              onBlur={handleMeaningBlur}
              placeholder="Add a definition..."
              placeholderTextColor="#80776e"
              multiline
              textAlignVertical="top"
              className="min-h-[80px] p-4 bg-muted/70 rounded-xl text-ink text-base"
            />
          </View>

          <View className="mb-6">
            <Text className="text-xs font-sans-semibold text-faint uppercase tracking-widest mb-3">
              Notes
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              onBlur={handleNotesBlur}
              placeholder="Add notes..."
              placeholderTextColor="#80776e"
              multiline
              textAlignVertical="top"
              className="min-h-[60px] p-4 bg-muted/70 rounded-xl text-ink text-base"
            />
          </View>

          <View className="border-t border-border/60 pt-6">
            <Text className="text-xs font-sans-semibold text-faint uppercase tracking-widest mb-4">
              Statistics
            </Text>

            <View className="flex-row flex-wrap gap-4">
              <View className="bg-muted/70 rounded-lg px-4 py-3 flex-1 min-w-[100px]">
                <Text className="text-xs text-faint mb-1">Reviews</Text>
                <Text className="text-xl font-sans-semibold text-ink">
                  {vocab.reviews || 0}
                </Text>
              </View>

              <View className="bg-muted/70 rounded-lg px-4 py-3 flex-1 min-w-[100px]">
                <Text className="text-xs text-faint mb-1">Interval</Text>
                <Text className="text-xl font-sans-semibold text-ink">
                  {vocab.intervalDays || 0}d
                </Text>
              </View>

              {isLearning && vocab.ease !== undefined && (
                <View className="bg-muted/70 rounded-lg px-4 py-3 flex-1 min-w-[100px]">
                  <Text className="text-xs text-faint mb-1">Ease</Text>
                  <Text className="text-xl font-sans-semibold text-ink">
                    {vocab.ease.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row gap-4 mt-4">
              <View className="bg-muted/70 rounded-lg px-4 py-3 flex-1">
                <Text className="text-xs text-faint mb-1">Added</Text>
                <Text className="text-sm text-ink font-sans-medium">
                  {formatDate(vocab.createdAt)}
                </Text>
              </View>

              {isLearning && vocab.nextReviewAt && (
                <View className="bg-vUnknownBg rounded-lg px-4 py-3 flex-1">
                  <Text className="text-xs text-accent mb-1">Next review</Text>
                  <Text className="text-sm text-accent font-sans-semibold">
                    {formatRelativeTime(vocab.nextReviewAt)}
                  </Text>
                </View>
              )}

              {vocab.lastReviewedAt && (
                <View className="bg-muted/70 rounded-lg px-4 py-3 flex-1">
                  <Text className="text-xs text-faint mb-1">Last reviewed</Text>
                  <Text className="text-sm text-ink font-sans-medium">
                    {formatRelativeTime(vocab.lastReviewedAt)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      <View className="border-t border-border/70 p-4 gap-2">
        {vocab.status === STATUS_KNOWN && (
          <Pressable
            onPress={onReset}
            className="flex-row items-center justify-center py-3 bg-muted rounded-lg active:bg-muted/80"
          >
            <Ionicons name="refresh" size={18} color="#524a43" />
            <Text className="ml-2 text-sm font-sans-semibold text-subink">
              Reset to New
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={onDelete}
          className="flex-row items-center justify-center py-3 bg-dangerSoft rounded-lg active:bg-dangerSoft/70"
        >
          <Ionicons name="trash-outline" size={18} color="#b42318" />
          <Text className="ml-2 text-sm font-sans-semibold text-danger">
            Delete Word
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
