import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ScreenLayout } from '@/src/components/ScreenLayout';
import { ProgressHeader } from '@/src/features/review/ProgressHeader';
import { LanguageCard } from '@/src/features/review/LanguageCard';
import { ActivityHeatmap } from '@/src/features/review/ActivityHeatmap';

export default function ReviewDashboard() {
  const router = useRouter();
  
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

  return (
    <ScreenLayout>
      <ScrollView 
        className="flex-1" 
        contentContainerClassName="p-4 md:p-6 gap-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header */}
        <View className="gap-1">
          <Text className="text-2xl font-serif-bold text-ink">Review</Text>
          <Text className="text-sm text-subink font-sans-medium">
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
              <Text className="text-2xl font-sans-bold text-ink">
                {todayStats.reviewCount}
              </Text>
              <Text className="text-xs text-subink font-sans-medium">
                Reviews today
              </Text>
            </View>
            <View className="flex-1 rounded-xl border border-border/80 bg-panel p-4">
              <Text className="text-2xl font-sans-bold text-success">
                +{todayStats.xpEarned}
              </Text>
              <Text className="text-xs text-subink font-sans-medium">
                XP earned
              </Text>
            </View>
            <View className="flex-1 rounded-xl border border-border/80 bg-panel p-4">
              <Text className="text-2xl font-sans-bold text-brand">
                {weeklyStats?.accuracy ?? 0}%
              </Text>
              <Text className="text-xs text-subink font-sans-medium">
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
          <Text className="text-lg font-sans-bold text-ink">Your Languages</Text>
          
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
          ) : languageStats && languageStats.length > 0 ? (
            languageStats.map((stats) => (
              <LanguageCard
                key={stats.language}
                language={stats.language as 'fr' | 'de' | 'ja'}
                languageName={stats.languageName}
                dueCount={stats.dueCount}
                learningCount={stats.learningCount}
                knownCount={stats.knownCount}
                onStartReview={() => handleStartReview(stats.language as 'fr' | 'de' | 'ja')}
              />
            ))
          ) : (
            <View className="rounded-2xl border border-border/80 bg-panel p-8 items-center">
              <Text className="text-4xl mb-3">📚</Text>
              <Text className="text-lg font-sans-semibold text-ink text-center">
                No vocabulary yet
              </Text>
              <Text className="text-sm text-subink font-sans-medium text-center mt-1">
                Start reading lessons to build your vocabulary
              </Text>
            </View>
          )}
        </View>

        {/* Weekly Summary */}
        {weeklyStats && weeklyStats.reviewCount > 0 && (
          <View className="rounded-2xl border border-border/80 bg-panel p-5">
            <Text className="text-base font-sans-bold text-ink mb-4">
              This Week
            </Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-xl font-sans-bold text-ink">
                  {weeklyStats.reviewCount}
                </Text>
                <Text className="text-xs text-faint font-sans-medium">
                  Reviews
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-xl font-sans-bold text-success">
                  {weeklyStats.correctCount}
                </Text>
                <Text className="text-xs text-faint font-sans-medium">
                  Correct
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-xl font-sans-bold text-brand">
                  +{weeklyStats.xpEarned}
                </Text>
                <Text className="text-xs text-faint font-sans-medium">
                  XP
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-xl font-sans-bold text-accent">
                  {weeklyStats.accuracy}%
                </Text>
                <Text className="text-xs text-faint font-sans-medium">
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
