import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from '@/src/components/SafeAreaView';
import { usePaginatedQuery, useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { VocabFilterBar } from '@/src/features/vocab/VocabFilterBar';
import { VocabList } from '@/src/features/vocab/VocabList';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/src/lib/utils';
import {
  STATUS_NEW,
  STATUS_LEARNING_1,
  STATUS_LEARNING_2,
  STATUS_LEARNING_3,
  STATUS_KNOWN,
  getStatusColor,
  type VocabStatus,
} from '@/src/lib/vocabStatus';

const PAGE_SIZE = 50;

type VocabItem = {
  _id: Id<"vocab">;
  term: string;
  display: string;
  status: number;
  meaning?: string | undefined;
  notes?: string | undefined;
  reviews?: number | undefined;
  nextReviewAt?: number | undefined;
  intervalDays?: number | undefined;
  ease?: number | undefined;
  lastReviewedAt?: number | undefined;
  createdAt: number;
};

export default function VocabPage() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [selectedLanguage, setSelectedLanguage] = useState<'de' | 'fr' | 'ja'>('de');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState('dateAdded');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const vocabCounts = useQuery(api.vocab.getVocabCounts, {
    language: selectedLanguage,
    search: debouncedSearchQuery || undefined,
  });

  const { results, status, loadMore } = usePaginatedQuery(
    api.vocab.listVocab,
    {
      language: selectedLanguage,
      search: debouncedSearchQuery || undefined,
      statusFilter: statusFilter.length > 0 ? statusFilter : undefined,
      sortBy,
      sortOrder: 'desc',
    },
    { initialNumItems: PAGE_SIZE }
  );

  const isLoading = vocabCounts === undefined || status === "LoadingFirstPage";
  const isLoadingMore = status === "LoadingMore";
  const hasMore = status === "CanLoadMore";

  const handleLoadMore = useCallback(() => {
    if (hasMore) {
      loadMore(PAGE_SIZE);
    }
  }, [hasMore, loadMore]);

  const bulkUpdateStatus = useMutation(api.vocab.bulkUpdateStatus);

  const handleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const handleDeselect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === results.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(results.map((v: VocabItem) => v._id)));
    }
  }, [selectedIds.size, results]);

  const handleBulkUpdateStatus = useCallback(async (status: VocabStatus) => {
    if (selectedIds.size === 0) return;

    const termsToUpdate = results
      .filter((v: VocabItem) => selectedIds.has(v._id) && v.status !== status)
      .map((v: VocabItem) => v.term);

    // Optimistically clear selection to close bulk bar immediately
    setSelectedIds(new Set());

    if (termsToUpdate.length === 0) {
      return;
    }

    try {
      await bulkUpdateStatus({
        language: selectedLanguage,
        terms: termsToUpdate,
        status,
      });
    } catch (error) {
      console.error('Failed to bulk update:', error);
    }
  }, [selectedIds, results, selectedLanguage, bulkUpdateStatus]);

  const handleCloseBulkActions = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const counts = vocabCounts || { new: 0, recognized: 0, learning: 0, familiar: 0, known: 0, total: 0 };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-1 flex-row">
        <View className="flex-1 flex-col">
          <VocabFilterBar
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            counts={counts}
          />

          <View className="flex-1">
            <VocabList
              vocab={results}
              selectedIds={selectedIds}
              isLoading={isLoading}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              onSelect={handleSelect}
              onDeselect={handleDeselect}
              onSelectAll={handleSelectAll}
              isCompact={!isDesktop}
            />
          </View>

          {selectedIds.size > 0 && (
            <View className="bg-white border-t border-gray-200 px-4 py-3">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm text-gray-600">
                    {selectedIds.size} word{selectedIds.size !== 1 ? 's' : ''} selected
                  </Text>
                  <Pressable
                    onPress={handleSelectAll}
                    className="px-2 py-1 rounded active:bg-gray-100"
                  >
                    <Text className="text-xs text-gray-500 underline">
                      {selectedIds.size === results.length ? 'Deselect all' : 'Select all'}
                    </Text>
                  </Pressable>
                </View>
                <Pressable
                  onPress={handleCloseBulkActions}
                  className="p-1 rounded active:bg-gray-100"
                >
                  <Ionicons name="close" size={18} color="#6b7280" />
                </Pressable>
              </View>
              <View className="flex-row gap-2">
                {[
                  { status: STATUS_NEW as VocabStatus, label: 'New' },
                  { status: STATUS_LEARNING_1 as VocabStatus, label: 'Recognized' },
                  { status: STATUS_LEARNING_2 as VocabStatus, label: 'Learning' },
                  { status: STATUS_LEARNING_3 as VocabStatus, label: 'Familiar' },
                  { status: STATUS_KNOWN as VocabStatus, label: 'Known' },
                ].map(({ status, label }) => {
                  const color = getStatusColor(status);

                  return (
                    <Pressable
                      key={status}
                      onPress={() => handleBulkUpdateStatus(status)}
                      className={cn(
                        "flex-1 py-2 px-2 rounded-lg items-center justify-center border",
                        color === 'blue'
                          ? "bg-blue-50 border-blue-200"
                          : color === 'amber-light'
                          ? "bg-amber-50 border-amber-200"
                          : color === 'amber-medium'
                          ? "bg-amber-100 border-amber-200"
                          : color === 'amber-dark'
                          ? "bg-amber-200 border-amber-300"
                          : "bg-emerald-50 border-emerald-200"
                      )}
                    >
                      <Text className={cn(
                        "text-xs font-medium",
                        color === 'blue'
                          ? "text-blue-700"
                          : color === 'amber-light'
                          ? "text-amber-700"
                          : color === 'amber-medium'
                          ? "text-amber-800"
                          : color === 'amber-dark'
                          ? "text-amber-900"
                          : "text-emerald-700"
                      )}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
