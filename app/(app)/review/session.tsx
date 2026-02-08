import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { SafeAreaView } from '@/src/components/SafeAreaView';
import { FlashCard } from '@/src/features/review/FlashCard';
import { GradeButtons } from '@/src/features/review/GradeButtons';
import { SessionSummary } from '@/src/features/review/SessionSummary';
import { XpPopup } from '@/src/features/review/XpPopup';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { useAppTheme } from '@/src/theme/AppThemeProvider';

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

export default function ReviewSession() {
  const router = useRouter();
  const params = useLocalSearchParams<{ language: string }>();
  const language = (params.language || 'fr') as 'fr' | 'de' | 'ja';
  const { colors } = useAppTheme();

  const [sessionId, setSessionId] = useState<Id<'reviewSessions'> | null>(null);
  const [items, setItems] = useState<SessionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showXpPopup, setShowXpPopup] = useState(false);
  const [lastXpEarned, setLastXpEarned] = useState(0);
  const [lastBonusXp, setLastBonusXp] = useState(0);
  const [leveledUp, setLeveledUp] = useState(false);
  const [newLevel, setNewLevel] = useState<number | undefined>();
  const [newTitle, setNewTitle] = useState<string | undefined>();
  const [currentStreak, setCurrentStreak] = useState(0);

  const progressValue = useSharedValue(0);

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
        router.back();
      }
    };
    initSession();
  }, [language]);

  // Update progress bar
  useEffect(() => {
    if (items.length > 0) {
      const ratio = Math.min(1, (currentIndex + 1) / items.length);
      progressValue.value = withTiming(ratio, { duration: 300 });
    }
  }, [currentIndex, items.length]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, progressValue.value) * 100}%`,
  }));

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

        // Update XP
        setTotalXpEarned((prev) => prev + result.xpEarned);
        setLastXpEarned(result.baseXp);
        setLastBonusXp(result.bonusXp);
        setShowXpPopup(true);

        // Update streak
        setCurrentStreak(result.currentStreak);

        // Track correct count
        if (quality >= 3) {
          setCorrectCount((prev) => prev + 1);
        }

        // Check for level up
        if (result.leveledUp) {
          setLeveledUp(true);
          setNewLevel(result.newLevel ?? undefined);
          setNewTitle(result.newTitle ?? undefined);
        }

        // Move to next card or complete
        if (result.isComplete || currentIndex >= items.length - 1) {
          setIsComplete(true);
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
      } catch (error) {
        console.error('Failed to grade card:', error);
      }
    },
    [sessionId, currentIndex, items, gradeCard, sessionStartTime],
  );

  const handleSwipeLeft = useCallback(() => {
    handleGrade(1); // Again
  }, [handleGrade]);

  const handleSwipeRight = useCallback(() => {
    handleGrade(4); // Good
  }, [handleGrade]);

  const handleClose = useCallback(async () => {
    if (sessionId && !isComplete) {
      await abandonSession({ sessionId });
    }
    router.back();
  }, [sessionId, isComplete, abandonSession, router]);

  const handleDone = useCallback(() => {
    router.back();
  }, [router]);

  const currentItem = items[currentIndex];

  // Loading state
  if (!sessionId || items.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-canvas">
        <View className="items-center gap-6">
          <View className="h-20 w-20 items-center justify-center rounded-3xl border border-border/40 bg-panel shadow-card">
            <ActivityIndicator size="small" color={colors['--brand']} />
          </View>
          <View className="items-center gap-2">
            <Text className="font-sans-semibold text-lg tracking-tight text-ink">
              Preparing Session
            </Text>
            <Text className="font-sans-bold text-xs uppercase tracking-[0.2em] text-faint">
              Gathering Cards
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Complete state - show summary
  if (isComplete) {
    return (
      <SessionSummary
        totalCards={items.length}
        correctCount={correctCount}
        xpEarned={totalXpEarned}
        currentStreak={currentStreak}
        leveledUp={leveledUp}
        newLevel={newLevel}
        newTitle={newTitle}
        onDone={handleDone}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      {/* XP Popup */}
      {showXpPopup && (
        <XpPopup
          xp={lastXpEarned}
          bonusXp={lastBonusXp}
          onComplete={() => setShowXpPopup(false)}
        />
      )}

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        {/* Close button */}
        <Pressable
          onPress={handleClose}
          className="h-10 w-10 items-center justify-center rounded-full bg-muted/50 active:bg-muted"
        >
          <Ionicons name="close" size={24} color={colors['--subink']} />
        </Pressable>

        {/* Progress */}
        <View className="mx-4 flex-1">
          <View className="h-2 w-full max-w-2xl self-center overflow-hidden rounded-full bg-muted">
            <Animated.View
              style={[
                progressStyle,
                {
                  height: '100%',
                  borderRadius: 999,
                  backgroundColor: colors['--brand'],
                  alignSelf: 'flex-start',
                },
              ]}
            />
          </View>
          <Text className="mt-1 text-center font-sans-medium text-xs text-faint">
            {currentIndex + 1} / {items.length}
          </Text>
        </View>

        {/* XP counter */}
        <View className="rounded-full bg-brandSoft px-3 py-1.5">
          <Text className="font-sans-bold text-sm text-brand">
            +{totalXpEarned} XP
          </Text>
        </View>
      </View>

      {/* Card area */}
      <View className="flex-1 items-center justify-center px-6 py-4">
        {currentItem && (
          <FlashCard
            word={currentItem.vocab.term}
            definition={currentItem.vocab.definition}
            context={currentItem.vocab.context}
            example={currentItem.vocab.example}
            language={currentItem.vocab.language as 'fr' | 'de' | 'ja'}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
          />
        )}
      </View>

      {/* Grade buttons */}
      <View className="px-4 pb-4">
        <GradeButtons onGrade={handleGrade} />
      </View>
    </SafeAreaView>
  );
}
