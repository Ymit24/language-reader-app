import React, { useCallback, useRef } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { Id } from '../../../convex/_generated/dataModel';
import { VocabRow, VocabItem } from './VocabRow';
import { useAppTheme } from '@/src/theme/AppThemeProvider';

interface VocabListProps {
  data: VocabItem[];
  selectedIds: Set<Id<'vocab'>>;
  activeId: Id<'vocab'> | null;
  onToggleSelect: (id: Id<'vocab'>) => void;
  onSelectWord: (id: Id<'vocab'>) => void;
  selectionMode: boolean;
  isLoading: boolean;
  isEmpty: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  emptyMessage?: string;
}

export function VocabList({
  data,
  selectedIds,
  activeId,
  onToggleSelect,
  onSelectWord,
  selectionMode,
  isLoading,
  isEmpty,
  hasMore,
  onLoadMore,
  emptyMessage = 'No vocabulary yet',
}: VocabListProps) {
  const { colors } = useAppTheme();
  const listRef = useRef<FlatList>(null);

  const renderItem = useCallback(
    ({ item }: { item: VocabItem }) => (
      <VocabRow
        vocab={item}
        isSelected={selectedIds.has(item._id)}
        isActive={activeId === item._id}
        onToggleSelect={() => onToggleSelect(item._id)}
        onPress={() => onSelectWord(item._id)}
        selectionMode={selectionMode}
      />
    ),
    [selectedIds, activeId, onToggleSelect, onSelectWord, selectionMode]
  );

  const renderFooter = useCallback(() => {
    if (!hasMore) return null;
    return (
      <View className="py-4 items-center">
        <Pressable
          onPress={onLoadMore}
          className="bg-muted px-4 py-2 rounded-lg"
        >
          <Text className="text-sm text-subink font-sans-medium">
            Load more
          </Text>
        </Pressable>
      </View>
    );
  }, [hasMore, onLoadMore]);

  if (isLoading && data.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <ActivityIndicator size="large" color={colors['--brand']} />
        <Text className="text-sm text-subink font-sans-medium mt-3">
          Loading vocabulary...
        </Text>
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View className="flex-1 items-center justify-center py-12 px-6">
        <View className="w-16 h-16 rounded-full bg-muted items-center justify-center mb-4">
          <Text className="text-3xl">📚</Text>
        </View>
        <Text className="text-lg font-sans-semibold text-ink text-center">
          {emptyMessage}
        </Text>
        <Text className="text-sm text-subink font-sans-medium text-center mt-2">
          Start reading lessons to build your vocabulary
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item._id}
      showsVerticalScrollIndicator={false}
      ListFooterComponent={renderFooter}
      contentContainerStyle={{ flexGrow: 1 }}
    />
  );
}
