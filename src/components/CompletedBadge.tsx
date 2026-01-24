import { View } from 'react-native';

export function CompletedBadge() {
  return (
    <View className="w-6 h-6 rounded-full bg-successSoft border border-success/20 items-center justify-center">
      <View className="w-2.5 h-2.5 rounded-full bg-success" />
    </View>
  );
}
