import { View } from 'react-native';
import { useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

type SafeAreaViewProps = {
  className?: string;
  edges?: Edge[];
  children: React.ReactNode;
};

export function SafeAreaView({ className, edges = ['top', 'bottom'], children }: SafeAreaViewProps) {
  const insets = useSafeAreaInsets();

  const style: { paddingTop?: number; paddingBottom?: number; paddingLeft?: number; paddingRight?: number } = {};

  if (edges.includes('top')) {
    style.paddingTop = insets.top;
  }
  if (edges.includes('bottom')) {
    style.paddingBottom = insets.bottom;
  }
  if (edges.includes('left')) {
    style.paddingLeft = insets.left;
  }
  if (edges.includes('right')) {
    style.paddingRight = insets.right;
  }

  return (
    <View className={className} style={style}>
      {children}
    </View>
  );
}
