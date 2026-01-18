import { View } from 'react-native';

export function CompletedBadge() {
  return (
    <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center">
      <View className="w-3 h-3 rounded-full bg-green-500" />
    </View>
  );
}
