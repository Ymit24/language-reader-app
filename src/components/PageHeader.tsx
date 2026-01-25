import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/AppThemeProvider';

interface PageHeaderProps {
  title: string;
  leftAction?: {
    icon?: 'chevron-back' | 'arrow-back';
    onPress: () => void;
  };
  rightAction?: {
    icon?: 'settings-outline' | 'ellipsis-horizontal' | 'checkmark';
    onPress: () => void;
  };
}

export function PageHeader({ title, leftAction, rightAction }: PageHeaderProps) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const { colors } = useAppTheme();

  return (
    <View className={`h-16 flex-row items-center justify-between bg-canvas/95 border-b border-border/70 ${isLargeScreen ? 'px-[28px]' : 'px-4'}`}>
      <Pressable
        onPress={leftAction?.onPress ?? (() => {})}
        className={`h-10 w-10 items-center justify-center rounded-full active:bg-muted/80 ${!leftAction ? 'opacity-0' : ''}`}
        hitSlop={8}
      >
        <Ionicons
          name={leftAction?.icon ?? 'chevron-back'}
          size={20}
          color={colors['--subink']}
        />
      </Pressable>

      <Text className="flex-1 text-center text-lg font-sans-semibold text-ink mx-4" numberOfLines={1}>
        {title}
      </Text>

      <Pressable
        onPress={rightAction?.onPress ?? (() => {})}
        className={`h-10 w-10 items-center justify-center rounded-full active:bg-muted/80 ${!rightAction ? 'opacity-0' : ''}`}
        hitSlop={8}
      >
        <Ionicons
          name={rightAction?.icon ?? 'settings-outline'}
          size={20}
          color={colors['--subink']}
        />
      </Pressable>
    </View>
  );
}
