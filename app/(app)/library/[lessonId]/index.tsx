import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Reader } from '../../../../src/features/reader/Reader';
import { Id } from '../../../../convex/_generated/dataModel';

export default function LessonReaderScreen() {
  const { lessonId } = useLocalSearchParams();
  
  // Safely cast or validate lessonId
  const safeLessonId = Array.isArray(lessonId) ? lessonId[0] : lessonId;

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Reader', headerBackTitle: 'Library', headerShown: true }} />
      {safeLessonId ? (
         <Reader lessonId={safeLessonId as Id<"lessons">} />
      ) : (
         <View className="flex-1 justify-center items-center">
            <Text>Invalid Lesson ID</Text>
         </View>
      )}
    </SafeAreaView>
  );
}
