import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
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

  const progressWidth = useSharedValue(0);

  const startSession = useMutation(api.review.startReviewSession);
  const gradeCard = useMutation(api.review.gradeCardWithXp);
  const abandonSession = useMutation(api.review.abandonSession);
  const progress = useQuery(api.progress.getProgress);

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
      progressWidth.value = withTiming((currentIndex / items.length) * 100, {
        duration: 300,
      });
    }
  }, [currentIndex, items.length]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
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
    [sessionId, currentIndex, items, gradeCard, sessionStartTime]
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
      <SafeAreaView className="flex-1 bg-canvas items-center justify-center">
        <View className="items-center gap-6">
          <View className="w-20 h-20 rounded-3xl bg-panel border border-border/40 items-center justify-center shadow-card">
            <ActivityIndicator size="small" color={colors['--brand']} />
          </View>
          <View className="items-center gap-2">
            <Text className="text-lg font-sans-semibold text-ink tracking-tight">Preparing Session</Text>
            <Text className="text-xs text-faint font-sans-bold uppercase tracking-[0.2em]">Gathering Cards</Text>
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
      <View className="px-4 py-3 flex-row items-center justify-between">
        {/* Close button */}
        <Pressable
          onPress={handleClose}
          className="w-10 h-10 rounded-full items-center justify-center bg-muted/50 active:bg-muted"
        >
          <Ionicons name="close" size={24} color={colors['--subink']} />
        </Pressable>

        {/* Progress */}
        <View className="flex-1 mx-4">
          <View className="h-2 rounded-full bg-muted overflow-hidden">
            <Animated.View
              style={progressStyle}
              className="h-full rounded-full bg-brand"
            />
          </View>
          <Text className="text-xs text-center text-faint font-sans-medium mt-1">
            {currentIndex + 1} / {items.length}
          </Text>
        </View>

        {/* XP counter */}
        <View className="bg-brandSoft px-3 py-1.5 rounded-full">
          <Text className="text-sm font-sans-bold text-brand">
            +{totalXpEarned} XP
          </Text>
        </View>
      </View>

      {/* Card area */}
      <View className="flex-1 px-6 py-4 items-center justify-center">
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
