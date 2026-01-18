import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GradingButtonsProps {
  onGrade: (quality: number) => void;
}

interface GradeOption {
  quality: number;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

const GRADE_OPTIONS: GradeOption[] = [
  { quality: 1, label: 'Again', color: 'text-red-700', bgColor: 'bg-red-100', icon: 'refresh-circle' },
  { quality: 3, label: 'Hard', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: 'warning' },
  { quality: 4, label: 'Good', color: 'text-green-700', bgColor: 'bg-green-100', icon: 'checkmark-circle' },
  { quality: 5, label: 'Easy', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: 'star' },
];

export function GradingButtons({ onGrade }: GradingButtonsProps) {
  return (
    <View className="flex-row gap-2 justify-center flex-wrap">
      {GRADE_OPTIONS.map((option) => (
        <Pressable
          key={option.quality}
          onPress={() => onGrade(option.quality)}
          className={`flex-1 min-w-[70px] py-4 px-3 rounded-xl items-center ${option.bgColor}`}
        >
          <Ionicons name={option.icon as any} size={24} color={option.color.replace('text-', '')} />
          <Text className={`text-sm font-semibold mt-1 ${option.color}`}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
