import { View, Text, ActivityIndicator } from 'react-native';
import { ScreenLayout } from '@/src/components/ScreenLayout';
import { PageHeader } from '@/src/components/PageHeader';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useQuery } from 'convex/react';
import { Reader } from '../../../../src/features/reader/Reader';
import { Id } from '../../../../convex/_generated/dataModel';
import { api } from '../../../../convex/_generated/api';

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
      <ScreenLayout edges={['bottom']} showBackground={false}>
        <LoadingScreen />
      </ScreenLayout>
    );
  }

  if (lessonQuery === null) {
    return (
      <ScreenLayout edges={['bottom']} showBackground={false}>
        <NotFoundScreen />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout edges={['top']} showBackground={false}>
      <Stack.Screen options={{ headerShown: false }} />
      <PageHeader
        title={lessonQuery.title}
        leftAction={{ onPress: () => router.back() }}
        rightAction={{
          icon: 'settings-outline',
          onPress: () => router.push(`/library/${lessonId}/edit`),
        }}
      />
      <Reader lesson={lessonQuery} />
    </ScreenLayout>
  );
}
