import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

export default function LessonReaderScreen() {
  const { lessonId } = useLocalSearchParams();
  
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-1 px-4 py-6 md:px-6">
        <Text className="text-2xl font-semibold tracking-tight text-ink">Lesson {lessonId}</Text>
        <Text className="text-sm text-subink mt-2">Reader content will go here...</Text>
      </View>
    </SafeAreaView>
  );
}
