import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
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
    [selectedIds, activeId, onToggleSelect, onSelectWord, selectionMode],
  );

  const renderFooter = useCallback(() => {
    if (!hasMore) return null;
    return (
      <View className="items-center py-4">
        <Pressable
          onPress={onLoadMore}
          className="rounded-lg bg-muted px-4 py-2"
        >
          <Text className="font-sans-medium text-sm text-subink">
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
        <Text className="mt-3 font-sans-medium text-sm text-subink">
          Loading vocabulary...
        </Text>
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View className="flex-1 items-center justify-center px-6 py-12">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Text className="text-3xl">📚</Text>
        </View>
        <Text className="text-center font-sans-semibold text-lg text-ink">
          {emptyMessage}
        </Text>
        <Text className="mt-2 text-center font-sans-medium text-sm text-subink">
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
