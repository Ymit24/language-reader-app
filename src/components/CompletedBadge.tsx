import { View } from 'react-native';

export function CompletedBadge() {
  return (
    <View className="h-6 w-6 items-center justify-center rounded-full border border-success/20 bg-successSoft">
      <View className="h-2.5 w-2.5 rounded-full bg-success" />
    </View>
  );
}
