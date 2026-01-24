import { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { ScreenLayout } from '@/src/components/ScreenLayout';
import { api } from '@/convex/_generated/api';
import { useQuery, useMutation } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Flashcard } from '@/src/features/review/Flashcard';
import { GradingButtons } from '@/src/features/review/GradingButtons';
import { SessionSummary } from '@/src/features/review/SessionSummary';
import { Ionicons } from '@expo/vector-icons';
import { Id } from '@/convex/_generated/dataModel';

interface SessionItem {
  _id: Id<'reviewSessionItems'>;
  sessionId: Id<'reviewSessions'>;
  vocabId: Id<'vocab'>;
  quality: number | undefined;
  reviewedAt: number | undefined;
  vocab: any;
}

export default function ReviewSessionScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  const sessionData = useQuery(api.review.getSession, { sessionId: sessionId as any });
  const gradeCard = useMutation(api.review.gradeCard);
  const abandonSession = useMutation(api.review.abandonSession);

  const isLoading = sessionData === undefined;
  const hasError = sessionData === null;
  const session = sessionData?.session;
  const items = sessionData?.items ?? [];

  const currentItem = items[currentIndex];
  const reviewedCount = items.filter((i) => i.quality !== undefined).length;

  useEffect(() => {
    if (session && session.status === 'completed') {
      setSessionComplete(true);
    }
  }, [session]);

  const handleFlip = useCallback(() => {
    if (!isFlipped) {
      setIsFlipped(true);
    }
  }, [isFlipped]);

  const handleGrade = useCallback(async (quality: number) => {
    if (!currentItem) return;

    try {
      const result = await gradeCard({
        sessionItemId: currentItem._id,
        quality,
      });

      if (result.isComplete) {
        setSessionComplete(true);
      } else if (currentIndex < items.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
      }
    } catch (error) {
      console.error('Failed to grade card:', error);
    }
  }, [currentItem, currentIndex, items.length, gradeCard]);

  const handleClose = useCallback(async () => {
    if (session && session.status === 'in_progress') {
      await abandonSession({ sessionId: session._id });
    }
    router.replace('/review');
  }, [session, abandonSession, router]);

  const handleContinue = useCallback(() => {
    router.replace('/review');
  }, [router]);

  if (isLoading) {
    return (
      <ScreenLayout edges={['top']}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
          <Text className="text-subink mt-4 font-sans-medium">Loading session...</Text>
        </View>
      </ScreenLayout>
    );
  }

  if (hasError || !session) {
    return (
      <ScreenLayout edges={['top']}>
        <View className="flex-1 justify-center items-center px-8">
          <Ionicons name="alert-circle-outline" size={64} color="#b42318" />
          <Text className="text-2xl font-sans-bold text-ink mt-4 mb-2">Session Not Found</Text>
          <Text className="text-subink text-center mb-6 font-sans-medium">
            This session may have expired or been abandoned.
          </Text>
          <Pressable
            onPress={() => router.replace('/review')}
            className="bg-ink px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-sans-semibold">Back to Review</Text>
          </Pressable>
        </View>
      </ScreenLayout>
    );
  }

  if (sessionComplete) {
    return (
      <ScreenLayout edges={['top']}>
        <SessionSummary
          reviewedCount={session.reviewedCount}
          averageEase={session.reviewedCount > 0 ? session.easeSum / session.reviewedCount : 2.5}
          onContinue={handleContinue}
        />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout edges={['top']}>
      <View className="flex-1 px-5 py-4">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={handleClose} className="p-2">
            <Ionicons name="close" size={24} color="#524a43" />
          </Pressable>
          <Text className="text-sm font-sans-semibold text-subink">
            {reviewedCount + 1} / {items.length}
          </Text>
          <View className="w-9" />
        </View>

        <View className="flex-1">
          {currentItem && (
            <View className="flex-1">
              <View className="flex-1">
                <Flashcard
                  vocab={currentItem.vocab}
                  isFlipped={isFlipped}
                  onFlip={handleFlip}
                />
              </View>

              {isFlipped && (
                <View className="mt-6">
                  <GradingButtons onGrade={handleGrade} />
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </ScreenLayout>
  );
}
