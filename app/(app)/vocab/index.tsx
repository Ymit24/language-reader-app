import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ScreenLayout } from '@/src/components/ScreenLayout';
import { BulkActionBar } from '@/src/features/vocab/BulkActionBar';
import { VocabStatus } from '@/src/features/vocab/StatusBadge';
import { VocabDetailPanel } from '@/src/features/vocab/VocabDetailPanel';
import { VocabFilterBar } from '@/src/features/vocab/VocabFilters';
import { VocabList } from '@/src/features/vocab/VocabList';
import { VocabItem } from '@/src/features/vocab/VocabRow';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Text,
  useWindowDimensions,
  View
} from 'react-native';

type Language = 'de' | 'fr' | 'ja';
type SortBy = 'dateAdded' | 'alphabetical' | 'status';

export default function VocabScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Filter & sort state
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('fr');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VocabStatus | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('dateAdded');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<Id<'vocab'>>>(new Set());
  const [activeWordId, setActiveWordId] = useState<Id<'vocab'> | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Mobile detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Convex queries
  const vocabCounts = useQuery(api.vocab.getVocabCounts, {
    language: selectedLanguage,
    search: debouncedSearch || undefined,
  });

  const {
    results: vocabResults,
    status: paginationStatus,
    loadMore,
  } = usePaginatedQuery(
    api.vocab.listVocab,
    {
      language: selectedLanguage,
      search: debouncedSearch || undefined,
      statusFilter: statusFilter !== null ? [statusFilter] : undefined,
      sortBy,
      sortOrder,
    },
    { initialNumItems: 50 }
  );

  const bulkUpdateStatus = useMutation(api.vocab.bulkUpdateStatusById);

  // Available languages (for now, just show all three)
  const availableLanguages: Language[] = ['fr', 'de', 'ja'];

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
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

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

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBulkSetStatus = useCallback(
    async (status: VocabStatus) => {
      if (selectedIds.size === 0 || isBulkUpdating) return;
      setIsBulkUpdating(true);
      try {
        await bulkUpdateStatus({
          termIds: Array.from(selectedIds),
          status,
        });
        setSelectedIds(new Set());
      } finally {
        setIsBulkUpdating(false);
      }
    },
    [selectedIds, bulkUpdateStatus, isBulkUpdating]
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
    setSelectedIds(new Set());
    setActiveWordId(null);
  }, [selectedLanguage]);

  const isLoading = paginationStatus === 'LoadingFirstPage';
  const isEmpty = !isLoading && vocabList.length === 0;
  const hasMore = paginationStatus === 'CanLoadMore';
  const selectionMode = selectedIds.size > 0;

  // Empty message based on filters
  const emptyMessage = useMemo(() => {
    if (debouncedSearch) {
      return 'No words match your search';
    }
    if (statusFilter !== null) {
      return 'No words with this status';
    }
    return 'Start reading to build your vocabulary';
  }, [debouncedSearch, statusFilter]);

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
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            availableLanguages={availableLanguages}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            counts={vocabCounts ?? undefined}
          />
        </View>

        {/* Main content */}
        <View className="flex-1 flex-row">
          {/* List section */}
          <View className={isDesktop ? 'w-2/5 border-r border-border/50' : 'flex-1'}>
            <VocabList
              data={vocabList}
              selectedIds={selectedIds}
              activeId={activeWordId}
              onToggleSelect={handleToggleSelect}
              onSelectWord={handleSelectWord}
              selectionMode={selectionMode}
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
          selectedCount={selectedIds.size}
          onSetStatus={handleBulkSetStatus}
          onDeselectAll={handleDeselectAll}
          visible={selectionMode}
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
