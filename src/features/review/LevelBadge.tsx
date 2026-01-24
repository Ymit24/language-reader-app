import React from 'react';
import { View, Text } from 'react-native';

interface LevelBadgeProps {
  level: number;
  title: string;
  size?: 'small' | 'medium' | 'large';
}

const LEVEL_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: '#f0ebe1', text: '#524a43', border: '#cdbfaf' },
  2: { bg: '#e6eef5', text: '#3c7da8', border: '#9bbbd2' },
  3: { bg: '#e8f5ef', text: '#1d6b4f', border: '#7ac4a5' },
  4: { bg: '#fdf1e1', text: '#b56a2c', border: '#d7a76a' },
  5: { bg: '#e4f1ef', text: '#2f6b66', border: '#7ab5af' },
  6: { bg: '#f4e3df', text: '#7a3f34', border: '#d2a39b' },
  7: { bg: '#e8e4f4', text: '#5b4b8a', border: '#a99ed2' },
  8: { bg: '#f4e6cf', text: '#7a4f1f', border: '#d4b078' },
  9: { bg: '#fce4ec', text: '#9b3b5a', border: '#e4a0b5' },
  10: { bg: '#fff3e0', text: '#e65100', border: '#ffb74d' },
};

export function LevelBadge({ level, title, size = 'medium' }: LevelBadgeProps) {
  const colors = LEVEL_COLORS[Math.min(level, 10)] || LEVEL_COLORS[1];
  
  const sizeStyles = {
    small: {
      container: 'px-2 py-0.5 rounded-md',
      level: 'text-[10px]',
      title: 'text-[10px]',
    },
    medium: {
      container: 'px-3 py-1 rounded-lg',
      level: 'text-xs',
      title: 'text-xs',
    },
    large: {
      container: 'px-4 py-2 rounded-xl',
      level: 'text-sm',
      title: 'text-sm',
    },
  };

  const styles = sizeStyles[size];

  return (
    <View
      className={`flex-row items-center gap-1.5 ${styles.container}`}
      style={{
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text
        className={`font-sans-bold ${styles.level}`}
        style={{ color: colors.text }}
      >
        Lv.{level}
      </Text>
      <Text
        className={`font-sans-semibold ${styles.title}`}
        style={{ color: colors.text }}
      >
        {title}
      </Text>
    </View>
  );
}
