import { PageHeader } from '@/src/components/PageHeader';
import { ScreenLayout } from '@/src/components/ScreenLayout';
import { useIsFocused } from '@react-navigation/native';
import { useQuery } from 'convex/react';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { Reader } from '../../../../src/features/reader/Reader';

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
  const isScreenFocused = useIsFocused();

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
      <Reader lesson={lessonQuery} isScreenFocused={isScreenFocused} />
    </ScreenLayout>
  );
}
