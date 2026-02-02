import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from '@/src/components/SafeAreaView';
import { useAppTheme } from '@/src/theme/AppThemeProvider';

export function SessionLoading() {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView className="flex-1 bg-canvas items-center justify-center">
      <View className="items-center gap-6">
        <View className="w-20 h-20 rounded-3xl bg-panel border border-border/40 items-center justify-center shadow-card">
          <ActivityIndicator size="small" color={colors['--brand']} />
        </View>
        <View className="items-center gap-2">
          <Text className="text-lg font-sans-semibold text-ink tracking-tight">
            Preparing Session
          </Text>
          <Text className="text-xs text-faint font-sans-bold uppercase tracking-[0.2em]">
            Gathering Cards
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
