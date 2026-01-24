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
      <View className="bg-panel rounded-3xl border border-border/80 shadow-pop p-8 w-full max-w-sm items-center">
        <View className="w-16 h-16 bg-successSoft rounded-full items-center justify-center mb-6">
          <Ionicons name="checkmark-circle" size={48} color="#1d6b4f" />
        </View>

        <Text className="text-2xl font-sans-bold text-ink mb-6">Session Complete</Text>

        <View className="flex-row gap-8 mb-8">
          <View className="items-center">
            <Text className="text-4xl font-sans-bold text-ink">{reviewedCount}</Text>
            <Text className="text-xs text-subink uppercase tracking-widest mt-1 font-sans-semibold">Reviewed</Text>
          </View>
          <View className="items-center">
            <Text className="text-4xl font-sans-bold text-ink">
              {averageEase.toFixed(1)}
            </Text>
            <Text className="text-xs text-subink uppercase tracking-widest mt-1 font-sans-semibold">Avg Ease</Text>
          </View>
        </View>

        <Button variant="primary" onPress={onContinue} className="w-full">
          Back to Review
        </Button>
      </View>
    </View>
  );
}
