import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface ReaderHeaderProps {
  title: string;
}

export function ReaderHeader({ title }: ReaderHeaderProps) {
  return (
    <View className="h-20 flex-row items-center px-[28px] justify-between bg-canvas border-b border-border">
      <Pressable
        onPress={() => router.back()}
        className="p-2 -mr-2 rounded-lg active:bg-muted/50"
        hitSlop={8}
      >
        <Ionicons
          name="chevron-back"
          size={20}
          color="#4b5563"
        />
      </Pressable>

      <Text className="flex-1 text-center text-lg font-semibold text-ink mx-4" numberOfLines={1}>
        {title}
      </Text>

      <View className="w-10" />
    </View>
  );
}
