import { useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { ScreenLayout } from '@/src/components/ScreenLayout';
import { PageHeader } from '@/src/components/PageHeader';
import { ProgressBar } from '@/src/components/ProgressBar';
import { Button } from '@/src/components/Button';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

const STATUS_NEW = 0;

interface WordItem {
  surface: string;
  normalized: string;
}

interface WordCardProps {
  surface: string;
  normalized: string;
  keepUnknown: boolean;
  onToggle: () => void;
}

function WordCard({ surface, normalized, keepUnknown, onToggle }: WordCardProps) {
  return (
    <Pressable
      onPress={onToggle}
      className={`w-full p-4 rounded-xl border mb-3 active:opacity-80 ${
        keepUnknown
          ? 'bg-panel border-border/80'
          : 'bg-successSoft border-success/30'
      }`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
            keepUnknown
              ? 'border-border2 bg-transparent'
              : 'bg-success border-success'
          }`}>
            {!keepUnknown && (
              <Text className="text-white text-xs font-sans-bold">✓</Text>
            )}
          </View>
          <View>
            <Text className={`text-xl font-serif-semibold ${keepUnknown ? 'text-ink' : 'text-success'}`}>
              {surface}
            </Text>
            <Text className={`text-sm ${keepUnknown ? 'text-faint' : 'text-success'} font-sans-medium`}>
              {normalized}
            </Text>
          </View>
        </View>
        <Text className={`text-xs font-sans-semibold ${keepUnknown ? 'text-faint' : 'text-success'}`}>
          {keepUnknown ? 'Keeping unknown' : 'Will be marked known'}
        </Text>
      </View>
    </Pressable>
  );
}

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

export default function LessonSummaryScreen() {
  const { lessonId } = useLocalSearchParams();
  const safeLessonId = Array.isArray(lessonId) ? lessonId[0] : lessonId;

  const lessonQuery = useQuery(
    api.lessons.getLesson,
    safeLessonId ? { lessonId: safeLessonId as Id<"lessons"> } : "skip"
  );

  const language = lessonQuery?.language;
  const vocabData = useQuery(api.vocab.getVocabProfile, language ? { language } : "skip");

  const completeLessonMutation = useMutation(api.lessons.completeLesson);
  const markRemainingMutation = useMutation(api.vocab.markRemainingWordsAsKnown);

  const [isCompleting, setIsCompleting] = useState(false);
  const [keepUnknownTerms, setKeepUnknownTerms] = useState<Set<string>>(new Set());

  const vocabMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (vocabData) {
      for (const v of vocabData) {
        map[v.term] = v.status;
      }
    }
    return map;
  }, [vocabData]);

  const unknownWords = useMemo(() => {
    if (!lessonQuery?.tokens) return [];

    const uniqueTerms = new Map<string, WordItem>();

    for (const token of lessonQuery.tokens) {
      if (!token.isWord || !token.normalized) continue;

      const status = vocabMap[token.normalized] ?? STATUS_NEW;
      if (status === STATUS_NEW) {
        if (!uniqueTerms.has(token.normalized)) {
          uniqueTerms.set(token.normalized, {
            surface: token.surface,
            normalized: token.normalized,
          });
        }
      }
    }

    return Array.from(uniqueTerms.values()).sort((a, b) =>
      a.normalized.localeCompare(b.normalized)
    );
  }, [lessonQuery?.tokens, vocabMap]);

  const handleToggleWord = useCallback((normalized: string) => {
    setKeepUnknownTerms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(normalized)) {
        newSet.delete(normalized);
      } else {
        newSet.add(normalized);
      }
      return newSet;
    });
  }, []);

  const handleKeepAllUnknown = useCallback(() => {
    const allTerms = new Set(unknownWords.map(w => w.normalized));
    setKeepUnknownTerms(allTerms);
  }, [unknownWords]);

  const handleCompleteLesson = async () => {
    if (!safeLessonId) return;
    setIsCompleting(true);

    await markRemainingMutation({
      lessonId: safeLessonId as Id<"lessons">,
      keepUnknownTerms: Array.from(keepUnknownTerms),
    });

    await completeLessonMutation({ lessonId: safeLessonId as Id<"lessons"> });
    router.push('/library');
  };

  const totalUnknown = unknownWords.length;
  const keepUnknownCount = keepUnknownTerms.size;
  const willBeMarkedKnown = totalUnknown - keepUnknownCount;
  const percentKnown = totalUnknown > 0 ? Math.round((willBeMarkedKnown / totalUnknown) * 100) : 100;

  if (!safeLessonId) {
    return (
      <ScreenLayout edges={['bottom']}>
        <NotFoundScreen />
      </ScreenLayout>
    );
  }

  if (lessonQuery === undefined || vocabData === undefined) {
    return (
      <ScreenLayout edges={['bottom']}>
        <LoadingScreen />
      </ScreenLayout>
    );
  }

  if (lessonQuery === null) {
    return (
      <ScreenLayout edges={['bottom']}>
        <NotFoundScreen />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: false,
          title: lessonQuery.title,
        }}
      />
      <PageHeader
        title={lessonQuery.title}
        leftAction={{ onPress: () => router.back() }}
      />

      <View className="flex-1">
        <View className="px-5 py-4 border-b border-border/60 bg-panel/90">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-xs text-faint uppercase tracking-widest font-sans-semibold">Review words</Text>
            <Text className="text-sm font-sans-semibold text-ink">
              {willBeMarkedKnown} will be marked known
            </Text>
          </View>
          <ProgressBar
            progress={percentKnown}
            color="success"
            height={6}
          />
          {keepUnknownCount > 0 && (
            <Text className="text-xs text-faint mt-2 font-sans-medium">
              {keepUnknownCount} word{keepUnknownCount !== 1 ? 's' : ''} you will keep learning
            </Text>
          )}
        </View>

        <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
          {unknownWords.length === 0 ? (
            <View className="py-12 items-center">
              <Text className="text-lg text-ink font-sans-semibold">All words known!</Text>
              <Text className="text-sm text-faint mt-1 font-sans-medium">Tap Complete Lesson to finish</Text>
            </View>
          ) : (
            <>
              {unknownWords.map((word) => {
                const keepUnknown = keepUnknownTerms.has(word.normalized);
                return (
                  <WordCard
                    key={word.normalized}
                    surface={word.surface}
                    normalized={word.normalized}
                    keepUnknown={keepUnknown}
                    onToggle={() => handleToggleWord(word.normalized)}
                  />
                );
              })}

              {keepUnknownCount === 0 && (
                <Pressable
                  onPress={handleKeepAllUnknown}
                  className="mt-4 py-3 rounded-lg bg-muted active:bg-muted/80 items-center"
                >
                  <Text className="text-sm font-sans-semibold text-ink">
                    Keep all {totalUnknown} words as unknown
                  </Text>
                </Pressable>
              )}
            </>
          )}

          <View className="h-6" />
        </ScrollView>

        <View className="p-5 border-t border-border/60 bg-panel/90 gap-3">
          <Button
            variant="primary"
            onPress={handleCompleteLesson}
            disabled={isCompleting}
            className="py-3"
          >
            {isCompleting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              'Complete Lesson'
            )}
          </Button>
        </View>
      </View>
    </ScreenLayout>
  );
}
