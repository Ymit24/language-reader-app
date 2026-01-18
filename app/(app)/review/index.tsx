import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from '@/src/components/SafeAreaView';
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
    <View className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-3">
          <LanguageFlag code={language.code} size={32} />
          <Text className="text-xl font-semibold text-ink">{language.name}</Text>
        </View>
        <View className="flex-row gap-4">
          <View className="items-end">
            <Text className="text-xs text-subink uppercase tracking-wide">Due</Text>
            <Text className={`text-2xl font-bold ${due > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
              {due}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-xs text-subink uppercase tracking-wide">Known</Text>
            <Text className="text-2xl font-bold text-green-600">{known}</Text>
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
            <Text className="text-white">Starting...</Text>
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
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <ScrollView className="flex-1 px-4 py-6">
        <Text className="text-2xl font-semibold tracking-tight text-ink mb-6">Review</Text>

        <View className="flex-row flex-wrap gap-4 mb-6">
          <View className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex-1 min-w-[140px]">
            <Text className="text-xs text-amber-700 uppercase tracking-wide font-semibold">Today&apos;s Reviews</Text>
            <Text className="text-2xl font-bold text-amber-800 mt-1">--</Text>
          </View>
          <View className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex-1 min-w-[140px]">
            <Text className="text-xs text-green-700 uppercase tracking-wide font-semibold">Learning</Text>
            <Text className="text-2xl font-bold text-green-800 mt-1">--</Text>
          </View>
        </View>

        <Text className="text-sm font-medium text-subink uppercase tracking-wide mb-3">Languages</Text>
        {LANGUAGES.map((lang) => (
          <LanguageCard key={lang.code} language={lang} />
        ))}

        <View className="mt-8 p-4 bg-muted rounded-lg border border-border">
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="information-circle-outline" size={18} color="#666" />
            <Text className="font-medium text-subink">About Spaced Repetition</Text>
          </View>
          <Text className="text-sm text-subink leading-5">
            Review words at optimal intervals to maximize retention. Words you find difficult will appear more frequently.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
