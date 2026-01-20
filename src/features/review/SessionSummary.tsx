import { View, Text } from 'react-native';
import { Button } from '@/src/components/Button';
import { Ionicons } from '@expo/vector-icons';

interface SessionSummaryProps {
  reviewedCount: number;
  averageEase: number;
  onContinue: () => void;
}

export function SessionSummary({ reviewedCount, averageEase, onContinue }: SessionSummaryProps) {
  return (
    <View className="flex-1 justify-center items-center px-8">
      <View className="bg-panel rounded-2xl border border-border shadow-lg p-8 w-full max-w-sm items-center">
        <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-6">
          <Ionicons name="checkmark-circle" size={48} color="#15803d" />
        </View>

        <Text className="text-2xl font-bold text-ink mb-6">Session Complete</Text>

        <View className="flex-row gap-8 mb-8">
          <View className="items-center">
            <Text className="text-4xl font-bold text-ink">{reviewedCount}</Text>
            <Text className="text-xs text-subink uppercase tracking-wide mt-1">Reviewed</Text>
          </View>
          <View className="items-center">
            <Text className="text-4xl font-bold text-ink">
              {averageEase.toFixed(1)}
            </Text>
            <Text className="text-xs text-subink uppercase tracking-wide mt-1">Avg Ease</Text>
          </View>
        </View>

        <Button variant="primary" onPress={onContinue} className="w-full">
          Back to Review
        </Button>
      </View>
    </View>
  );
}
