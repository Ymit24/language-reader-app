import { useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '@/src/components/Button';
import { LessonCard, EmptyState } from '@/src/components/Card';

interface Lesson {
  id: string;
  title: string;
  language: string;
  duration: string;
  openedDate: string;
  knownPercentage: number;
}

const mockLessons: Lesson[] = [
  {
    id: '1',
    title: 'Der Umgang mit Zeit',
    language: 'DE',
    duration: '12 min',
    openedDate: 'Jan 16',
    knownPercentage: 62,
  },
  {
    id: '2',
    title: '日本の食文化（入門）',
    language: 'JA',
    duration: '8 min',
    openedDate: 'Jan 10',
    knownPercentage: 18,
  },
  {
    id: '3',
    title: 'Introduction to French',
    language: 'FR',
    duration: '15 min',
    openedDate: 'Jan 8',
    knownPercentage: 45,
  },
  {
    id: '4',
    title: 'Morning Routines',
    language: 'DE',
    duration: '10 min',
    openedDate: 'Jan 5',
    knownPercentage: 78,
  },
];

export default function LibraryScreen() {
  const router = useRouter();
  const [lessons] = useState<Lesson[]>(mockLessons);

  const handleLessonPress = (lessonId: string) => {
    (router.push as any)(`/(app)/library/${lessonId}`);
  };

  const handleCreateLesson = () => {
    router.push('/(app)/library/new');
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

        {lessons.length === 0 ? (
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
            {lessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                title={lesson.title}
                language={lesson.language}
                duration={lesson.duration}
                openedDate={lesson.openedDate}
                knownPercentage={lesson.knownPercentage}
                onPress={() => handleLessonPress(lesson.id)}
              />
            ))}
            <View className="h-4" />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
