import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

interface ReaderHeaderProps {
  title: string;
}

export function ReaderHeader({ title }: ReaderHeaderProps) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const { lessonId } = useLocalSearchParams();

  return (
    <View className={`h-20 flex-row items-center justify-between bg-canvas border-b border-border ${isLargeScreen ? 'px-[28px]' : 'px-4'}`}>
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

      <Pressable
        onPress={() => router.push(`/library/${lessonId}/edit`)}
        className="p-2 rounded-lg active:bg-muted/50"
        hitSlop={8}
      >
        <Ionicons
          name="settings-outline"
          size={20}
          color="#4b5563"
        />
      </Pressable>
    </View>
  );
}
