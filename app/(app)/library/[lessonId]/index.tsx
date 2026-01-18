import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from '@/src/components/SafeAreaView';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery } from 'convex/react';
import { Reader } from '../../../../src/features/reader/Reader';
import { Id } from '../../../../convex/_generated/dataModel';
import { api } from '../../../../convex/_generated/api';
import { ReaderHeader } from '@/src/components/ReaderHeader';

function LoadingScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-canvas">
      <ActivityIndicator size="large" />
    </View>
  );
}

function NotFoundScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-canvas">
      <Text>Lesson not found</Text>
    </View>
  );
}

export default function LessonReaderScreen() {
  const { lessonId } = useLocalSearchParams();

  const safeLessonId = Array.isArray(lessonId) ? lessonId[0] : lessonId;

  const lessonQuery = useQuery(
    api.lessons.getLesson,
    safeLessonId ? { lessonId: safeLessonId as Id<"lessons"> } : "skip"
  );

  if (!safeLessonId) {
    return <NotFoundScreen />;
  }

  if (lessonQuery === undefined) {
    return (
      <SafeAreaView className="flex-1 bg-canvas" edges={['bottom']}>
        <LoadingScreen />
      </SafeAreaView>
    );
  }

  if (lessonQuery === null) {
    return (
      <SafeAreaView className="flex-1 bg-canvas" edges={['bottom']}>
        <NotFoundScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ReaderHeader title={lessonQuery.title} />
      <Reader lessonId={safeLessonId as Id<"lessons">} />
    </SafeAreaView>
  );
}
