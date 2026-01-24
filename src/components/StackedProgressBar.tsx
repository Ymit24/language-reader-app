import { View, Text } from 'react-native';

export interface VocabCounts {
  new: number;
  learning: number;
  known: number;
}

interface StackedProgressBarProps {
  counts: VocabCounts;
  total?: number;
  showLegend?: boolean;
  height?: number;
}

export function StackedProgressBar({
  counts,
  total,
  showLegend = true,
  height,
}: StackedProgressBarProps) {
  const actualTotal = total ?? counts.new + counts.learning + counts.known;

  if (actualTotal === 0) {
    return null;
  }

  const segments = [
    { key: 'known', label: 'Known', count: counts.known, color: 'bg-vKnownLine' },
    { key: 'learning', label: 'Learning', count: counts.learning, color: 'bg-vLearningLine' },
    { key: 'new', label: 'New', count: counts.new, color: 'bg-vUnknownLine' },
  ].filter(seg => seg.count > 0);

  const formatPercent = (count: number) => Math.round((count / actualTotal) * 100);

  const heightClass = height === 4 ? 'h-1' : height === 6 ? 'h-1.5' : 'h-0.75';

  return (
    <View className="w-full">
      <View className={`w-full rounded-full flex-row overflow-hidden bg-border/70 ${heightClass}`}>
        {segments.map((segment) => {
          const width = (segment.count / actualTotal) * 100;
          return (
            <View
              key={segment.key}
              className={`h-full ${segment.color}`}
              style={{ width: `${width}%` }}
            />
          );
        })}
      </View>
      {showLegend && (
        <View className="flex-row flex-wrap mt-2 gap-x-4 gap-y-1">
          {segments.map((segment) => (
            <View key={segment.key} className="flex-row items-center gap-1.5">
              <View className={`w-2.5 h-2.5 rounded-full ${segment.color}`} />
              <Text className="text-xs text-subink font-sans-medium">
                {segment.label}: {formatPercent(segment.count)}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
