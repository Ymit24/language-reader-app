import { View, Text } from 'react-native';

interface ProgressBarProps {
  progress: number;
  color?: 'success' | 'brand' | 'neutral';
  showLabel?: boolean;
  label?: string;
  height?: number;
}

export function ProgressBar({
  progress,
  color = 'brand',
  showLabel = false,
  label,
  height,
}: ProgressBarProps) {
  const colorMap: Record<string, string> = {
    success: 'bg-success',
    brand: 'bg-brand',
    neutral: 'bg-border2',
  };

  const colorClass = colorMap[color] || colorMap.brand;
  const heightClass = height === 6 ? 'h-1.5' : height === 8 ? 'h-2' : 'h-1.5';

  return (
    <View className="w-full">
      {(showLabel || label) && (
        <View className="flex-row items-center justify-between mb-1.5">
          <Text className="text-xs text-subink font-sans-medium">{label || 'Progress'}</Text>
          <Text className="text-xs text-subink tabular-nums font-sans-medium">{Math.round(progress)}%</Text>
        </View>
      )}
      <View className={`w-full rounded-full bg-border/70 ${heightClass}`}>
        <View
          className={`rounded-full ${colorClass}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%`, height: '100%' }}
        />
      </View>
    </View>
  );
}
