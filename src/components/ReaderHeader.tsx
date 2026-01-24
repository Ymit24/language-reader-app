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
    <View className={`h-16 flex-row items-center justify-between bg-canvas/95 border-b border-border/70 ${isLargeScreen ? 'px-6' : 'px-4'}`}>
      <Pressable
        onPress={() => router.back()}
        className="h-10 w-10 items-center justify-center rounded-full active:bg-muted/80"
        hitSlop={8}
      >
        <Ionicons
          name="chevron-back"
          size={20}
          color="#524a43"
        />
      </Pressable>

      <Text className="flex-1 text-center text-lg font-sans-semibold text-ink mx-4" numberOfLines={1}>
        {title}
      </Text>

      <Pressable
        onPress={() => router.push(`/library/${lessonId}/edit`)}
        className="h-10 w-10 items-center justify-center rounded-full active:bg-muted/80"
        hitSlop={8}
      >
        <Ionicons
          name="settings-outline"
          size={20}
          color="#524a43"
        />
      </Pressable>
    </View>
  );
}
