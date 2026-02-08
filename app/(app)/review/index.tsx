import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ScreenLayout } from '@/src/components/ScreenLayout';
import { ProgressHeader } from '@/src/features/review/ProgressHeader';
import { LanguageCard } from '@/src/features/review/LanguageCard';
import { ActivityHeatmap } from '@/src/features/review/ActivityHeatmap';
import { useSelectedLanguage } from '@/src/lib/selectedLanguage';
import { LANGUAGE_LABELS } from '@/src/lib/languages';

export default function ReviewDashboard() {
  const router = useRouter();
  const { selectedLanguage } = useSelectedLanguage();

  const progress = useQuery(api.progress.getProgress);
  const languageStats = useQuery(api.review.getAllLanguageStats);
  const weeklyStats = useQuery(api.progress.getWeeklyStats);
  const todayStats = useQuery(api.progress.getTodayStats);
  const dailyStats = useQuery(api.progress.getDailyStats, { days: 91 });

  const isLoading = progress === undefined || languageStats === undefined;

  const handleStartReview = (language: 'fr' | 'de' | 'ja') => {
    router.push({
      pathname: '/review/session',
      params: { language },
    });
  };

  const selectedStats = useMemo(() => {
    if (!languageStats) return undefined;
    return languageStats.find((stats) => stats.language === selectedLanguage);
  }, [languageStats, selectedLanguage]);

  return (
    <ScreenLayout>
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 md:p-6 gap-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header */}
        <View className="gap-1">
          <Text className="font-serif-bold text-2xl text-ink">Review</Text>
          <Text className="font-sans-medium text-sm text-subink">
            Practice your vocabulary with spaced repetition
          </Text>
        </View>

        {/* Progress Header */}
        <ProgressHeader
          level={progress?.level ?? 1}
          title={progress?.title ?? 'Beginner'}
          totalXp={progress?.totalXp ?? 0}
          currentXpInLevel={progress?.currentXpInLevel ?? 0}
          xpForNextLevel={progress?.xpForNextLevel ?? 100}
          xpProgress={progress?.xpProgress ?? 0}
          currentStreak={progress?.currentStreak ?? 0}
          isLoading={isLoading}
        />

        {/* Today's Stats */}
        {todayStats && (
          <View className="flex-row gap-3">
            <View className="flex-1 rounded-xl border border-border/80 bg-panel p-4">
              <Text className="font-sans-bold text-2xl text-ink">
                {todayStats.reviewCount}
              </Text>
              <Text className="font-sans-medium text-xs text-subink">
                Reviews today
              </Text>
            </View>
            <View className="flex-1 rounded-xl border border-border/80 bg-panel p-4">
              <Text className="font-sans-bold text-2xl text-success">
                +{todayStats.xpEarned}
              </Text>
              <Text className="font-sans-medium text-xs text-subink">
                XP earned
              </Text>
            </View>
            <View className="flex-1 rounded-xl border border-border/80 bg-panel p-4">
              <Text className="font-sans-bold text-2xl text-brand">
                {weeklyStats?.accuracy ?? 0}%
              </Text>
              <Text className="font-sans-medium text-xs text-subink">
                This week
              </Text>
            </View>
          </View>
        )}

        {/* Activity Heatmap */}
        <ActivityHeatmap
          dailyStats={dailyStats ?? []}
          days={91}
          isLoading={dailyStats === undefined}
        />

        {/* Language Cards */}
        <View className="gap-4">
          <Text className="font-sans-bold text-lg text-ink">Your Language</Text>

          {isLoading ? (
            <>
              <LanguageCard
                language="fr"
                languageName="French"
                dueCount={0}
                learningCount={0}
                knownCount={0}
                onStartReview={() => {}}
                isLoading={true}
              />
              <LanguageCard
                language="de"
                languageName="German"
                dueCount={0}
                learningCount={0}
                knownCount={0}
                onStartReview={() => {}}
                isLoading={true}
              />
            </>
          ) : selectedStats ? (
            <LanguageCard
              language={selectedStats.language as 'fr' | 'de' | 'ja'}
              languageName={selectedStats.languageName}
              dueCount={selectedStats.dueCount}
              learningCount={selectedStats.learningCount}
              knownCount={selectedStats.knownCount}
              onStartReview={() => handleStartReview(selectedLanguage)}
            />
          ) : (
            <View className="items-center rounded-2xl border border-border/80 bg-panel p-8">
              <Text className="mb-3 text-4xl">📚</Text>
              <Text className="text-center font-sans-semibold text-lg text-ink">
                No vocabulary yet in {LANGUAGE_LABELS[selectedLanguage]}
              </Text>
              <Text className="mt-1 text-center font-sans-medium text-sm text-subink">
                Start reading lessons in this language to build your vocabulary
              </Text>
            </View>
          )}
        </View>

        {/* Weekly Summary */}
        {weeklyStats && weeklyStats.reviewCount > 0 && (
          <View className="rounded-2xl border border-border/80 bg-panel p-5">
            <Text className="mb-4 font-sans-bold text-base text-ink">
              This Week
            </Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="font-sans-bold text-xl text-ink">
                  {weeklyStats.reviewCount}
                </Text>
                <Text className="font-sans-medium text-xs text-faint">
                  Reviews
                </Text>
              </View>
              <View className="items-center">
                <Text className="font-sans-bold text-xl text-success">
                  {weeklyStats.correctCount}
                </Text>
                <Text className="font-sans-medium text-xs text-faint">
                  Correct
                </Text>
              </View>
              <View className="items-center">
                <Text className="font-sans-bold text-xl text-brand">
                  +{weeklyStats.xpEarned}
                </Text>
                <Text className="font-sans-medium text-xs text-faint">XP</Text>
              </View>
              <View className="items-center">
                <Text className="font-sans-bold text-xl text-accent">
                  {weeklyStats.accuracy}%
                </Text>
                <Text className="font-sans-medium text-xs text-faint">
                  Accuracy
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}
