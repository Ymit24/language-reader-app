import React, { useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VocabStatus, getStatusLabel, getStatusColor } from './StatusBadge';
import { cn } from '../../lib/utils';

interface BulkActionBarProps {
  selectedCount: number;
  onSetStatus: (status: VocabStatus) => void;
  onDeselectAll: () => void;
  visible: boolean;
}

const STATUS_OPTIONS: { value: VocabStatus; label: string; icon: string }[] = [
  { value: 0, label: 'New', icon: 'sparkles' },
  { value: 1, label: 'Learning', icon: 'book' },
  { value: 3, label: 'Familiar', icon: 'star' },
  { value: 4, label: 'Known', icon: 'checkmark-circle' },
];

export function BulkActionBar({
  selectedCount,
  onSetStatus,
  onDeselectAll,
  visible,
}: BulkActionBarProps) {
  const [showStatusPicker, setShowStatusPicker] = useState(false);

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
          {/* Status picker button */}
          <Pressable
            onPress={() => setShowStatusPicker(!showStatusPicker)}
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
              color={showStatusPicker ? '#2f6b66' : '#524a43'}
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
              color={showStatusPicker ? '#2f6b66' : '#80776e'}
              style={{ marginLeft: 4 }}
            />
          </Pressable>

          {/* Deselect button */}
          <Pressable
            onPress={onDeselectAll}
            className="flex-row items-center px-3 py-2 rounded-lg bg-muted border border-border/70"
          >
            <Ionicons name="close" size={16} color="#524a43" />
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
              const color = getStatusColor(opt.value);
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    onSetStatus(opt.value);
                    setShowStatusPicker(false);
                  }}
                  className="flex-row items-center px-3 py-2 rounded-lg border border-border/70 bg-canvas active:bg-muted"
                >
                  <Ionicons name={opt.icon as any} size={16} color={color} />
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
