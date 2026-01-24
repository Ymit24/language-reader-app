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
  };
  isSelected: boolean;
  isCompact?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

const getStatusConfig = (status: number) => {
  if (status === STATUS_NEW) {
    return { label: 'New', bgClass: 'bg-vUnknownBg', textClass: 'text-vUnknownLine', dotColor: '#d08b35' };
  }
  if (status >= STATUS_LEARNING_MIN && status <= STATUS_LEARNING_MAX) {
    const level = status - STATUS_LEARNING_MIN + 1;
    return {
      label: String(level),
      bgClass: 'bg-vLearningBg',
      textClass: 'text-vLearningLine',
      dotColor: '#3c7da8'
    };
  }
  if (status === STATUS_KNOWN) {
    return { label: 'Known', bgClass: 'bg-vKnownBg', textClass: 'text-vKnownLine', dotColor: '#2f7a57' };
  }
  return { label: 'Ignored', bgClass: 'bg-muted', textClass: 'text-faint', dotColor: '#80776e' };
};

export function VocabWordRow({ vocab, isSelected, isCompact = false, onPress, onLongPress }: VocabWordRowProps) {
  const statusConfig = getStatusConfig(vocab.status);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className={cn(
        "flex-row items-center py-3 px-4 border-b border-border/60 active:bg-muted/60",
        isSelected ? "bg-brandSoft/70" : "bg-panel"
      )}
    >
      <View className={cn(
        "w-5 h-5 rounded border items-center justify-center mr-3",
        isSelected ? "bg-brand border-brand" : "border-border2 bg-panel"
      )}>
        {isSelected && (
          <Ionicons name="checkmark" size={14} color="white" />
        )}
      </View>

      <View className="flex-1">
        <Text className="text-base font-sans-semibold text-ink" numberOfLines={1}>
          {vocab.display || vocab.term}
        </Text>

        {!isCompact && (
          <View className="flex-row items-center gap-2 mt-1">
            <View className={cn("px-2 py-0.5 rounded", statusConfig.bgClass)}>
              <Text className={cn("text-xs font-sans-semibold", statusConfig.textClass)}>
                {statusConfig.label}
              </Text>
            </View>

          </View>
        )}
      </View>
    </Pressable>
  );
}
