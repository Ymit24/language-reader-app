import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/AppThemeProvider';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title?: string;
  message: string;
}

export function EmptyState({
  icon = 'document-text-outline',
  title,
  message,
}: EmptyStateProps) {
  const { colors } = useAppTheme();

  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      <View className="items-center gap-3">
        <View className="w-16 h-16 rounded-2xl bg-muted/30 items-center justify-center">
          <Ionicons name={icon} size={32} color={colors['--faint']} />
        </View>
        {title && (
          <Text className="text-lg font-sans-semibold text-ink tracking-tight text-center">
            {title}
          </Text>
        )}
        <Text className="text-sm text-subink font-sans-medium text-center max-w-xs">
          {message}
        </Text>
      </View>
    </View>
  );
}
