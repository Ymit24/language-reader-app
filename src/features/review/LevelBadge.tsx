import React from 'react';
import { Text, View } from 'react-native';

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
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      levelSize: 10,
      titleSize: 10,
    },
    medium: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 8,
      levelSize: 12,
      titleSize: 12,
    },
    large: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      levelSize: 14,
      titleSize: 14,
    },
  };

  const styles = sizeStyles[size];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start', // Don't stretch to fill parent
        flexShrink: 0, // Never shrink
        paddingHorizontal: styles.paddingHorizontal,
        paddingVertical: styles.paddingVertical,
        borderRadius: styles.borderRadius,
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text
        style={{
          fontWeight: '700',
          fontSize: styles.levelSize,
          color: colors.text,
        }}
        numberOfLines={1}
      >
        Lv.{level}
      </Text>
      <View style={{ width: 6 }} />
      <Text
        style={{
          fontWeight: '600',
          fontSize: styles.titleSize,
          color: colors.text,
        }}
        numberOfLines={1}
      >
        {title}
      </Text>
    </View>
  );
}