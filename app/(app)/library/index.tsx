import { ScrollView, View, Text, ActivityIndicator, Alert, ActionSheetIOS, Platform, useWindowDimensions, Pressable } from 'react-native';
import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react-native';
import { ScreenLayout } from '@/src/components/ScreenLayout';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/src/components/Button';
import { LessonCard, EmptyState } from '@/src/components/Card';
import { Id } from '@/convex/_generated/dataModel';
import type { VocabCounts } from '@/src/components/StackedProgressBar';
import { Input } from '@/src/components/Input';

// Estimated reading speed (words per minute)
const WORDS_PER_MINUTE = 200;
const WORDS_PER_PAGE = 150;

const STATUS_NEW = 0;
const STATUS_LEARNING_MIN = 1;
const STATUS_LEARNING_MAX = 3;
const STATUS_KNOWN = 4;

type LanguageFilter = 'all' | 'de' | 'fr' | 'ja';
type StatusFilter = 'all' | 'in_progress' | 'completed';

interface FilterPillProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

function FilterPill({ label, isActive, onPress }: FilterPillProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-3 py-1.5 rounded-full border ${isActive ? 'bg-ink border-ink' : 'bg-panel border-border/80'} active:opacity-80`}
    >
      <Text className={`text-xs font-sans-semibold ${isActive ? 'text-white' : 'text-subink'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function LibraryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lessons = useQuery(api.lessons.listLessonsWithVocab);
  const deleteLesson = useMutation(api.lessons.deleteLesson);
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

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

  const getReadingPercentage = (lesson: {
    tokenCount: number;
    currentPage?: number | undefined;
  }) => {
    const totalPages = Math.ceil(lesson.tokenCount / WORDS_PER_PAGE);
    if (lesson.currentPage === undefined || totalPages === 0) {
      return undefined;
    }
    return Math.round(((lesson.currentPage + 1) / totalPages) * 100);
  };

  const isLoading = lessons === undefined || vocabDe === undefined || vocabFr === undefined || vocabJa === undefined;

  const filteredLessons = useMemo(() => {
    if (!lessons) return [];
    const searchLower = searchQuery.trim().toLowerCase();

    return lessons.filter((lesson) => {
      const matchesSearch = !searchLower || lesson.title.toLowerCase().includes(searchLower);
      const matchesLanguage = languageFilter === 'all' || lesson.language === languageFilter;
      const isCompleted = !!lesson.completedAt;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'completed' ? isCompleted : !isCompleted);

      return matchesSearch && matchesLanguage && matchesStatus;
    });
  }, [lessons, searchQuery, languageFilter, statusFilter]);

  const continueLesson = useMemo(() => {
    if (filteredLessons.length === 0) {
      return undefined;
    }
    const inProgress = filteredLessons.find((lesson) => !lesson.completedAt);
    return inProgress ?? filteredLessons[0];
  }, [filteredLessons]);

  const allLessons = useMemo(() => {
    if (!continueLesson) return filteredLessons;
    return filteredLessons.filter((lesson) => lesson._id !== continueLesson._id);
  }, [filteredLessons, continueLesson]);

  return (
    <ScreenLayout edges={['top']}>
      <View className="flex-1 px-5 pt-6 md:px-8">
        <View className="mb-6 flex-row items-center justify-between">
          <Text className="text-3xl font-sans-bold tracking-tight text-ink">Library</Text>
          <Button variant="primary" onPress={handleCreateLesson} className="shadow-sm">
            <Plus color="#FFF" size={20} strokeWidth={2.5} />
            <Text className="text-white font-sans-semibold">New Lesson</Text>
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
            <View className="gap-6">
              <View className="rounded-2xl border border-border/80 bg-panel p-4 md:p-5 shadow-card">
                <Text className="text-xs font-sans-semibold uppercase tracking-[0.2em] text-faint">
                  Find lessons
                </Text>
                <View className="mt-3 gap-3">
                  <Input
                    placeholder="Search titles"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <View className="gap-2">
                    <View className="flex-row flex-wrap gap-2">
                      <FilterPill
                        label="All languages"
                        isActive={languageFilter === 'all'}
                        onPress={() => setLanguageFilter('all')}
                      />
                      <FilterPill
                        label="French"
                        isActive={languageFilter === 'fr'}
                        onPress={() => setLanguageFilter('fr')}
                      />
                      <FilterPill
                        label="German"
                        isActive={languageFilter === 'de'}
                        onPress={() => setLanguageFilter('de')}
                      />
                      <FilterPill
                        label="Japanese"
                        isActive={languageFilter === 'ja'}
                        onPress={() => setLanguageFilter('ja')}
                      />
                    </View>
                    <View className="flex-row flex-wrap gap-2">
                      <FilterPill
                        label="All status"
                        isActive={statusFilter === 'all'}
                        onPress={() => setStatusFilter('all')}
                      />
                      <FilterPill
                        label="In progress"
                        isActive={statusFilter === 'in_progress'}
                        onPress={() => setStatusFilter('in_progress')}
                      />
                      <FilterPill
                        label="Completed"
                        isActive={statusFilter === 'completed'}
                        onPress={() => setStatusFilter('completed')}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {continueLesson && (
                <View className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-lg font-sans-semibold text-ink">Continue reading</Text>
                    <Text className="text-xs text-subink font-sans-medium">
                      {filteredLessons.length} lessons
                    </Text>
                  </View>
                  <LessonCard
                    title={continueLesson.title}
                    language={continueLesson.language.toUpperCase()}
                    duration={formatDuration(continueLesson.tokenCount)}
                    openedDate={`${continueLesson.lastOpenedAt ? 'opened' : 'created'} ${formatDate(continueLesson.lastOpenedAt ?? continueLesson.createdAt)}`}
                    vocabCounts={calculateVocabCounts(continueLesson.uniqueTerms)}
                    readingPercentage={getReadingPercentage(continueLesson)}
                    variant="feature"
                    isCompleted={!!continueLesson.completedAt}
                    onPress={() => handleLessonPress(continueLesson._id)}
                    onLongPress={() => handleLongPress(continueLesson._id, continueLesson.title)}
                  />
                </View>
              )}

              <View className="gap-3">
                <Text className="text-lg font-sans-semibold text-ink">All lessons</Text>
                {filteredLessons.length === 0 ? (
                  <EmptyState
                    title="No matches"
                    description="Try a different search or filter"
                  />
                ) : (
                  <View className={`flex-row flex-wrap ${isDesktop ? 'gap-5' : 'gap-3'}`}>
                    {allLessons.map((lesson) => {
                      const readingPercentage = getReadingPercentage(lesson);

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
                )}
              </View>
            </View>
            <View className="h-10" />
          </ScrollView>
        )}
      </View>
    </ScreenLayout>
  );
}
