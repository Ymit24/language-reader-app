import { useState, useEffect, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';

interface SessionItem {
  _id: Id<'reviewSessionItems'>;
  vocab: {
    term: string;
    definition?: string;
    context?: string;
    example?: string;
    language: string;
  };
}

interface UseReviewSessionOptions {
  language: 'fr' | 'de' | 'ja';
  onNoItemsAvailable: () => void;
}

interface UseReviewSessionReturn {
  sessionId: Id<'reviewSessions'> | null;
  items: SessionItem[];
  currentIndex: number;
  isComplete: boolean;
  sessionStartTime: number;
  currentItem: SessionItem | undefined;
  isLoading: boolean;
  handleGrade: (quality: number) => Promise<{
    ease: number;
    isComplete: boolean;
    xpEarned: number;
    baseXp: number;
    bonusXp: number;
    leveledUp: boolean;
    newLevel: number | null;
    newTitle: string | null;
    currentStreak: number;
    isFirstReviewOfDay: boolean;
  } | undefined>;
  handleAbandon: () => Promise<void>;
}

export function useReviewSession({
  language,
  onNoItemsAvailable,
}: UseReviewSessionOptions): UseReviewSessionReturn {
  const [sessionId, setSessionId] = useState<Id<'reviewSessions'> | null>(null);
  const [items, setItems] = useState<SessionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionStartTime] = useState(Date.now());

  const startSession = useMutation(api.review.startReviewSession);
  const gradeCard = useMutation(api.review.gradeCardWithXp);
  const abandonSession = useMutation(api.review.abandonSession);

  // Start session on mount
  useEffect(() => {
    const initSession = async () => {
      const result = await startSession({ language, limit: 10 });
      if (result.sessionId && result.items.length > 0) {
        setSessionId(result.sessionId);
        setItems(result.items as unknown as SessionItem[]);
      } else {
        // No items to review
        onNoItemsAvailable();
      }
    };
    initSession();
  }, [language, onNoItemsAvailable, startSession]);

  const handleGrade = useCallback(
    async (quality: number) => {
      if (!sessionId || currentIndex >= items.length) return;

      const item = items[currentIndex];

      try {
        const result = await gradeCard({
          sessionItemId: item._id,
          quality,
          sessionStartTime,
        });

        // Move to next card or complete
        if (result.isComplete || currentIndex >= items.length - 1) {
          setIsComplete(true);
        } else {
          setCurrentIndex((prev) => prev + 1);
        }

        return result;
      } catch (error) {
        console.error('Failed to grade card:', error);
        throw error;
      }
    },
    [sessionId, currentIndex, items, gradeCard, sessionStartTime]
  );

  const handleAbandon = useCallback(async () => {
    if (sessionId && !isComplete) {
      await abandonSession({ sessionId });
    }
  }, [sessionId, isComplete, abandonSession]);

  const currentItem = items[currentIndex];
  const isLoading = !sessionId || items.length === 0;

  return {
    sessionId,
    items,
    currentIndex,
    isComplete,
    sessionStartTime,
    currentItem,
    isLoading,
    handleGrade,
    handleAbandon,
  };
}
