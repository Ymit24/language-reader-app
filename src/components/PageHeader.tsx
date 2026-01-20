import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

  return (
    <View className={`h-20 flex-row items-center justify-between bg-canvas border-b border-border ${isLargeScreen ? 'px-[28px]' : 'px-4'}`}>
      <Pressable
        onPress={leftAction?.onPress ?? (() => {})}
        className={`p-2 -mr-2 rounded-lg active:bg-muted/50 ${!leftAction ? 'opacity-0' : ''}`}
        hitSlop={8}
      >
        <Ionicons
          name={leftAction?.icon ?? 'chevron-back'}
          size={20}
          color="#5C5648"
        />
      </Pressable>

      <Text className="flex-1 text-center text-lg font-semibold text-ink mx-4" numberOfLines={1}>
        {title}
      </Text>

      <Pressable
        onPress={rightAction?.onPress ?? (() => {})}
        className={`p-2 rounded-lg active:bg-muted/50 ${!rightAction ? 'opacity-0' : ''}`}
        hitSlop={8}
      >
        <Ionicons
          name={rightAction?.icon ?? 'settings-outline'}
          size={20}
          color="#5C5648"
        />
      </Pressable>
    </View>
  );
}
