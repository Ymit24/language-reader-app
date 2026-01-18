import { View, Text } from 'react-native';

interface StackedProgressBarProps {
  counts: {
    new: number;
    learning: number;
    known: number;
    ignored: number;
  };
  total: number;
}

export function StackedProgressBar({ counts, total }: StackedProgressBarProps) {
  if (total === 0) {
    return null;
  }

  const segments = [
    { key: 'known', label: 'Known', count: counts.known, color: 'bg-success' },
    { key: 'learning', label: 'Learning', count: counts.learning, color: 'bg-amber-500' },
    { key: 'new', label: 'New', count: counts.new, color: 'bg-blue-500' },
    { key: 'ignored', label: 'Ignored', count: counts.ignored, color: 'bg-gray-400' },
  ].filter(seg => seg.count > 0);

  const formatPercent = (count: number) => Math.round((count / total) * 100);

  return (
    <View className="w-full">
      <View className="h-3 w-full rounded-full flex-row overflow-hidden bg-border">
        {segments.map((segment) => {
          const width = (segment.count / total) * 100;
          return (
            <View
              key={segment.key}
              className={`h-full ${segment.color}`}
              style={{ width: `${width}%` }}
            />
          );
        })}
      </View>
      <View className="flex-row flex-wrap mt-2 gap-x-4 gap-y-1">
        {segments.map((segment) => (
          <View key={segment.key} className="flex-row items-center gap-1.5">
            <View className={`w-2.5 h-2.5 rounded-full ${segment.color}`} />
            <Text className="text-xs text-subink">
              {segment.label}: {formatPercent(segment.count)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
