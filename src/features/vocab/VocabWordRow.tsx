import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '../../lib/utils';

const STATUS_NEW = 0;
const STATUS_LEARNING_MIN = 1;
const STATUS_LEARNING_MAX = 3;
const STATUS_KNOWN = 4;

interface VocabWordRowProps {
  vocab: {
    _id: string;
    term: string;
    display: string;
    status: number;
    reviews?: number | undefined;
    nextReviewAt?: number | undefined;
    intervalDays?: number | undefined;
    lastReviewedAt?: number | undefined;
  };
  isSelected: boolean;
  isCompact?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

const getStatusConfig = (status: number) => {
  if (status === STATUS_NEW) {
    return { label: 'New', bgClass: 'bg-amber-300', textClass: 'text-amber-900', dotColor: '#d97706' };
  }
  if (status >= STATUS_LEARNING_MIN && status <= STATUS_LEARNING_MAX) {
    const level = status - STATUS_LEARNING_MIN + 1;
    return {
      label: String(level),
      bgClass: 'bg-orange-400',
      textClass: 'text-orange-950',
      dotColor: '#f59e0b'
    };
  }
  if (status === STATUS_KNOWN) {
    return { label: 'Known', bgClass: 'bg-emerald-300', textClass: 'text-emerald-900', dotColor: '#10b981' };
  }
  return { label: 'Ignored', bgClass: 'bg-muted', textClass: 'text-subink', dotColor: '#8B7355' };
};

const formatRelativeTime = (timestamp?: number) => {
  if (!timestamp) return 'Never';
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

const formatNextReview = (timestamp?: number) => {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = timestamp - now;
  if (diff <= 0) return 'Due now';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `In ${days}d`;
};

export function VocabWordRow({ vocab, isSelected, isCompact = false, onPress, onLongPress }: VocabWordRowProps) {
  const statusConfig = getStatusConfig(vocab.status);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className={cn(
        "flex-row items-center py-3 px-4 border-b border-border active:bg-muted",
        isSelected ? "bg-brandSoft" : "bg-panel"
      )}
    >
      <View className={cn(
        "w-5 h-5 rounded border items-center justify-center mr-3",
        isSelected ? "bg-brand border-brand" : "border-border bg-panel"
      )}>
        {isSelected && (
          <Ionicons name="checkmark" size={14} color="white" />
        )}
      </View>

      <View className="flex-1">
        <Text className="text-base font-medium text-ink" numberOfLines={1}>
          {vocab.display || vocab.term}
        </Text>

        {!isCompact && (
          <View className="flex-row items-center gap-2 mt-1">
            <View className={cn("px-2 py-0.5 rounded", statusConfig.bgClass)}>
              <Text className={cn("text-xs font-medium", statusConfig.textClass)}>
                {statusConfig.label}
              </Text>
            </View>

            {vocab.status >= STATUS_LEARNING_MIN && vocab.status <= STATUS_LEARNING_MAX && vocab.reviews !== undefined && vocab.reviews > 0 && (
              <Text className="text-xs text-faint">×{vocab.reviews}</Text>
            )}

            {vocab.status === STATUS_KNOWN && (
              <Text className="text-xs text-faint">{formatRelativeTime(vocab.lastReviewedAt)}</Text>
            )}

            {vocab.status >= STATUS_LEARNING_MIN && vocab.status <= STATUS_LEARNING_MAX && (
              <Text className={cn("text-xs", vocab.nextReviewAt && vocab.nextReviewAt <= Date.now() ? "text-amber-700 font-medium" : "text-faint")}>
                {formatNextReview(vocab.nextReviewAt)}
              </Text>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}
