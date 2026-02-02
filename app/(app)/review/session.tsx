import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from '@/src/components/SafeAreaView';
import { FlashCard } from '@/src/features/review/FlashCard';
import { GradeButtons } from '@/src/features/review/GradeButtons';
import { SessionSummary } from '@/src/features/review/SessionSummary';
import { XpPopup } from '@/src/features/review/XpPopup';
import { SessionHeader } from '@/src/features/review/SessionHeader';
import { SessionLoading } from '@/src/features/review/SessionLoading';
import { useReviewSession } from '@/src/features/review/hooks/useReviewSession';
import { useXpTracking } from '@/src/features/review/hooks/useXpTracking';

export default function ReviewSession() {
  const router = useRouter();
  const params = useLocalSearchParams<{ language: string }>();
  const language = (params.language || 'fr') as 'fr' | 'de' | 'ja';

  const xpTracking = useXpTracking();

  const session = useReviewSession({
    language,
    onNoItemsAvailable: () => router.back(),
  });

  const handleGrade = useCallback(
    async (quality: number) => {
      try {
        const result = await session.handleGrade(quality);

        if (result) {
          // Update XP tracking
          xpTracking.updateXp({
            xpEarned: result.xpEarned,
            baseXp: result.baseXp,
            bonusXp: result.bonusXp,
            currentStreak: result.currentStreak,
            leveledUp: result.leveledUp,
            newLevel: result.newLevel ?? undefined,
            newTitle: result.newTitle ?? undefined,
          });

          // Track correct count
          if (quality >= 3) {
            xpTracking.incrementCorrect();
          }
        }
      } catch (error) {
        console.error('Failed to grade card:', error);
      }
    },
    [session, xpTracking]
  );

  const handleSwipeLeft = useCallback(() => {
    handleGrade(1); // Again
  }, [handleGrade]);

  const handleSwipeRight = useCallback(() => {
    handleGrade(4); // Good
  }, [handleGrade]);

  const handleClose = useCallback(async () => {
    await session.handleAbandon();
    router.back();
  }, [session, router]);

  const handleDone = useCallback(() => {
    router.back();
  }, [router]);

  // Loading state
  if (session.isLoading) {
    return <SessionLoading />;
  }

  // Complete state - show summary
  if (session.isComplete) {
    return (
      <SessionSummary
        totalCards={session.items.length}
        correctCount={xpTracking.correctCount}
        xpEarned={xpTracking.totalXpEarned}
        currentStreak={xpTracking.currentStreak}
        leveledUp={xpTracking.leveledUp}
        newLevel={xpTracking.newLevel}
        newTitle={xpTracking.newTitle}
        onDone={handleDone}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      {/* XP Popup */}
      {xpTracking.showXpPopup && (
        <XpPopup
          xp={xpTracking.lastXpEarned}
          bonusXp={xpTracking.lastBonusXp}
          onComplete={xpTracking.hideXpPopup}
        />
      )}

      <SessionHeader
        currentIndex={session.currentIndex}
        totalItems={session.items.length}
        totalXp={xpTracking.totalXpEarned}
        onClose={handleClose}
      />

      {/* Card area */}
      <View className="flex-1 px-6 py-4 items-center justify-center">
        {session.currentItem && (
          <FlashCard
            word={session.currentItem.vocab.term}
            definition={session.currentItem.vocab.definition}
            context={session.currentItem.vocab.context}
            example={session.currentItem.vocab.example}
            language={session.currentItem.vocab.language as 'fr' | 'de' | 'ja'}
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
