import { useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from '@/src/components/SafeAreaView';
import { api } from '@/convex/_generated/api';
import { useQuery, useMutation } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Flashcard } from '@/src/features/review/Flashcard';
import { GradingButtons } from '@/src/features/review/GradingButtons';
import { SessionSummary } from '@/src/features/review/SessionSummary';
import { Ionicons } from '@expo/vector-icons';

export default function ReviewSessionScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const language = params.language as 'fr' | 'de' | 'ja';
  const limit = 20;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [easeSum, setEaseSum] = useState(0);

  const vocabItems = useQuery(api.review.getDueVocab, { language, limit });
  const processReview = useMutation(api.review.processReview);

  const isLoading = vocabItems === undefined;
  const hasNoCards = vocabItems !== undefined && vocabItems.length === 0;
  const currentCard = vocabItems?.[currentIndex];

  const handleGrade = useCallback(async (quality: number) => {
    if (!currentCard) return;

    try {
      const result = await processReview({
        vocabId: currentCard._id,
        quality,
      });

      setReviewedCount((prev) => prev + 1);
      if (result.ease) {
        setEaseSum((prev) => prev + result.ease);
      }

      if (currentIndex < (vocabItems?.length ?? 0) - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
      } else {
        setSessionComplete(true);
      }
    } catch (error) {
      console.error('Failed to process review:', error);
    }
  }, [currentCard, currentIndex, vocabItems, processReview]);

  const handleFlip = useCallback(() => {
    if (!isFlipped) {
      setIsFlipped(true);
    }
  }, [isFlipped]);

  const handleContinue = () => {
    router.replace('/review');
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
          <Text className="text-subink mt-4">Loading cards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasNoCards) {
    return (
      <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
        <View className="flex-1 justify-center items-center px-8">
          <Ionicons name="checkmark-circle-outline" size={64} color="#15803d" />
          <Text className="text-2xl font-bold text-ink mt-4 mb-2">All Caught Up!</Text>
          <Text className="text-subink text-center mb-6">
            No cards due for review in {language.toUpperCase()} right now.
          </Text>
          <Pressable
            onPress={() => router.replace('/review')}
            className="bg-ink px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Back to Review</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (sessionComplete) {
    return (
      <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
        <SessionSummary
          reviewedCount={reviewedCount}
          averageEase={reviewedCount > 0 ? easeSum / reviewedCount : 2.5}
          onContinue={handleContinue}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-1 px-4 py-4">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={() => router.replace('/review')} className="p-2">
            <Ionicons name="close" size={24} color="#666" />
          </Pressable>
          <Text className="text-sm font-medium text-subink">
            {currentIndex + 1} / {vocabItems?.length}
          </Text>
          <View className="w-9" />
        </View>

        <View className="flex-1">
          {currentCard && (
            <View className="flex-1">
              <View className="flex-1">
                <Flashcard
                  vocab={currentCard}
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
    </SafeAreaView>
  );
}
