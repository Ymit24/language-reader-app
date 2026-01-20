import React from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VocabWordRow } from './VocabWordRow';
import { cn } from '../../lib/utils';
import type { Id } from '@/convex/_generated/dataModel';

interface VocabListProps {
  vocab: {
    _id: Id<"vocab">;
    term: string;
    display: string;
    status: number;
    reviews?: number | undefined;
    nextReviewAt?: number | undefined;
    intervalDays?: number | undefined;
    lastReviewedAt?: number | undefined;
  }[];
  selectedIds: Set<string>;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onSelect: (id: string) => void;
  onDeselect: (id: string) => void;
  onSelectAll: () => void;
  isCompact?: boolean;
}

export function VocabList({
  vocab,
  selectedIds,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  onSelect,
  onDeselect,
  onSelectAll,
  isCompact = false,
}: VocabListProps) {
  const listRef = React.useRef<FlatList>(null);

  const handleSelect = (id: string) => {
    if (selectedIds.has(id)) {
      onDeselect(id);
    } else {
      onSelect(id);
    }
  };

  const renderItem = ({ item }: { item: typeof vocab[0] }) => (
    <VocabWordRow
      vocab={item}
      isSelected={selectedIds.has(item._id)}
      isCompact={isCompact}
      onPress={() => handleSelect(item._id)}
      onLongPress={() => handleSelect(item._id)}
    />
  );

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View className="py-6">
          <ActivityIndicator size="small" />
        </View>
      );
    }

    if (!hasMore && vocab.length > 0) {
      return (
        <View className="py-6 items-center">
          <Text className="text-sm text-faint">No more words</Text>
        </View>
      );
    }

    return null;
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" />
        </View>
      );
    }

    return (
        <View className="flex-1 items-center justify-center py-20 px-8">
          <View className="w-16 h-16 bg-muted rounded-full items-center justify-center mb-4">
            <Ionicons name="book-outline" size={32} color="#8B7355" />
          </View>
          <Text className="text-lg font-medium text-ink mb-2">No words found</Text>
          <Text className="text-sm text-faint text-center">
            Start reading lessons to build your vocabulary
          </Text>
        </View>
    );
  };

  return (
    <View className="flex-1">
      {vocab.length > 0 && (
          <Pressable
            onPress={onSelectAll}
            className="flex-row items-center px-4 py-2 bg-muted border-b border-border"
          >
            <View className={cn(
              "w-5 h-5 rounded border items-center justify-center mr-2",
              selectedIds.size === vocab.length
                ? "bg-brand border-brand"
                : "border-border bg-panel"
            )}>
            {selectedIds.size === vocab.length && (
              <Ionicons name="checkmark" size={14} color="white" />
            )}
          </View>
           <Text className="text-sm text-subink">
             {selectedIds.size > 0
               ? `Selected ${selectedIds.size} of ${vocab.length}`
               : `Select all (${vocab.length} words)`}
           </Text>
        </Pressable>
      )}

      <FlatList
        ref={listRef}
        data={vocab}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        onEndReached={hasMore ? onLoadMore : undefined}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={true}
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </View>
  );
}
