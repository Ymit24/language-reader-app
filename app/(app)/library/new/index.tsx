import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/src/components/Button';

export default function NewLessonScreen() {
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-1 px-4 py-6 md:px-6">
        <Text className="text-2xl font-semibold tracking-tight text-ink mb-6">New Lesson</Text>
        <Text className="text-sm text-subink">Paste your lesson text here...</Text>
      </View>
    </SafeAreaView>
  );
}
