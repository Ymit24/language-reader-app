import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ScreenLayout } from '@/src/components/ScreenLayout';
import { BulkActionBar } from '@/src/features/vocab/BulkActionBar';
import { VocabStatus } from '@/src/features/vocab/StatusBadge';
import { VocabDetailPanel } from '@/src/features/vocab/VocabDetailPanel';
import { VocabFilterBar } from '@/src/features/vocab/VocabFilters';
import { VocabList } from '@/src/features/vocab/VocabList';
import { VocabItem } from '@/src/features/vocab/VocabRow';
import { useSelectedLanguage } from '@/src/lib/selectedLanguage';
import { useVocabFilters } from '@/src/features/vocab/hooks/useVocabFilters';
import { useVocabSelection } from '@/src/features/vocab/hooks/useVocabSelection';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Text, useWindowDimensions, View } from 'react-native';

export default function VocabScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { selectedLanguage } = useSelectedLanguage();

  // Custom hooks for filters and selection
  const filters = useVocabFilters();
  const selection = useVocabSelection();

  // Active word state
  const [activeWordId, setActiveWordId] = useState<Id<'vocab'> | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Mobile detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Convex queries
  const vocabCounts = useQuery(api.vocab.getVocabCounts, {
    language: selectedLanguage,
    search: filters.debouncedSearch || undefined,
  });

  const {
    results: vocabResults,
    status: paginationStatus,
    loadMore,
  } = usePaginatedQuery(
    api.vocab.listVocab,
    {
      language: selectedLanguage,
      search: filters.debouncedSearch || undefined,
      statusFilter: filters.statusFilter !== null ? [filters.statusFilter] : undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    },
    { initialNumItems: 50 }
  );

  const bulkUpdateStatus = useMutation(api.vocab.bulkUpdateStatusById);

  // Transform vocab results
  const vocabList: VocabItem[] = useMemo(() => {
    return vocabResults.map((v) => ({
      _id: v._id,
      term: v.term,
      display: v.display || v.term,
      status: v.status,
      meaning: v.meaning,
    }));
  }, [vocabResults]);

  // Find active word
  const activeWord = useMemo(() => {
    if (!activeWordId) return null;
    return vocabResults.find((v) => v._id === activeWordId) || null;
  }, [activeWordId, vocabResults]);

  // Handlers
  const handleToggleSelect = useCallback((id: Id<'vocab'>) => {
    selection.toggleSelect(id);
  }, [selection]);

  const handleSelectWord = useCallback(
    (id: Id<'vocab'>) => {
      setActiveWordId(id);
      if (!isDesktop) {
        setShowDetailModal(true);
      }
    },
    [isDesktop]
  );

  const handleCloseDetail = useCallback(() => {
    if (isDesktop) {
      setActiveWordId(null);
    } else {
      setShowDetailModal(false);
    }
  }, [isDesktop]);

  const handleBulkSetStatus = useCallback(
    async (status: VocabStatus) => {
      if (selection.selectionCount === 0 || isBulkUpdating) return;
      setIsBulkUpdating(true);
      try {
        await bulkUpdateStatus({
          termIds: Array.from(selection.selectedIds),
          status,
        });
        selection.clearSelection();
      } finally {
        setIsBulkUpdating(false);
      }
    },
    [selection, bulkUpdateStatus, isBulkUpdating]
  );

  const handleLoadMore = useCallback(() => {
    if (paginationStatus === 'CanLoadMore') {
      loadMore(50);
    }
  }, [paginationStatus, loadMore]);

  const handleWordDeleted = useCallback(() => {
    setActiveWordId(null);
    setShowDetailModal(false);
  }, []);

  // Reset selection when language changes
  useEffect(() => {
    selection.clearSelection();
    setActiveWordId(null);
  }, [selectedLanguage, selection.clearSelection]);

  const isLoading = paginationStatus === 'LoadingFirstPage';
  const isEmpty = !isLoading && vocabList.length === 0;
  const hasMore = paginationStatus === 'CanLoadMore';

  // Empty message based on filters
  const emptyMessage = useMemo(() => {
    if (filters.debouncedSearch) {
      return 'No words match your search';
    }
    if (filters.statusFilter !== null) {
      return 'No words with this status';
    }
    return 'Start reading to build your vocabulary';
  }, [filters.debouncedSearch, filters.statusFilter]);

  return (
    <ScreenLayout edges={['top']}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-5 pt-6 pb-3 md:px-8">
          <View className="mb-4">
            <Text className="text-2xl font-sans-semibold tracking-tight text-ink">
              Vocabulary
            </Text>
            <Text className="mt-1 text-sm text-subink font-sans-medium">
              {vocabCounts?.total ?? 0} words across all statuses
            </Text>
          </View>

          {/* Filters */}
          <VocabFilterBar
            searchQuery={filters.searchQuery}
            onSearchChange={filters.setSearchQuery}
            statusFilter={filters.statusFilter}
            onStatusFilterChange={filters.setStatusFilter}
            sortBy={filters.sortBy}
            onSortChange={filters.setSortBy}
            sortOrder={filters.sortOrder}
            onSortOrderChange={filters.setSortOrder}
            counts={vocabCounts ?? undefined}
          />
        </View>

        {/* Main content */}
        <View className="flex-1 flex-row">
          {/* List section */}
          <View className={isDesktop ? 'w-2/5 border-r border-border/50' : 'flex-1'}>
            <VocabList
              data={vocabList}
              selectedIds={selection.selectedIds}
              activeId={activeWordId}
              onToggleSelect={handleToggleSelect}
              onSelectWord={handleSelectWord}
              selectionMode={selection.hasSelection}
              isLoading={isLoading}
              isEmpty={isEmpty}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              emptyMessage={emptyMessage}
            />
          </View>

          {/* Desktop: Detail panel */}
          {isDesktop && (
            <View className="flex-1">
              <VocabDetailPanel
                vocabId={activeWord?._id ?? null}
                term={activeWord?.term ?? ''}
                display={activeWord?.display ?? ''}
                status={activeWord?.status ?? 0}
                meaning={activeWord?.meaning}
                notes={activeWord?.notes}
                language={selectedLanguage}
                onClose={handleCloseDetail}
                onDeleted={handleWordDeleted}
              />
            </View>
          )}
        </View>

        {/* Bulk action bar */}
        <BulkActionBar
          selectedCount={selection.selectionCount}
          onSetStatus={handleBulkSetStatus}
          onDeselectAll={selection.deselectAll}
          visible={selection.hasSelection}
          isBusy={isBulkUpdating}
        />

        {/* Mobile: Detail modal (bottom sheet style) */}
        {!isDesktop && (
          <Modal
            visible={showDetailModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleCloseDetail}
          >
            <View className="flex-1 bg-panel">
              <VocabDetailPanel
                vocabId={activeWord?._id ?? null}
                term={activeWord?.term ?? ''}
                display={activeWord?.display ?? ''}
                status={activeWord?.status ?? 0}
                meaning={activeWord?.meaning}
                notes={activeWord?.notes}
                language={selectedLanguage}
                onClose={handleCloseDetail}
                onDeleted={handleWordDeleted}
              />
            </View>
          </Modal>
        )}
      </View>
    </ScreenLayout>
  );
}
