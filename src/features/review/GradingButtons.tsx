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
  iconColor: string;
}

const GRADE_OPTIONS: GradeOption[] = [
  { quality: 1, label: 'Again', color: 'text-danger', bgColor: 'bg-dangerSoft', icon: 'refresh-circle', iconColor: '#B33A3A' },
  { quality: 3, label: 'Hard', color: 'text-vUnknownLine', bgColor: 'bg-vUnknownBg', icon: 'warning', iconColor: '#D97706' },
  { quality: 4, label: 'Good', color: 'text-vKnownLine', bgColor: 'bg-vKnownBg', icon: 'checkmark-circle', iconColor: '#4A7C59' },
  { quality: 5, label: 'Easy', color: 'text-brand', bgColor: 'bg-vLearningBg', icon: 'star', iconColor: '#C4643B' },
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
          <Ionicons name={option.icon as any} size={24} color={option.iconColor} />
          <Text className={`text-sm font-semibold mt-1 ${option.color}`}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
