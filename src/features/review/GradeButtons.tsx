import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

interface GradeButtonsProps {
  onGrade: (quality: number) => void;
  disabled?: boolean;
  showKeyboardHints?: boolean;
}

const grades = [
  { quality: 1, label: 'Again', shortcut: '1', color: 'bg-danger', textColor: 'text-white' },
  { quality: 2, label: 'Hard', shortcut: '2', color: 'bg-amber-700', textColor: 'text-white' },
  { quality: 4, label: 'Good', shortcut: '3', color: 'bg-success', textColor: 'text-white' },
  { quality: 5, label: 'Easy', shortcut: '4', color: 'bg-brand', textColor: 'text-white' },
];

export function GradeButtons({
  onGrade,
  disabled = false,
  showKeyboardHints = Platform.OS === 'web',
}: GradeButtonsProps) {
  const handleGrade = (quality: number) => {
    if (disabled) return;
    
    Haptics.impactAsync(
      quality >= 4 
        ? Haptics.ImpactFeedbackStyle.Light 
        : Haptics.ImpactFeedbackStyle.Medium
    );
    
    onGrade(quality);
  };

  // Keyboard shortcuts for web
  React.useEffect(() => {
    if (Platform.OS !== 'web' || disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const grade = grades.find((g) => g.shortcut === key);
      if (grade) {
        e.preventDefault();
        handleGrade(grade.quality);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled]);

  return (
    <View className="flex-row gap-2">
      {grades.map((grade) => (
        <Pressable
          key={grade.quality}
          onPress={() => handleGrade(grade.quality)}
          disabled={disabled}
          className={`flex-1 py-3.5 rounded-xl items-center justify-center ${grade.color} ${
            disabled ? 'opacity-50' : 'active:opacity-80'
          }`}
        >
          <Text className={`text-sm font-sans-bold ${grade.textColor}`}>
            {grade.label}
          </Text>
          {showKeyboardHints && (
            <Text className={`text-xs font-sans-medium mt-0.5 opacity-70 ${grade.textColor}`}>
              {grade.shortcut}
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}
