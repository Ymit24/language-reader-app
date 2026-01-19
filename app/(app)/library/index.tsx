import { ScrollView, View, Text, ActivityIndicator, Alert, ActionSheetIOS, Platform, useWindowDimensions } from 'react-native';
import { useMemo } from 'react';
import { SafeAreaView } from '@/src/components/SafeAreaView';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/src/components/Button';
import { LessonCard, EmptyState } from '@/src/components/Card';
import { Id } from '@/convex/_generated/dataModel';
import type { VocabCounts } from '@/src/components/StackedProgressBar';

// Estimated reading speed (words per minute)
const WORDS_PER_MINUTE = 200;
const WORDS_PER_PAGE = 150;

const STATUS_NEW = 0;
const STATUS_LEARNING_MIN = 1;
const STATUS_LEARNING_MAX = 3;
const STATUS_KNOWN = 4;

export default function LibraryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lessons = useQuery(api.lessons.listLessonsWithVocab);
  const deleteLesson = useMutation(api.lessons.deleteLesson);

  const vocabDe = useQuery(api.vocab.getVocabProfile, { language: 'de' });
  const vocabFr = useQuery(api.vocab.getVocabProfile, { language: 'fr' });
  const vocabJa = useQuery(api.vocab.getVocabProfile, { language: 'ja' });

  const vocabMap = useMemo(() => {
    const map: Record<string, number> = {};
    const allVocab = [...(vocabDe || []), ...(vocabFr || []), ...(vocabJa || [])];
    for (const v of allVocab) {
      map[v.term] = v.status;
    }
    return map;
  }, [vocabDe, vocabFr, vocabJa]);

  const isDesktop = width >= 768;
  const numColumns = width >= 1024 ? 3 : width >= 768 ? 2 : 1;
  const variant = isDesktop ? 'grid' : 'list';

  const handleLessonPress = (lessonId: string) => {
    (router.push as any)(`/(app)/library/${lessonId}`);
  };

  const handleCreateLesson = () => {
    router.push('/(app)/library/new');
  };

  const handleDelete = async (lessonId: Id<"lessons">) => {
    try {
      await deleteLesson({ lessonId });
    } catch (error) {
      Alert.alert("Error", "Failed to delete lesson");
    }
  };

  const handleLongPress = (lessonId: Id<"lessons">, title: string) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Delete Lesson'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          title: `Manage "${title}"`,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleDelete(lessonId);
          }
        }
      );
    } else {
      Alert.alert(
        `Manage "${title}"`,
        'Choose an action',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive', 
            onPress: () => handleDelete(lessonId) 
          },
        ]
      );
    }
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

  const calculateVocabCounts = (uniqueTerms: string[]): VocabCounts => {
    const counts: VocabCounts = { new: 0, learning: 0, known: 0 };

    for (const term of uniqueTerms) {
      const status = vocabMap[term] ?? STATUS_NEW;
      if (status === STATUS_NEW) counts.new++;
      else if (status >= STATUS_LEARNING_MIN && status <= STATUS_LEARNING_MAX) counts.learning++;
      else if (status === STATUS_KNOWN) counts.known++;
    }

    return counts;
  };

  const isLoading = lessons === undefined || vocabDe === undefined || vocabFr === undefined || vocabJa === undefined;

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-1 px-4 py-6 md:px-6">
        <View className="mb-6 flex-row items-center justify-between">
          <Text className="text-2xl font-semibold tracking-tight text-ink">Library</Text>
          <Button variant="primary" onPress={handleCreateLesson}>
            New Lesson
          </Button>
        </View>

        {isLoading ? (
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
            showsVerticalScrollIndicator={false}
          >
            <View className={`flex-row flex-wrap ${isDesktop ? 'gap-4' : 'gap-3'}`}>
              {lessons.map((lesson) => {
                const totalPages = Math.ceil(lesson.tokenCount / WORDS_PER_PAGE);
                const readingPercentage = lesson.currentPage !== undefined && totalPages > 0
                  ? Math.round(((lesson.currentPage + 1) / totalPages) * 100)
                  : undefined;

                const dateToUse = lesson.lastOpenedAt ?? lesson.createdAt;
                const dateLabel = lesson.lastOpenedAt ? 'opened' : 'created';
                
                let widthClass = 'w-full';
                if (numColumns === 2) widthClass = 'w-[48%]';
                if (numColumns === 3) widthClass = 'w-[32%]';

                return (
                  <View 
                    key={lesson._id}
                    className={widthClass}
                  >
                    <LessonCard
                      title={lesson.title}
                      language={lesson.language.toUpperCase()}
                      duration={formatDuration(lesson.tokenCount)}
                      openedDate={`${dateLabel} ${formatDate(dateToUse)}`}
                      vocabCounts={calculateVocabCounts(lesson.uniqueTerms)}
                      readingPercentage={readingPercentage}
                      variant={variant}
                      isCompleted={!!lesson.completedAt}
                      onPress={() => handleLessonPress(lesson._id)}
                      onLongPress={() => handleLongPress(lesson._id, lesson.title)}
                    />
                  </View>
                );
              })}
            </View>
            <View className="h-8" />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
