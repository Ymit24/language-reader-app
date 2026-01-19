import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from '@/src/components/SafeAreaView';
import { usePaginatedQuery, useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { VocabFilterBar } from '@/src/features/vocab/VocabFilterBar';
import { VocabList } from '@/src/features/vocab/VocabList';
import { VocabDetailPanel } from '@/src/features/vocab/VocabDetailPanel';
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
  const [selectedVocab, setSelectedVocab] = useState<VocabItem | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const vocabCounts = useQuery(api.vocab.getVocabCounts, {
    language: selectedLanguage,
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

  const updateVocabStatus = useMutation(api.vocab.updateVocabStatus);
  const bulkUpdateStatus = useMutation(api.vocab.bulkUpdateStatus);
  const updateVocabMeta = useMutation(api.vocab.updateVocabMeta);
  const deleteVocab = useMutation(api.vocab.deleteVocab);

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

  const handleStatusUpdate = useCallback(async (status: number) => {
    if (!selectedVocab) return;

    try {
      await updateVocabStatus({
        language: selectedLanguage,
        term: selectedVocab.term,
        status,
      });
      setSelectedVocab({ ...selectedVocab, status });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }, [selectedVocab, selectedLanguage, updateVocabStatus]);

  const handleBulkUpdateStatus = useCallback(async (status: VocabStatus) => {
    if (selectedIds.size === 0) return;

    const termsToUpdate = results
      .filter((v: VocabItem) => selectedIds.has(v._id) && v.status !== status)
      .map((v: VocabItem) => v.term);

    if (termsToUpdate.length === 0) {
      setSelectedIds(new Set());
      return;
    }

    try {
      await bulkUpdateStatus({
        language: selectedLanguage,
        terms: termsToUpdate,
        status,
      });
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Failed to bulk update:', error);
    }
  }, [selectedIds, results, selectedLanguage, bulkUpdateStatus]);

  const handleUpdateMeaning = useCallback(async (meaning: string) => {
    if (!selectedVocab) return;

    try {
      await updateVocabMeta({
        termId: selectedVocab._id,
        meaning,
      });
    } catch (error) {
      console.error('Failed to update meaning:', error);
    }
  }, [selectedVocab, updateVocabMeta]);

  const handleUpdateNotes = useCallback(async (notes: string) => {
    if (!selectedVocab) return;

    try {
      await updateVocabMeta({
        termId: selectedVocab._id,
        notes,
      });
    } catch (error) {
      console.error('Failed to update notes:', error);
    }
  }, [selectedVocab, updateVocabMeta]);

  const handleReset = useCallback(async () => {
    if (!selectedVocab) return;

    try {
      await updateVocabStatus({
        language: selectedLanguage,
        term: selectedVocab.term,
        status: 0,
      });
      setSelectedVocab({ ...selectedVocab, status: 0 });
    } catch (error) {
      console.error('Failed to reset:', error);
    }
  }, [selectedVocab, selectedLanguage, updateVocabStatus]);

  const handleDelete = useCallback(async () => {
    if (!selectedVocab) return;

    try {
      await deleteVocab({ termId: selectedVocab._id });
      setSelectedVocab(null);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  }, [selectedVocab, deleteVocab]);

  const handleCloseDetail = useCallback(() => {
    setSelectedVocab(null);
  }, []);

  const handleCloseBulkActions = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const counts = vocabCounts || { new: 0, recognized: 0, learning: 0, familiar: 0, known: 0, ignored: 0, total: 0 };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-1 flex-row">
        <View className={cn("flex-1 flex-col", isDesktop && selectedVocab && "mr-0")}>
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

        {isDesktop && selectedVocab && (
          <View className="w-[380px] flex-shrink-0">
            <VocabDetailPanel
              vocab={selectedVocab}
              onUpdateStatus={handleStatusUpdate}
              onUpdateMeaning={handleUpdateMeaning}
              onUpdateNotes={handleUpdateNotes}
              onReset={handleReset}
              onDelete={handleDelete}
            />
          </View>
        )}
      </View>

      {!isDesktop && selectedVocab && (
        <VocabDetailModal
          vocab={selectedVocab}
          onClose={handleCloseDetail}
          onUpdateStatus={handleStatusUpdate}
          onUpdateMeaning={handleUpdateMeaning}
          onUpdateNotes={handleUpdateNotes}
          onReset={handleReset}
          onDelete={handleDelete}
        />
      )}
    </SafeAreaView>
  );
}

function VocabDetailModal({
  vocab,
  onClose,
  onUpdateStatus,
  onUpdateMeaning,
  onUpdateNotes,
  onReset,
  onDelete,
}: {
  vocab: VocabItem;
  onClose: () => void;
  onUpdateStatus: (status: number) => void;
  onUpdateMeaning: (meaning: string) => void;
  onUpdateNotes: (notes: string) => void;
  onReset: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/30"
        onPress={onClose}
      >
        <Pressable
          className="flex-1 bg-white mt-20 rounded-t-3xl overflow-hidden"
          onPress={(e) => e.stopPropagation()}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
              <Text className="text-lg font-semibold text-ink">Word Details</Text>
              <Pressable
                onPress={onClose}
                className="p-2 rounded-full active:bg-gray-100"
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </Pressable>
            </View>
            <ScrollView className="flex-1">
              <View className="p-6 pb-32">
                <View className="flex-row justify-between items-start mb-6">
                  <View>
                    <Text className="text-3xl font-serif font-medium text-ink tracking-tight">
                      {vocab.display || vocab.term}
                    </Text>
                    <Text className="text-sm text-gray-400 mt-1 font-mono">
                      {vocab.term}
                    </Text>
                  </View>
                </View>

                <View className="mb-8">
                  <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Status
                  </Text>
                  <View className="flex-row gap-2 flex-wrap">
                    {[
                      { value: STATUS_NEW, label: 'New', color: 'bg-blue-50 border-blue-200', activeColor: 'bg-blue-200 border-blue-300', textClass: 'text-blue-700' },
                      { value: STATUS_LEARNING_1, label: 'Recognized', color: 'bg-amber-50 border-amber-200', activeColor: 'bg-amber-200 border-amber-300', textClass: 'text-amber-700' },
                      { value: STATUS_LEARNING_2, label: 'Learning', color: 'bg-amber-100 border-amber-200', activeColor: 'bg-amber-300 border-amber-400', textClass: 'text-amber-800' },
                      { value: STATUS_LEARNING_3, label: 'Familiar', color: 'bg-amber-200 border-amber-300', activeColor: 'bg-amber-400 border-amber-500', textClass: 'text-amber-900' },
                      { value: STATUS_KNOWN, label: 'Known', color: 'bg-white border-gray-200', activeColor: 'bg-emerald-200 border-emerald-400', textClass: 'text-emerald-700' },
                    ].map((opt) => (
                      <Pressable
                        key={opt.value}
                        onPress={() => onUpdateStatus(opt.value)}
                        className={cn(
                          "items-center justify-center py-3 px-4 rounded-xl border flex-1",
                          vocab.status === opt.value
                            ? opt.activeColor
                            : `bg-white ${opt.color.split(' ')[0]}`
                        )}
                      >
                        {opt.value === STATUS_KNOWN ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color={vocab.status === opt.value ? "#059669" : "#9ca3af"}
                          />
                        ) : (
                          <Text className={cn(
                            "text-sm font-medium",
                            vocab.status === opt.value
                              ? opt.textClass
                              : "text-gray-400"
                          )}>
                            {opt.label}
                          </Text>
                        )}
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View className="mb-6">
                  <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Meaning
                  </Text>
                  <TextInput
                    defaultValue={vocab.meaning || ''}
                    onSubmitEditing={(e) => onUpdateMeaning(e.nativeEvent.text)}
                    placeholder="Add a definition..."
                    placeholderTextColor="#9ca3af"
                    multiline
                    textAlignVertical="top"
                    className="min-h-[80px] p-4 bg-gray-50 rounded-xl text-ink text-base"
                  />
                </View>

                <View className="mb-6">
                  <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Notes
                  </Text>
                  <TextInput
                    defaultValue={vocab.notes || ''}
                    onSubmitEditing={(e) => onUpdateNotes(e.nativeEvent.text)}
                    placeholder="Add notes..."
                    placeholderTextColor="#9ca3af"
                    multiline
                    textAlignVertical="top"
                    className="min-h-[60px] p-4 bg-gray-50 rounded-xl text-ink text-base"
                  />
                </View>

                <View className="border-t border-gray-100 pt-6">
                  <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    Statistics
                  </Text>

                  <View className="flex-row flex-wrap gap-4">
                    <View className="bg-gray-50 rounded-lg px-4 py-3 flex-1 min-w-[100px]">
                      <Text className="text-xs text-gray-400 mb-1">Reviews</Text>
                      <Text className="text-xl font-semibold text-ink">
                        {vocab.reviews || 0}
                      </Text>
                    </View>

                    <View className="bg-gray-50 rounded-lg px-4 py-3 flex-1 min-w-[100px]">
                      <Text className="text-xs text-gray-400 mb-1">Interval</Text>
                      <Text className="text-xl font-semibold text-ink">
                        {vocab.intervalDays || 0}d
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View className="border-t border-gray-200 p-4 gap-2 bg-white">
              {vocab.status === 4 && (
                <Pressable
                  onPress={onReset}
                  className="flex-row items-center justify-center py-3 bg-gray-100 rounded-lg active:bg-gray-200"
                >
                  <Ionicons name="refresh" size={18} color="#6b7280" />
                  <Text className="ml-2 text-sm font-medium text-gray-700">
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
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
