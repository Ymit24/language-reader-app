import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '@/src/theme/AppThemeProvider';

interface ReaderHeaderProps {
  title: string;
}

export function ReaderHeader({ title }: ReaderHeaderProps) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const { lessonId } = useLocalSearchParams();
  const { colors } = useAppTheme();

  return (
    <View
      className={`h-16 flex-row items-center justify-between border-b border-border/70 bg-canvas/95 ${isLargeScreen ? 'px-6' : 'px-4'}`}
    >
      <Pressable
        onPress={() => router.back()}
        className="h-10 w-10 items-center justify-center rounded-full active:bg-muted/80"
        hitSlop={8}
      >
        <Ionicons name="chevron-back" size={20} color={colors['--subink']} />
      </Pressable>

      <Text
        className="mx-4 flex-1 text-center font-sans-semibold text-lg text-ink"
        numberOfLines={1}
      >
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
          color={colors['--subink']}
        />
      </Pressable>
    </View>
  );
}
