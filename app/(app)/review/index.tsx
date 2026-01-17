import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReviewScreen() {
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-1 px-4 py-6">
        <Text className="text-2xl font-semibold tracking-tight text-ink">Review</Text>
        <Text className="mt-2 text-sm text-subink">Spaced repetition review feature coming soon.</Text>
      </View>
    </SafeAreaView>
  );
}
