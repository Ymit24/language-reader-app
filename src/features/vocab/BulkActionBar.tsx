import React, { useState } from 'react';
import { ActivityIndicator, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STATUS_OPTIONS, getStatusColor, type VocabStatus } from '@/src/lib/vocabStatus';
import { cn } from '../../lib/utils';
import { useAppTheme } from '@/src/theme/AppThemeProvider';

interface BulkActionBarProps {
  selectedCount: number;
  onSetStatus: (status: VocabStatus) => void;
  onDeselectAll: () => void;
  visible: boolean;
  isBusy?: boolean;
}

export function BulkActionBar({
  selectedCount,
  onSetStatus,
  onDeselectAll,
  visible,
  isBusy = false,
}: BulkActionBarProps) {
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const { colors } = useAppTheme();

  if (!visible) return null;

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-panel border-t border-border/70 shadow-lg">
      <View className="px-4 py-3 flex-row items-center justify-between">
        {/* Left: Selection count */}
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-brand items-center justify-center mr-2">
            <Text className="text-sm font-sans-bold text-white">{selectedCount}</Text>
          </View>
          <Text className="text-sm font-sans-semibold text-ink">
            {selectedCount === 1 ? 'word selected' : 'words selected'}
          </Text>
        </View>

        {/* Right: Actions */}
        <View className="flex-row items-center gap-2">
          {isBusy && (
            <View className="flex-row items-center gap-2 mr-1">
              <ActivityIndicator size="small" color={colors['--brand']} />
              <Text className="text-xs text-faint font-sans-medium">Updating...</Text>
            </View>
          )}
          {/* Status picker button */}
          <Pressable
            onPress={() => setShowStatusPicker(!showStatusPicker)}
            disabled={isBusy}
            className={cn(
              'flex-row items-center px-3 py-2 rounded-lg border',
              showStatusPicker
                ? 'bg-brandSoft border-brand/30'
                : 'bg-muted border-border/70'
            )}
          >
            <Ionicons
              name="flag"
              size={16}
              color={showStatusPicker ? colors['--brand'] : colors['--subink']}
            />
            <Text
              className={cn(
                'ml-2 text-sm font-sans-semibold',
                showStatusPicker ? 'text-brand' : 'text-subink'
              )}
            >
              Set Status
            </Text>
            <Ionicons
              name={showStatusPicker ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={showStatusPicker ? colors['--brand'] : colors['--faint']}
              style={{ marginLeft: 4 }}
            />
          </Pressable>

          {/* Deselect button */}
          <Pressable
            onPress={onDeselectAll}
            disabled={isBusy}
            className={cn(
              'flex-row items-center px-3 py-2 rounded-lg bg-muted border border-border/70',
              isBusy ? 'opacity-50' : ''
            )}
          >
            <Ionicons name="close" size={16} color={colors['--subink']} />
            <Text className="ml-1 text-sm font-sans-semibold text-subink">
              Deselect
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Status picker dropdown */}
      {showStatusPicker && (
        <View className="px-4 pb-4">
          <View className="flex-row flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const color = getStatusColor(opt.value, colors);
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    onSetStatus(opt.value);
                    setShowStatusPicker(false);
                  }}
                  disabled={isBusy}
                  className={cn(
                    'flex-row items-center px-3 py-2 rounded-lg border border-border/70 bg-canvas active:bg-muted',
                    isBusy ? 'opacity-50' : ''
                  )}
                >
                  <Ionicons
                    name={(opt.activeIcon ?? opt.icon) as any}
                    size={16}
                    color={color}
                  />
                  <Text
                    className="ml-2 text-sm font-sans-semibold"
                    style={{ color }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}
