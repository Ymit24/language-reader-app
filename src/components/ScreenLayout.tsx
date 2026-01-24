import { View } from 'react-native';
import { SafeAreaView } from './SafeAreaView';

type ScreenLayoutProps = {
  children: React.ReactNode;
  className?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  showBackground?: boolean;
};

export function ScreenLayout({
  children,
  className = '',
  edges = ['top'],
  showBackground = true,
}: ScreenLayoutProps) {
  return (
    <SafeAreaView className={`flex-1 bg-canvas ${className}`} edges={edges}>
      {showBackground && (
        <View className="absolute inset-0" pointerEvents="none">
          <View className="absolute -top-24 -right-20 h-56 w-56 rounded-full bg-brandSoft/60" />
          <View className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-muted/70" />
        </View>
      )}
      <View className="flex-1">
        {children}
      </View>
    </SafeAreaView>
  );
}
