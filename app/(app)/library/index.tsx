import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/src/components/Button';
import { LessonCard, EmptyState } from '@/src/components/Card';

// Estimated reading speed (words per minute)
const WORDS_PER_MINUTE = 200;

export default function LibraryScreen() {
  const router = useRouter();
  const lessons = useQuery(api.lessons.listLessons);

  const handleLessonPress = (lessonId: string) => {
    // Cast to any to bypass strict route typing for dynamic routes in some setups
    (router.push as any)(`/(app)/library/${lessonId}`);
  };

  const handleCreateLesson = () => {
    router.push('/(app)/library/new');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (tokenCount: number) => {
    const minutes = Math.ceil(tokenCount / WORDS_PER_MINUTE);
    return `${minutes} min`;
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-1 px-4 py-6 md:px-6">
        <View className="mb-6 flex-row items-center justify-between">
          <Text className="text-2xl font-semibold tracking-tight text-ink">Library</Text>
          <Button variant="primary" onPress={handleCreateLesson}>
            New Lesson
          </Button>
        </View>

        {lessons === undefined ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" />
          </View>
        ) : lessons.length === 0 ? (
          <EmptyState
            title="No lessons yet"
            description="Create your first lesson by pasting text"
            action={<Button variant="primary" onPress={handleCreateLesson}>Create Lesson</Button>}
          />
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ gap: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {lessons.map((lesson) => {
              const knownPercentage = lesson.tokenCount > 0 
                ? Math.round((lesson.knownTokenCount / lesson.tokenCount) * 100) 
                : 0;

              // Use lastOpenedAt if available, otherwise createdAt
              const dateToUse = lesson.lastOpenedAt ?? lesson.createdAt;
              const dateLabel = lesson.lastOpenedAt ? 'opened' : 'created';
              
              return (
                <LessonCard
                  key={lesson._id}
                  title={lesson.title}
                  language={lesson.language.toUpperCase()}
                  duration={formatDuration(lesson.tokenCount)}
                  openedDate={`${dateLabel} ${formatDate(dateToUse)}`}
                  knownPercentage={knownPercentage}
                  onPress={() => handleLessonPress(lesson._id)}
                />
              );
            })}
            <View className="h-4" />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
