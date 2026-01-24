import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { ScreenLayout } from '@/src/components/ScreenLayout';
import { Button } from '@/src/components/Button';
import { LanguageFlag } from '@/src/components/LanguageFlag';
import { api } from '@/convex/_generated/api';
import { useQuery, useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

type LanguageCode = 'fr' | 'de' | 'ja';

interface LanguageInfo {
  code: LanguageCode;
  name: string;
}

const LANGUAGES: LanguageInfo[] = [
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
];

function LanguageCard({ language }: { language: LanguageInfo }) {
  const dueCount = useQuery(api.review.getDueCount, { language: language.code });
  const knownCount = useQuery(api.review.getKnownCount, { language: language.code });
  const router = useRouter();
  const startSession = useMutation(api.review.startReviewSession);
  const [isStarting, setIsStarting] = useState(false);

  const due = dueCount ?? 0;
  const known = knownCount ?? 0;

  const handleStartSession = async () => {
    if (due === 0 || isStarting) return;
    setIsStarting(true);
    try {
      const result = await startSession({ language: language.code });
      if (result.sessionId) {
        router.replace(`/review/session/${result.sessionId}` as any);
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <View className="bg-panel/90 rounded-2xl border border-border/80 p-5 mb-4 shadow-card">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <LanguageFlag code={language.code} size={32} />
          <Text className="text-xl font-sans-semibold text-ink">{language.name}</Text>
        </View>
        <View className="flex-row gap-5">
          <View className="items-end">
            <Text className="text-[11px] text-faint uppercase tracking-widest font-sans-semibold">Due</Text>
            <Text className={`text-2xl font-sans-bold ${due > 0 ? 'text-accent' : 'text-faint/70'}`}>
              {due}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-[11px] text-faint uppercase tracking-widest font-sans-semibold">Known</Text>
            <Text className="text-2xl font-sans-bold text-success">{known}</Text>
          </View>
        </View>
      </View>

      <Button
        variant={due > 0 ? 'primary' : 'secondary'}
        disabled={due === 0 || isStarting}
        onPress={handleStartSession}
        className="w-full"
      >
        {isStarting ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator size="small" color="white" />
            <Text className="text-white font-sans-semibold">Starting...</Text>
          </View>
        ) : due > 0 ? (
          'Start Review Session'
        ) : (
          'No cards due'
        )}
      </Button>
    </View>
  );
}

export default function ReviewScreen() {
  const todayReviews = useQuery(api.review.getTodayReviewCount);
  const learningCount = useQuery(api.review.getLearningCount);

  const today = todayReviews ?? 0;
  const learning = learningCount ?? 0;

  return (
    <ScreenLayout edges={['top']}>
      <ScrollView className="flex-1 px-5 pt-6">
        <Text className="text-2xl font-sans-semibold tracking-tight text-ink mb-1">Review</Text>
        <Text className="text-sm text-subink font-sans-medium mb-6">
          Keep your streak steady with short, focused sessions.
        </Text>

        <View className="flex-row flex-wrap gap-4 mb-6">
          <View className="bg-panel/90 border border-border/80 rounded-2xl px-4 py-4 flex-1 min-w-[140px] shadow-card">
            <Text className="text-[11px] text-faint uppercase tracking-widest font-sans-semibold">Today&apos;s Reviews</Text>
            <Text className="text-3xl font-sans-bold text-accent mt-2">{today}</Text>
          </View>
          <View className="bg-panel/90 border border-border/80 rounded-2xl px-4 py-4 flex-1 min-w-[140px] shadow-card">
            <Text className="text-[11px] text-faint uppercase tracking-widest font-sans-semibold">Learning</Text>
            <Text className="text-3xl font-sans-bold text-success mt-2">{learning}</Text>
          </View>
        </View>

        <Text className="text-xs font-sans-semibold text-faint uppercase tracking-widest mb-3">Languages</Text>
        {LANGUAGES.map((lang) => (
          <LanguageCard key={lang.code} language={lang} />
        ))}

        <View className="mt-8 p-5 bg-panel/80 rounded-2xl border border-border/80 shadow-card">
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="information-circle-outline" size={18} color="#80776e" />
            <Text className="font-sans-semibold text-subink">About spaced repetition</Text>
          </View>
          <Text className="text-sm text-subink leading-6 font-sans-medium">
            Review words at optimal intervals to maximize retention. Words you find difficult will appear more frequently.
          </Text>
        </View>
        <View className="h-10" />
      </ScrollView>
    </ScreenLayout>
  );
}
