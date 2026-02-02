import { useState, useCallback } from 'react';
import { Id } from '@/convex/_generated/dataModel';

export function useVocabSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<Id<'vocab'>>>(new Set());

  const toggleSelect = useCallback((id: Id<'vocab'>) => {
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

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectionCount = selectedIds.size;
  const hasSelection = selectionCount > 0;

  return {
    selectedIds,
    selectionCount,
    hasSelection,
    toggleSelect,
    deselectAll,
    clearSelection: deselectAll, // Alias for consistency
  };
}
